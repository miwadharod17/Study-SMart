const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const sanitizeHtml = require('sanitize-html');
const promClient = require('prom-client');
const winston = require('winston');
require('dotenv').config();

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'forum-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'forum-combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// Metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new promClient.Histogram({
    name: 'forum_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const questionCounter = new promClient.Counter({
    name: 'forum_questions_total',
    help: 'Total number of questions posted',
    labelNames: ['has_tags']
});

// Database
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// Metrics middleware
app.use((req, res, next) => {
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    });
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'forum' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Get all questions with pagination and filters
app.get('/api/questions', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { page = 1, limit = 20, sort = 'newest', tag, search } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT q.*, u.full_name as author_name, u.reputation,
                   COUNT(DISTINCT a.id) as answers_count
            FROM questions q
            LEFT JOIN answers a ON a.question_id = q.id
            LEFT JOIN users u ON u.id = q.author_id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (tag) {
            query += ` AND $${paramIndex} = ANY(q.tags)`;
            params.push(tag);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (q.title ILIKE $${paramIndex} OR q.content ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` GROUP BY q.id, u.full_name, u.reputation `;
        
        switch (sort) {
            case 'newest':
                query += ` ORDER BY q.created_at DESC`;
                break;
            case 'votes':
                query += ` ORDER BY q.votes DESC`;
                break;
            case 'unanswered':
                query += ` HAVING COUNT(DISTINCT a.id) = 0`;
                break;
            default:
                query += ` ORDER BY q.created_at DESC`;
        }
        
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM questions'
        );
        
        end({ method: 'GET', route: '/questions', status_code: 200 });
        res.json({
            questions: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching questions:', error);
        end({ method: 'GET', route: '/questions', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get single question with answers
app.get('/api/questions/:id', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        
        // Increment view count
        await pool.query(
            'UPDATE questions SET views = views + 1 WHERE id = $1',
            [id]
        );
        
        // Get question
        const questionResult = await pool.query(
            `SELECT q.*, u.full_name as author_name, u.reputation
             FROM questions q
             JOIN users u ON u.id = q.author_id
             WHERE q.id = $1`,
            [id]
        );
        
        if (questionResult.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        // Get answers
        const answersResult = await pool.query(
            `SELECT a.*, u.full_name as author_name, u.reputation
             FROM answers a
             JOIN users u ON u.id = a.author_id
             WHERE a.question_id = $1
             ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
            [id]
        );
        
        end({ method: 'GET', route: '/questions/:id', status_code: 200 });
        res.json({
            question: questionResult.rows[0],
            answers: answersResult.rows
        });
    } catch (error) {
        logger.error('Error fetching question:', error);
        end({ method: 'GET', route: '/questions/:id', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Create new question
app.post('/api/questions', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { title, content, authorId, tags } = req.body;
        
        if (!title || !content || !authorId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Sanitize content
        const sanitizedContent = sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code', 'pre']),
            allowedAttributes: {
                'a': ['href'],
                'img': ['src']
            }
        });
        
        const result = await pool.query(
            `INSERT INTO questions (title, content, author_id, tags)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, sanitizedContent, authorId, tags || []]
        );
        
        questionCounter.inc({ has_tags: tags && tags.length > 0 ? 'yes' : 'no' });
        
        // Emit via WebSocket
        io.emit('new_question', result.rows[0]);
        
        end({ method: 'POST', route: '/questions', status_code: 201 });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating question:', error);
        end({ method: 'POST', route: '/questions', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Vote on question
app.post('/api/questions/:id/vote', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        const { userId, voteType } = req.body; // voteType: 'up' or 'down'
        
        const increment = voteType === 'up' ? 1 : -1;
        
        const result = await pool.query(
            `UPDATE questions 
             SET votes = votes + $1
             WHERE id = $2
             RETURNING votes`,
            [increment, id]
        );
        
        end({ method: 'POST', route: '/questions/:id/vote', status_code: 200 });
        res.json({ votes: result.rows[0].votes });
    } catch (error) {
        logger.error('Error voting on question:', error);
        end({ method: 'POST', route: '/questions/:id/vote', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Create answer
app.post('/api/questions/:questionId/answers', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { questionId } = req.params;
        const { content, authorId } = req.body;
        
        const result = await pool.query(
            `INSERT INTO answers (question_id, content, author_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [questionId, content, authorId]
        );
        
        // Update answers count
        await pool.query(
            'UPDATE questions SET answers_count = answers_count + 1 WHERE id = $1',
            [questionId]
        );
        
        // Emit via WebSocket
        io.emit('new_answer', { questionId, answer: result.rows[0] });
        
        end({ method: 'POST', route: '/questions/:questionId/answers', status_code: 201 });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating answer:', error);
        end({ method: 'POST', route: '/questions/:questionId/answers', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Accept answer
app.post('/api/answers/:answerId/accept', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { answerId } = req.params;
        
        // Get question_id from answer
        const answer = await pool.query(
            'SELECT question_id FROM answers WHERE id = $1',
            [answerId]
        );
        
        if (answer.rows.length === 0) {
            return res.status(404).json({ error: 'Answer not found' });
        }
        
        // Mark answer as accepted
        await pool.query(
            'UPDATE answers SET is_accepted = true WHERE id = $1',
            [answerId]
        );
        
        // Mark question as resolved
        await pool.query(
            'UPDATE questions SET is_resolved = true WHERE id = $1',
            [answer.question_id]
        );
        
        end({ method: 'POST', route: '/answers/:answerId/accept', status_code: 200 });
        res.json({ message: 'Answer accepted successfully' });
    } catch (error) {
        logger.error('Error accepting answer:', error);
        end({ method: 'POST', route: '/answers/:answerId/accept', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get trending tags
app.get('/api/tags/trending', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const result = await pool.query(`
            SELECT UNNEST(tags) as tag, COUNT(*) as count
            FROM questions
            WHERE created_at > NOW() - INTERVAL '7 days'
            GROUP BY tag
            ORDER BY count DESC
            LIMIT 10
        `);
        
        end({ method: 'GET', route: '/tags/trending', status_code: 200 });
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching trending tags:', error);
        end({ method: 'GET', route: '/tags/trending', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    logger.info('New WebSocket connection');
    
    socket.on('join_question', (questionId) => {
        socket.join(`question_${questionId}`);
        logger.info(`Socket joined question: ${questionId}`);
    });
    
    socket.on('leave_question', (questionId) => {
        socket.leave(`question_${questionId}`);
    });
    
    socket.on('disconnect', () => {
        logger.info('WebSocket disconnected');
    });
});

// Database connection
pool.connect((err) => {
    if (err) {
        logger.error('Database connection error:', err);
    } else {
        logger.info('Connected to PostgreSQL');
    }
});

// Start server
httpServer.listen(PORT, () => {
    logger.info(`Forum service running on port ${PORT}`);
    logger.info(`WebSocket server ready`);
});

module.exports = { app, io };
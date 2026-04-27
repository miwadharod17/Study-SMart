const { Pool } = require('pg');
const sanitizeHtml = require('sanitize-html');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getAllQuestions = async (req, res) => {
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
        const countResult = await pool.query('SELECT COUNT(*) FROM questions');
        
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
        res.status(500).json({ error: error.message });
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query('UPDATE questions SET views = views + 1 WHERE id = $1', [id]);
        
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
        
        const answersResult = await pool.query(
            `SELECT a.*, u.full_name as author_name, u.reputation
             FROM answers a
             JOIN users u ON u.id = a.author_id
             WHERE a.question_id = $1
             ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`,
            [id]
        );
        
        res.json({
            question: questionResult.rows[0],
            answers: answersResult.rows
        });
    } catch (error) {
        logger.error('Error fetching question:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const authorId = req.user.id;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }
        
        const sanitizedContent = sanitizeHtml(content, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'code', 'pre']),
            allowedAttributes: { 'a': ['href'], 'img': ['src'] }
        });
        
        const result = await pool.query(
            `INSERT INTO questions (title, content, author_id, tags)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, sanitizedContent, authorId, tags || []]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating question:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const userId = req.user.id;
        
        const question = await pool.query('SELECT author_id FROM questions WHERE id = $1', [id]);
        
        if (question.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        if (question.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `UPDATE questions SET title = COALESCE($1, title), content = COALESCE($2, content)
             WHERE id = $3 RETURNING *`,
            [title, content, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating question:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const question = await pool.query('SELECT author_id FROM questions WHERE id = $1', [id]);
        
        if (question.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        if (question.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('DELETE FROM questions WHERE id = $1', [id]);
        
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        logger.error('Error deleting question:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.voteQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const increment = voteType === 'up' ? 1 : -1;
        
        const result = await pool.query(
            'UPDATE questions SET votes = votes + $1 WHERE id = $2 RETURNING votes',
            [increment, id]
        );
        
        res.json({ votes: result.rows[0].votes });
    } catch (error) {
        logger.error('Error voting on question:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getQuestionsByTag = async (req, res) => {
    try {
        const { tag } = req.params;
        
        const result = await pool.query(
            `SELECT q.*, u.full_name as author_name
             FROM questions q
             JOIN users u ON u.id = q.author_id
             WHERE $1 = ANY(q.tags)
             ORDER BY q.created_at DESC`,
            [tag]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching questions by tag:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getTrendingQuestions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT q.*, u.full_name as author_name,
                   (q.votes * 2 + q.answers_count * 3 + q.views * 0.5) as trending_score
            FROM questions q
            JOIN users u ON u.id = q.author_id
            WHERE q.created_at > NOW() - INTERVAL '7 days'
            ORDER BY trending_score DESC
            LIMIT 10
        `);
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching trending questions:', error);
        res.status(500).json({ error: error.message });
    }
};
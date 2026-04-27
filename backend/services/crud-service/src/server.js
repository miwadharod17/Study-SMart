const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const promClient = require('prom-client');
const winston = require('winston');
require('dotenv').config();

// Logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'crud-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'crud-combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// Metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new promClient.Histogram({
    name: 'crud_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

// Database
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
});

// Express app
const app = express();
const PORT = process.env.PORT || 3003;

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
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
    res.json({ status: 'healthy', service: 'crud' });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ============ USERS CRUD ============

// Register new user
app.post('/api/users/register', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { email, password, fullName, role } = req.body;
        
        // Validate email exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
            [email, hashedPassword, fullName, role || 'student', true]
        );
        
        // Generate JWT
        const token = jwt.sign(
            { id: result.rows[0].id, email, role: result.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        end({ method: 'POST', route: '/users/register', status_code: 201 });
        res.status(201).json({
            user: result.rows[0],
            token
        });
    } catch (error) {
        logger.error('Registration error:', error);
        end({ method: 'POST', route: '/users/register', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Login
app.post('/api/users/login', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        end({ method: 'POST', route: '/users/login', status_code: 200 });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            },
            token
        });
    } catch (error) {
        logger.error('Login error:', error);
        end({ method: 'POST', route: '/users/login', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/users/profile/:id', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT id, email, full_name, role, reputation, created_at, last_login
             FROM users WHERE id = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        end({ method: 'GET', route: '/users/profile', status_code: 200 });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching profile:', error);
        end({ method: 'GET', route: '/users/profile', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// ============ BOOKS CRUD ============

// Get all books with filters
app.get('/api/books', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { category, minPrice, maxPrice, condition, search, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT b.*, u.full_name as seller_name
            FROM books b
            JOIN users u ON u.id = b.seller_id
            WHERE b.is_active = true
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (category && category !== 'All') {
            query += ` AND b.category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }
        
        if (condition && condition !== 'All') {
            query += ` AND b.condition = $${paramIndex}`;
            params.push(condition);
            paramIndex++;
        }
        
        if (minPrice) {
            query += ` AND b.price >= $${paramIndex}`;
            params.push(minPrice);
            paramIndex++;
        }
        
        if (maxPrice) {
            query += ` AND b.price <= $${paramIndex}`;
            params.push(maxPrice);
            paramIndex++;
        }
        
        if (search) {
            query += ` AND (b.title ILIKE $${paramIndex} OR b.description ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }
        
        query += ` ORDER BY b.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        // Get total count
        const countQuery = 'SELECT COUNT(*) FROM books WHERE is_active = true';
        const countResult = await pool.query(countQuery);
        
        end({ method: 'GET', route: '/books', status_code: 200 });
        res.json({
            books: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
                pages: Math.ceil(countResult.rows[0].count / limit)
            }
        });
    } catch (error) {
        logger.error('Error fetching books:', error);
        end({ method: 'GET', route: '/books', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get single book
app.get('/api/books/:id', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT b.*, u.full_name as seller_name, u.email as seller_email
             FROM books b
             JOIN users u ON u.id = b.seller_id
             WHERE b.id = $1 AND b.is_active = true`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        end({ method: 'GET', route: '/books/:id', status_code: 200 });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching book:', error);
        end({ method: 'GET', route: '/books/:id', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Create book listing
app.post('/api/books', authenticateToken, upload.array('images', 5), async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { title, description, price, condition, category, stock } = req.body;
        const sellerId = req.user.id;
        
        // Handle image uploads (store URLs or base64)
        const images = req.files ? req.files.map(f => f.buffer.toString('base64')) : [];
        
        const result = await pool.query(
            `INSERT INTO books (title, description, price, condition, category, stock, seller_id, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description, price, condition, category, stock || 1, sellerId, images]
        );
        
        end({ method: 'POST', route: '/books', status_code: 201 });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating book:', error);
        end({ method: 'POST', route: '/books', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Update book
app.put('/api/books/:id', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        const { title, description, price, condition, category, stock } = req.body;
        
        // Verify ownership
        const book = await pool.query(
            'SELECT seller_id FROM books WHERE id = $1',
            [id]
        );
        
        if (book.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.rows[0].seller_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `UPDATE books 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 price = COALESCE($3, price),
                 condition = COALESCE($4, condition),
                 category = COALESCE($5, category),
                 stock = COALESCE($6, stock)
             WHERE id = $7
             RETURNING *`,
            [title, description, price, condition, category, stock, id]
        );
        
        end({ method: 'PUT', route: '/books/:id', status_code: 200 });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating book:', error);
        end({ method: 'PUT', route: '/books/:id', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Delete book
app.delete('/api/books/:id', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        
        // Soft delete
        const result = await pool.query(
            'UPDATE books SET is_active = false WHERE id = $1 RETURNING id',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        end({ method: 'DELETE', route: '/books/:id', status_code: 200 });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        logger.error('Error deleting book:', error);
        end({ method: 'DELETE', route: '/books/:id', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// ============ ORDERS CRUD ============

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { bookId, quantity, shippingAddress } = req.body;
        const buyerId = req.user.id;
        
        // Get book details
        const book = await pool.query(
            'SELECT price, seller_id FROM books WHERE id = $1 AND is_active = true',
            [bookId]
        );
        
        if (book.rows.length === 0) {
            return res.status(404).json({ error: 'Book not available' });
        }
        
        const totalAmount = book.rows[0].price * quantity;
        
        const result = await pool.query(
            `INSERT INTO orders (buyer_id, seller_id, book_id, quantity, total_amount, shipping_address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [buyerId, book.rows[0].seller_id, bookId, quantity, totalAmount, shippingAddress]
        );
        
        end({ method: 'POST', route: '/orders', status_code: 201 });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating order:', error);
        end({ method: 'POST', route: '/orders', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get user orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const userId = req.user.id;
        
        const result = await pool.query(
            `SELECT o.*, b.title as book_title, b.images[1] as book_image
             FROM orders o
             JOIN books b ON b.id = o.book_id
             WHERE o.buyer_id = $1 OR o.seller_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        end({ method: 'GET', route: '/orders', status_code: 200 });
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching orders:', error);
        end({ method: 'GET', route: '/orders', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Update order status
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        end({ method: 'PUT', route: '/orders/:id/status', status_code: 200 });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating order status:', error);
        end({ method: 'PUT', route: '/orders/:id/status', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Database connection test
pool.connect((err) => {
    if (err) {
        logger.error('Database connection error:', err);
    } else {
        logger.info('Connected to PostgreSQL database');
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`CRUD service running on port ${PORT}`);
});

module.exports = app;
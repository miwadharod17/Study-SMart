const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getAllBooks = async (req, res) => {
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
        const countResult = await pool.query('SELECT COUNT(*) FROM books WHERE is_active = true');
        
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
        res.status(500).json({ error: error.message });
    }
};

exports.getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT b.*, u.full_name as seller_name, u.email as seller_email, u.reputation
             FROM books b
             JOIN users u ON u.id = b.seller_id
             WHERE b.id = $1 AND b.is_active = true`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching book:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getBooksBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM books WHERE seller_id = $1 AND is_active = true ORDER BY created_at DESC`,
            [sellerId]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching seller books:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createBook = async (req, res) => {
    try {
        const { title, description, price, condition, category, stock } = req.body;
        const sellerId = req.user.id;
        
        // Handle image uploads (store as base64 or URLs)
        let images = [];
        if (req.files) {
            images = req.files.map(f => f.buffer.toString('base64'));
        }
        
        // Handle image URLs from form data
        if (req.body.imageUrls) {
            const urls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
            images = images.concat(urls.filter(url => url && url.trim()));
        }
        
        const result = await pool.query(
            `INSERT INTO books (title, description, price, condition, category, stock, seller_id, images)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [title, description, price, condition, category, stock || 1, sellerId, images]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating book:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, condition, category, stock } = req.body;
        const userId = req.user.id;
        
        const book = await pool.query('SELECT seller_id FROM books WHERE id = $1', [id]);
        
        if (book.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.rows[0].seller_id !== userId && req.user.role !== 'admin') {
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
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating book:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const book = await pool.query('SELECT seller_id FROM books WHERE id = $1', [id]);
        
        if (book.rows.length === 0) {
            return res.status(404).json({ error: 'Book not found' });
        }
        
        if (book.rows[0].seller_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('UPDATE books SET is_active = false WHERE id = $1', [id]);
        
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        logger.error('Error deleting book:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.searchBooks = async (req, res) => {
    try {
        const { query } = req.params;
        
        const result = await pool.query(
            `SELECT b.*, u.full_name as seller_name
             FROM books b
             JOIN users u ON u.id = b.seller_id
             WHERE b.is_active = true 
             AND (b.title ILIKE $1 OR b.description ILIKE $1)
             ORDER BY 
                 CASE 
                     WHEN b.title ILIKE $2 THEN 1
                     WHEN b.title ILIKE $3 THEN 2
                     ELSE 3
                 END
             LIMIT 50`,
            [`%${query}%`, `${query}%`, `%${query}%`]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error searching books:', error);
        res.status(500).json({ error: error.message });
    }
};
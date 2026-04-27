const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.getAllNotes = async (req, res) => {
    try {
        const { subject, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        
        let query = `
            SELECT n.*, u.full_name as author_name
            FROM notes n
            JOIN users u ON u.id = n.author_id
            WHERE n.is_active = true
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (subject) {
            query += ` AND n.subject = $${paramIndex}`;
            params.push(subject);
            paramIndex++;
        }
        
        query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(limit, offset);
        
        const result = await pool.query(query, params);
        
        res.json({
            notes: result.rows,
            pagination: { page, limit }
        });
    } catch (error) {
        logger.error('Error fetching notes:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT n.*, u.full_name as author_name
             FROM notes n
             JOIN users u ON u.id = n.author_id
             WHERE n.id = $1 AND n.is_active = true`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.createNote = async (req, res) => {
    try {
        const { title, description, subject, price, fileUrl } = req.body;
        const authorId = req.user.id;
        
        const result = await pool.query(
            `INSERT INTO notes (title, description, subject, price, file_url, author_id)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [title, description, subject, price, fileUrl, authorId]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, subject, price } = req.body;
        const userId = req.user.id;
        
        const note = await pool.query('SELECT author_id FROM notes WHERE id = $1', [id]);
        
        if (note.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        if (note.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            `UPDATE notes 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 subject = COALESCE($3, subject),
                 price = COALESCE($4, price)
             WHERE id = $5
             RETURNING *`,
            [title, description, subject, price, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const note = await pool.query('SELECT author_id FROM notes WHERE id = $1', [id]);
        
        if (note.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        if (note.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('UPDATE notes SET is_active = false WHERE id = $1', [id]);
        
        res.json({ message: 'Note deleted successfully' });
    } catch (error) {
        logger.error('Error deleting note:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.downloadNote = async (req, res) => {
    try {
        const { id } = req.params;
        
        const note = await pool.query('SELECT file_url, title FROM notes WHERE id = $1', [id]);
        
        if (note.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        // Increment download count
        await pool.query('UPDATE notes SET downloads = downloads + 1 WHERE id = $1', [id]);
        
        // Redirect to file URL or send file
        if (note.rows[0].file_url) {
            res.json({ downloadUrl: note.rows[0].file_url });
        } else {
            res.status(404).json({ error: 'File not available' });
        }
    } catch (error) {
        logger.error('Error downloading note:', error);
        res.status(500).json({ error: error.message });
    }
};
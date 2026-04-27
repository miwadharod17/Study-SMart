const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.createComment = async (req, res) => {
    try {
        const { answerId, content } = req.body;
        const authorId = req.user.id;
        
        const result = await pool.query(
            `INSERT INTO comments (answer_id, content, author_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [answerId, content, authorId]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating comment:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        
        const comment = await pool.query('SELECT author_id FROM comments WHERE id = $1', [id]);
        
        if (comment.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        if (comment.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            'UPDATE comments SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating comment:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const comment = await pool.query('SELECT author_id FROM comments WHERE id = $1', [id]);
        
        if (comment.rows.length === 0) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        
        if (comment.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('DELETE FROM comments WHERE id = $1', [id]);
        
        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        logger.error('Error deleting comment:', error);
        res.status(500).json({ error: error.message });
    }
};
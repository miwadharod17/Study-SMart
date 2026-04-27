const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.createAnswer = async (req, res) => {
    try {
        const { questionId } = req.params;
        const { content } = req.body;
        const authorId = req.user.id;
        
        const result = await pool.query(
            `INSERT INTO answers (question_id, content, author_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [questionId, content, authorId]
        );
        
        await pool.query(
            'UPDATE questions SET answers_count = answers_count + 1 WHERE id = $1',
            [questionId]
        );
        
        // Emit via WebSocket if needed
        const io = req.app.get('io');
        if (io) {
            io.emit('new_answer', { questionId, answer: result.rows[0] });
        }
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating answer:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;
        
        const answer = await pool.query('SELECT author_id FROM answers WHERE id = $1', [id]);
        
        if (answer.rows.length === 0) {
            return res.status(404).json({ error: 'Answer not found' });
        }
        
        if (answer.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            'UPDATE answers SET content = $1 WHERE id = $2 RETURNING *',
            [content, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating answer:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.deleteAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const answer = await pool.query('SELECT author_id, question_id FROM answers WHERE id = $1', [id]);
        
        if (answer.rows.length === 0) {
            return res.status(404).json({ error: 'Answer not found' });
        }
        
        if (answer.rows[0].author_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        await pool.query('DELETE FROM answers WHERE id = $1', [id]);
        await pool.query(
            'UPDATE questions SET answers_count = answers_count - 1 WHERE id = $1',
            [answer.rows[0].question_id]
        );
        
        res.json({ message: 'Answer deleted successfully' });
    } catch (error) {
        logger.error('Error deleting answer:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.voteAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { voteType } = req.body;
        const increment = voteType === 'up' ? 1 : -1;
        
        const result = await pool.query(
            'UPDATE answers SET votes = votes + $1 WHERE id = $2 RETURNING votes',
            [increment, id]
        );
        
        res.json({ votes: result.rows[0].votes });
    } catch (error) {
        logger.error('Error voting on answer:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.acceptAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const answer = await pool.query(
            'SELECT a.*, q.author_id as question_author FROM answers a JOIN questions q ON q.id = a.question_id WHERE a.id = $1',
            [id]
        );
        
        if (answer.rows.length === 0) {
            return res.status(404).json({ error: 'Answer not found' });
        }
        
        if (answer.rows[0].question_author !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only question author can accept answers' });
        }
        
        await pool.query('UPDATE answers SET is_accepted = true WHERE id = $1', [id]);
        await pool.query('UPDATE questions SET is_resolved = true WHERE id = $1', [answer.rows[0].question_id]);
        
        res.json({ message: 'Answer accepted successfully' });
    } catch (error) {
        logger.error('Error accepting answer:', error);
        res.status(500).json({ error: error.message });
    }
};
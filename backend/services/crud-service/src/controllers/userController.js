const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.register = async (req, res) => {
    try {
        const { email, password, fullName, role } = req.body;
        
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, is_verified)
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
            [email, hashedPassword, fullName, role || 'student', true]
        );
        
        const token = jwt.sign(
            { id: result.rows[0].id, email, role: result.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            user: result.rows[0],
            token
        });
    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
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
        
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
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
        res.status(500).json({ error: error.message });
    }
};

exports.getProfile = async (req, res) => {
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
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching profile:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName } = req.body;
        const userId = req.user.id;
        
        if (id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            'UPDATE users SET full_name = $1 WHERE id = $2 RETURNING id, email, full_name, role',
            [fullName, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating profile:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        const user = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
        
        const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, userId]);
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Error changing password:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getUserListings = async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT * FROM books WHERE seller_id = $1 AND is_active = true ORDER BY created_at DESC`,
            [id]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching user listings:', error);
        res.status(500).json({ error: error.message });
    }
};
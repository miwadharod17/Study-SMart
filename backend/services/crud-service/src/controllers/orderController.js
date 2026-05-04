const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

exports.createOrder = async (req, res) => {
    const client = await pool.connect();
    try {
        const { bookId, quantity, shippingAddress } = req.body;
        const buyerId = req.user.id;
        const qty = parseInt(quantity, 10) || 1;

        await client.query('BEGIN');

        const bookResult = await client.query(
            'SELECT price, seller_id, title, stock FROM books WHERE id = $1 AND is_active = true FOR UPDATE',
            [bookId]
        );

        if (bookResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Book not available' });
        }

        const book = bookResult.rows[0];

        if (qty <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        if (book.stock < qty) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Insufficient stock' });
        }

        const totalAmount = book.price * qty;

        const orderResult = await client.query(
            `INSERT INTO orders (buyer_id, seller_id, book_id, quantity, total_amount, shipping_address)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [buyerId, book.seller_id, bookId, qty, totalAmount, shippingAddress]
        );

        await client.query(
            `UPDATE books
             SET stock = stock - $1,
                 is_active = CASE WHEN stock - $1 <= 0 THEN false ELSE true END
             WHERE id = $2`,
            [qty, bookId]
        );

        await client.query('COMMIT');

        res.status(201).json(orderResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Error creating order:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(
            `SELECT o.*, b.title as book_title, b.images[1] as book_image,
                    u_seller.full_name as seller_name
             FROM orders o
             JOIN books b ON b.id = o.book_id
             JOIN users u_seller ON u_seller.id = o.seller_id
             WHERE o.buyer_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching user orders:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const result = await pool.query(
            `SELECT o.*, b.title as book_title, b.description, b.images,
                    u_buyer.full_name as buyer_name, u_buyer.email as buyer_email,
                    u_seller.full_name as seller_name, u_seller.email as seller_email
             FROM orders o
             JOIN books b ON b.id = o.book_id
             JOIN users u_buyer ON u_buyer.id = o.buyer_id
             JOIN users u_seller ON u_seller.id = o.seller_id
             WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)`,
            [id, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching order:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        
        const order = await pool.query('SELECT seller_id FROM orders WHERE id = $1', [id]);
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.rows[0].seller_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating order status:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        const order = await pool.query(
            'SELECT buyer_id, status FROM orders WHERE id = $1',
            [id]
        );
        
        if (order.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        if (order.rows[0].buyer_id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        if (order.rows[0].status !== 'pending') {
            return res.status(400).json({ error: 'Only pending orders can be cancelled' });
        }
        
        await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['cancelled', id]);
        
        res.json({ message: 'Order cancelled successfully' });
    } catch (error) {
        logger.error('Error cancelling order:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getSellerOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await pool.query(
            `SELECT o.*, b.title as book_title, u_buyer.full_name as buyer_name
             FROM orders o
             JOIN books b ON b.id = o.book_id
             JOIN users u_buyer ON u_buyer.id = o.buyer_id
             WHERE o.seller_id = $1
             ORDER BY o.created_at DESC`,
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching seller orders:', error);
        res.status(500).json({ error: error.message });
    }
};
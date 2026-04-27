const { Pool } = require('pg');
const crypto = require('crypto');
const logger = require('../utils/logger');

const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

function generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Create payment
exports.createPayment = async (req, res) => {
    try {
        const { amount, currency, orderId, userId, paymentMethod } = req.body;

        if (!amount || !orderId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const transactionId = generateTransactionId();
        const stripeAvailable = process.env.STRIPE_SECRET_KEY && 
                                process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder';

        let paymentIntent = null;
        let clientSecret = null;

        if (stripeAvailable) {
            try {
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(amount * 100),
                    currency: currency || 'inr',
                    metadata: { orderId, userId, transactionId }
                });
                clientSecret = paymentIntent.client_secret;
            } catch (stripeError) {
                logger.warn('Stripe error, falling back to mock mode:', stripeError.message);
            }
        }

        const result = await pool.query(
            `INSERT INTO payments (order_id, user_id, amount, currency, stripe_payment_id, status, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [orderId, userId, amount, currency, paymentIntent?.id || transactionId, 'pending', 
             JSON.stringify({ mode: stripeAvailable ? 'stripe' : 'mock', transactionId })]
        );

        res.json({
            paymentId: result.rows[0].id,
            transactionId: transactionId,
            amount: amount,
            currency: currency,
            clientSecret: clientSecret,
            mode: stripeAvailable ? 'stripe' : 'mock'
        });
    } catch (error) {
        logger.error('Payment creation failed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { paymentMethod } = req.body;

        const payment = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);

        if (payment.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const paymentData = payment.rows[0];
        const metadata = paymentData.metadata || {};

        await pool.query(
            `UPDATE payments SET status = 'completed', completed_at = NOW(), payment_method = $1 WHERE id = $2`,
            [paymentMethod || 'mock', paymentId]
        );

        await pool.query(
            `UPDATE orders SET status = 'paid', payment_id = $1 WHERE id = $2`,
            [paymentId, paymentData.order_id]
        );

        res.json({
            status: 'completed',
            paymentId: paymentId,
            message: 'Payment successful!'
        });
    } catch (error) {
        logger.error('Payment confirmation failed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get payment status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const result = await pool.query(
            `SELECT id, status, amount, currency, payment_method, created_at, completed_at, metadata
             FROM payments WHERE id = $1`,
            [paymentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching payment status:', error);
        res.status(500).json({ error: error.message });
    }
};

// Process refund
exports.processRefund = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);

        if (payment.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        const paymentData = payment.rows[0];

        if (paymentData.status !== 'completed') {
            return res.status(400).json({ error: 'Only completed payments can be refunded' });
        }

        await pool.query(`UPDATE payments SET status = 'refunded' WHERE id = $1`, [paymentId]);
        await pool.query(`UPDATE orders SET status = 'refunded' WHERE id = $1`, [paymentData.order_id]);

        res.json({
            refundId: 'REFUND_' + Date.now(),
            status: 'refunded',
            message: 'Refund processed successfully'
        });
    } catch (error) {
        logger.error('Refund failed:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get payment summary
exports.getPaymentSummary = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
                COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
                COALESCE(AVG(amount), 0) as avg_transaction_value
            FROM payments
            WHERE created_at > NOW() - INTERVAL '30 days'
        `);

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching payment summary:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get user payments
exports.getUserPayments = async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT id, amount, currency, status, payment_method, created_at, completed_at
             FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching user payments:', error);
        res.status(500).json({ error: error.message });
    }
};

// Handle Stripe webhook
exports.handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
        const Stripe = require('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                await pool.query(
                    `UPDATE payments SET status = 'completed', completed_at = NOW() 
                     WHERE stripe_payment_id = $1`,
                    [paymentIntent.id]
                );
                break;
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                await pool.query(
                    `UPDATE payments SET status = 'failed' WHERE stripe_payment_id = $1`,
                    [failedPayment.id]
                );
                break;
        }

        res.json({ received: true });
    } catch (err) {
        logger.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

// Handle mock webhook
exports.handleMockWebhook = async (req, res) => {
    const { paymentId, status } = req.body;

    await pool.query(
        `UPDATE payments SET status = $1, completed_at = NOW() WHERE id = $2`,
        [status, paymentId]
    );

    res.json({ received: true });
};
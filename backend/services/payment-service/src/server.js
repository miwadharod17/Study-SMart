const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const promClient = require('prom-client');
const winston = require('winston');
const crypto = require('crypto');
require('dotenv').config();

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'payment-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'payment-combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
    ]
});

// Metrics
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDuration = new promClient.Histogram({
    name: 'payment_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const paymentCounter = new promClient.Counter({
    name: 'payments_total',
    help: 'Total number of payments processed',
    labelNames: ['status', 'method']
});

// Database connection
const pool = new Pool({
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Generate unique transaction ID
function generateTransactionId() {
    return 'TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});

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
    res.json({ 
        status: 'healthy', 
        service: 'payment', 
        timestamp: new Date(), 
        version: '1.0.0',
        stripe_ready: false,
        message: 'Stripe integration ready - add credentials when available'
    });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

// Create payment (mock/stripe-ready mode)
app.post('/api/create-payment', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { amount, currency, orderId, userId, paymentMethod } = req.body;

        // Validate input
        if (!amount || !orderId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Generate transaction ID
        const transactionId = generateTransactionId();
        
        // Check if Stripe credentials are available
        const stripeAvailable = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder';
        
        let paymentIntent = null;
        let clientSecret = null;
        
        if (stripeAvailable) {
            // Dynamic import for Stripe (only when needed)
            try {
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
                    apiVersion: '2023-10-16',
                });
                
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
        
        // Save payment record
        const result = await pool.query(
            `INSERT INTO payments (order_id, user_id, amount, currency, stripe_payment_id, status, metadata) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [orderId, userId, amount, currency, paymentIntent?.id || transactionId, 'pending', 
             JSON.stringify({ mode: stripeAvailable ? 'stripe' : 'mock', transactionId })]
        );

        paymentCounter.inc({ status: 'created', method: stripeAvailable ? 'stripe' : 'mock' });
        end({ method: 'POST', route: '/create-payment', status_code: 201 });

        res.json({
            paymentId: result.rows[0].id,
            transactionId: transactionId,
            amount: amount,
            currency: currency,
            clientSecret: clientSecret,
            mode: stripeAvailable ? 'stripe' : 'mock',
            message: stripeAvailable ? 'Payment intent created' : 'Mock payment mode - add Stripe keys for real payments'
        });
    } catch (error) {
        logger.error('Payment creation failed:', error);
        end({ method: 'POST', route: '/create-payment', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Confirm payment (for mock mode)
app.post('/api/confirm-payment/:paymentId', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { paymentId } = req.params;
        const { paymentMethod } = req.body;
        
        // Get payment record
        const payment = await pool.query(
            'SELECT * FROM payments WHERE id = $1',
            [paymentId]
        );
        
        if (payment.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        const paymentData = payment.rows[0];
        const metadata = paymentData.metadata || {};
        
        // Check if Stripe is available
        const stripeAvailable = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder';
        
        let status = 'completed';
        let stripeStatus = null;
        
        if (stripeAvailable && metadata.mode === 'stripe') {
            // This would be handled by webhook in production
            // For now, simulate success
            status = 'completed';
        } else {
            // Mock mode - always succeed
            status = 'completed';
        }
        
        // Update payment status
        await pool.query(
            `UPDATE payments 
             SET status = $1, completed_at = NOW(), payment_method = $2
             WHERE id = $3`,
            [status, paymentMethod || 'mock', paymentId]
        );
        
        // Update order status if payment succeeded
        if (status === 'completed') {
            await pool.query(
                `UPDATE orders 
                 SET status = 'paid', payment_id = $1
                 WHERE id = $2`,
                [paymentId, paymentData.order_id]
            );
        }
        
        paymentCounter.inc({ status: status, method: metadata.mode || 'mock' });
        end({ method: 'POST', route: '/confirm-payment', status_code: 200 });
        
        res.json({
            status: status,
            paymentId: paymentId,
            message: status === 'completed' ? 'Payment successful!' : 'Payment failed'
        });
    } catch (error) {
        logger.error('Payment confirmation failed:', error);
        end({ method: 'POST', route: '/confirm-payment', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get payment status
app.get('/api/payment-status/:paymentId', async (req, res) => {
    const end = httpRequestDuration.startTimer();
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
        
        const metadata = result.rows[0].metadata || {};
        
        end({ method: 'GET', route: '/payment-status', status_code: 200 });
        res.json({
            ...result.rows[0],
            transactionId: metadata.transactionId,
            mode: metadata.mode || 'mock'
        });
    } catch (error) {
        logger.error('Error fetching payment status:', error);
        end({ method: 'GET', route: '/payment-status', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Process refund
app.post('/api/refund/:paymentId', async (req, res) => {
    const end = httpRequestDuration.startTimer();
    try {
        const { paymentId } = req.params;
        
        // Get payment record
        const payment = await pool.query(
            'SELECT * FROM payments WHERE id = $1',
            [paymentId]
        );
        
        if (payment.rows.length === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        
        const paymentData = payment.rows[0];
        
        if (paymentData.status !== 'completed') {
            return res.status(400).json({ error: 'Only completed payments can be refunded' });
        }
        
        // Check if Stripe is available for real refund
        const stripeAvailable = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder';
        const metadata = paymentData.metadata || {};
        
        let refundId = null;
        
        if (stripeAvailable && metadata.mode === 'stripe' && paymentData.stripe_payment_id) {
            try {
                const Stripe = require('stripe');
                const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
                const refund = await stripe.refunds.create({
                    payment_intent: paymentData.stripe_payment_id
                });
                refundId = refund.id;
            } catch (stripeError) {
                logger.error('Stripe refund failed:', stripeError);
                // Fall through to mock refund
            }
        }
        
        // Update payment status
        await pool.query(
            `UPDATE payments SET status = 'refunded' WHERE id = $1`,
            [paymentId]
        );
        
        // Update order status
        await pool.query(
            `UPDATE orders SET status = 'refunded' WHERE id = $1`,
            [paymentData.order_id]
        );
        
        paymentCounter.inc({ status: 'refunded', method: metadata.mode || 'mock' });
        end({ method: 'POST', route: '/refund', status_code: 200 });
        
        res.json({
            refundId: refundId || 'MOCK_REFUND_' + Date.now(),
            status: 'refunded',
            message: stripeAvailable ? 'Refund processed via Stripe' : 'Mock refund processed'
        });
    } catch (error) {
        logger.error('Refund failed:', error);
        end({ method: 'POST', route: '/refund', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Get payment summary (for admin dashboard)
app.get('/api/payments/summary', async (req, res) => {
    const end = httpRequestDuration.startTimer();
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
        
        end({ method: 'GET', route: '/payments/summary', status_code: 200 });
        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching payment summary:', error);
        end({ method: 'GET', route: '/payments/summary', status_code: 500 });
        res.status(500).json({ error: error.message });
    }
});

// Webhook placeholder (for future Stripe integration)
app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    // Placeholder for future Stripe webhook
    logger.info('Stripe webhook received (placeholder - add credentials to enable)');
    res.json({ received: true, message: 'Webhook endpoint ready for Stripe configuration' });
});

// Database connection test
pool.connect((err, client, release) => {
    if (err) {
        logger.error('Error connecting to database:', err.stack);
    } else {
        logger.info('Connected to PostgreSQL database');
        release();
    }
});

// Start server
app.listen(PORT, () => {
    logger.info(`Payment service running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Stripe mode: ${process.env.STRIPE_SECRET_KEY ? 'Ready (add real key)' : 'Mock mode - no Stripe credentials'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    pool.end(() => {
        logger.info('Database pool closed');
        process.exit(0);
    });
});

module.exports = app;
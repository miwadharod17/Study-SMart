const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const metrics = require('../middleware/metrics');

// Create payment intent
router.post('/create-payment', metrics.trackMetrics, paymentController.createPayment);

// Confirm payment
router.post('/confirm-payment/:paymentId', metrics.trackMetrics, paymentController.confirmPayment);

// Get payment status
router.get('/payment-status/:paymentId', metrics.trackMetrics, paymentController.getPaymentStatus);

// Process refund
router.post('/refund/:paymentId', auth.verifyToken, metrics.trackMetrics, paymentController.processRefund);

// Get payment summary (admin only)
router.get('/summary', auth.verifyToken, auth.isAdmin, metrics.trackMetrics, paymentController.getPaymentSummary);

// Get user payment history
router.get('/user/:userId', auth.verifyToken, metrics.trackMetrics, paymentController.getUserPayments);

module.exports = router;
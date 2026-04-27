const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Stripe webhook endpoint (raw body required)
router.post('/stripe', express.raw({ type: 'application/json' }), paymentController.handleStripeWebhook);

// Mock webhook for testing
router.post('/mock', express.json(), paymentController.handleMockWebhook);

module.exports = router;
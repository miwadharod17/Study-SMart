const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth.verifyToken, orderController.createOrder);

// Get user orders
router.get('/my-orders', auth.verifyToken, orderController.getUserOrders);

// Get order by ID
router.get('/:id', auth.verifyToken, orderController.getOrderById);

// Update order status
router.put('/:id/status', auth.verifyToken, orderController.updateOrderStatus);

// Cancel order
router.post('/:id/cancel', auth.verifyToken, orderController.cancelOrder);

// Get seller orders
router.get('/seller/orders', auth.verifyToken, orderController.getSellerOrders);

module.exports = router;
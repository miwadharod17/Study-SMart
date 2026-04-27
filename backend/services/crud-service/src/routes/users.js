const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// Register user
router.post('/register', userController.register);

// Login
router.post('/login', userController.login);

// Get profile
router.get('/profile/:id', auth.verifyToken, userController.getProfile);

// Update profile
router.put('/profile/:id', auth.verifyToken, userController.updateProfile);

// Change password
router.post('/change-password', auth.verifyToken, userController.changePassword);

// Get user listings
router.get('/:id/listings', auth.verifyToken, userController.getUserListings);

module.exports = router;
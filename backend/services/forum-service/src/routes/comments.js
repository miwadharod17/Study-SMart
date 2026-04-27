const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

// Create comment
router.post('/', auth.verifyToken, commentController.createComment);

// Update comment
router.put('/:id', auth.verifyToken, commentController.updateComment);

// Delete comment
router.delete('/:id', auth.verifyToken, commentController.deleteComment);

module.exports = router;
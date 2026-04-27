const express = require('express');
const router = express.Router();
const answerController = require('../controllers/answerController');
const auth = require('../middleware/auth');

// Create answer
router.post('/:questionId/answers', auth.verifyToken, answerController.createAnswer);

// Update answer
router.put('/answers/:id', auth.verifyToken, answerController.updateAnswer);

// Delete answer
router.delete('/answers/:id', auth.verifyToken, answerController.deleteAnswer);

// Vote on answer
router.post('/answers/:id/vote', auth.verifyToken, answerController.voteAnswer);

// Accept answer
router.post('/answers/:id/accept', auth.verifyToken, answerController.acceptAnswer);

module.exports = router;
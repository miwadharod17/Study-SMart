const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Get all questions (public)
router.get('/', questionController.getAllQuestions);

// Get trending questions
router.get('/trending', questionController.getTrendingQuestions);

// Get single question
router.get('/:id', questionController.getQuestionById);

// Create question (authenticated)
router.post('/', auth.verifyToken, validation.validateQuestion, questionController.createQuestion);

// Update question
router.put('/:id', auth.verifyToken, questionController.updateQuestion);

// Delete question
router.delete('/:id', auth.verifyToken, questionController.deleteQuestion);

// Vote on question
router.post('/:id/vote', auth.verifyToken, questionController.voteQuestion);

// Get questions by tag
router.get('/tag/:tag', questionController.getQuestionsByTag);

module.exports = router;
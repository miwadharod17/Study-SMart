const express = require('express');
const router = express.Router();
const noteController = require('../controllers/noteController');
const auth = require('../middleware/auth');

// Get all notes
router.get('/', noteController.getAllNotes);

// Get note by ID
router.get('/:id', noteController.getNoteById);

// Create note
router.post('/', auth.verifyToken, noteController.createNote);

// Update note
router.put('/:id', auth.verifyToken, noteController.updateNote);

// Delete note
router.delete('/:id', auth.verifyToken, noteController.deleteNote);

// Download note
router.get('/:id/download', auth.verifyToken, noteController.downloadNote);

module.exports = router;
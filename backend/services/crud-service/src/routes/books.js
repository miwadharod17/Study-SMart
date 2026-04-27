const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// Get all books (public)
router.get('/', bookController.getAllBooks);

// Get single book
router.get('/:id', bookController.getBookById);

// Get books by seller
router.get('/seller/:sellerId', bookController.getBooksBySeller);

// Create book (authenticated)
router.post('/', auth.verifyToken, upload.array('images', 5), bookController.createBook);

// Update book
router.put('/:id', auth.verifyToken, bookController.updateBook);

// Delete book
router.delete('/:id', auth.verifyToken, bookController.deleteBook);

// Search books
router.get('/search/:query', bookController.searchBooks);

module.exports = router;
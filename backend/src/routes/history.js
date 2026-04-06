const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get all history
router.get('/', historyController.getAll);

// Get one history entry
router.get('/:id', historyController.getOne);

// Delete one history entry
router.delete('/:id', historyController.delete);

// Clear all history
router.delete('/', historyController.clearAll);

module.exports = router;
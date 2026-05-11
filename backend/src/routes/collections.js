const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const collectionController = require('../controllers/collectionController');
const { authenticate } = require('../middleware/auth');
const { requireWorkspace } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);
router.use(requireWorkspace);

// Get all collections
router.get('/', collectionController.getAll);

// Get one collection
router.get('/:id', collectionController.getOne);

// Create collection
router.post('/', [
  body('name').trim().isLength({ min: 1 }),
  validate
], collectionController.create);

// Update collection
router.put('/:id', [
  body('name').optional().trim().isLength({ min: 1 }),
  validate
], collectionController.update);

// Delete collection
router.delete('/:id', collectionController.delete);

// Generate share link
router.post('/:id/share', collectionController.generateShareLink);

// Remove share link
router.delete('/:id/share', collectionController.removeShareLink);

// Export collection
router.get('/:id/export', collectionController.exportCollection);

// Import collection
router.post('/import', collectionController.importCollection);

module.exports = router;

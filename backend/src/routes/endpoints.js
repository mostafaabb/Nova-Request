const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const endpointController = require('../controllers/endpointController');
const { authenticate } = require('../middleware/auth');
const { requireWorkspace } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');

// All routes require authentication
router.use(authenticate);
router.use(requireWorkspace);

// Get all endpoints for a collection
router.get('/collection/:collectionId', endpointController.getAll);

// Get one endpoint
router.get('/:id', endpointController.getOne);

// Create endpoint
router.post('/collection/:collectionId', [
  body('name').trim().isLength({ min: 1 }),
  body('url').trim().isLength({ min: 1 }),
  validate
], endpointController.create);

// Update endpoint
router.put('/:id', endpointController.update);

// Delete endpoint
router.delete('/:id', endpointController.delete);

// Duplicate endpoint
router.post('/:id/duplicate', endpointController.duplicate);

module.exports = router;

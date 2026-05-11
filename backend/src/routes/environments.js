const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const environmentController = require('../controllers/environmentController');
const { authenticate } = require('../middleware/auth');
const { requireWorkspace, requireWorkspaceAdmin } = require('../middleware/workspace');
const { validate } = require('../middleware/validate');

router.use(authenticate);
router.use(requireWorkspace);

// Get all environments
router.get('/:id/environments', environmentController.getAll);

// Get one environment
router.get('/:id/environments/:envId', environmentController.getOne);

// Create environment
router.post('/:id/environments', [
  body('name').trim().isLength({ min: 1 }),
  validate
], environmentController.create);

// Update environment
router.put('/:id/environments/:envId', [
  body('name').optional().trim().isLength({ min: 1 }),
  validate
], environmentController.update);

// Delete environment
router.delete('/:id/environments/:envId', environmentController.delete);

module.exports = router;

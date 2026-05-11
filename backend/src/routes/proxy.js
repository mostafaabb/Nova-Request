const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');
const { optionalAuth } = require('../middleware/auth');
const { optionalWorkspace } = require('../middleware/workspace');

// Optional auth - saves to history if logged in
router.post('/', optionalAuth, optionalWorkspace, proxyController.executeRequest);

module.exports = router;

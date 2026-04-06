const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');
const { optionalAuth } = require('../middleware/auth');

// Optional auth - saves to history if logged in
router.post('/', optionalAuth, proxyController.executeRequest);

module.exports = router;
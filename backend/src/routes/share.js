const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// Get shared collection (public)
router.get('/:shareId', shareController.getSharedCollection);

module.exports = router;
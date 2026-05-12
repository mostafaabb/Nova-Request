const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2 }),
  validate
], authController.register);

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists(),
  validate
], authController.login);

// Google Sign-In (ID token from Google Identity Services)
router.post('/google', [
  body('credential').isString().notEmpty().withMessage('Google credential required'),
  validate
], authController.googleAuth);

// Get current user
router.get('/me', authenticate, authController.me);

module.exports = router;
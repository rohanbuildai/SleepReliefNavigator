const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter, strictLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../validators/authValidator');

// Public routes
router.post('/register', authLimiter, registerValidation, authController.register);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', strictLimiter, forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', strictLimiter, resetPasswordValidation, authController.resetPassword);
router.post('/logout', authController.logout);

// Email verification
router.get('/verify-email/:token', authController.verifyEmail);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.get('/sessions', authenticate, authController.getSessions);
router.post('/change-password', authenticate, authLimiter, authController.changePassword);
router.post('/logout-all-devices', authenticate, authController.logoutAllDevices);

module.exports = router;
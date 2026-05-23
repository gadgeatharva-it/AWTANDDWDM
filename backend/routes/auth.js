const express = require('express');
const { body, param } = require('express-validator');
const { register, login, getMe, forgotPassword, resetPassword, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginLimiter, passwordLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isString(),
  ],
  validate,
  register
);
router.post(
  '/login',
  loginLimiter,
  [body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(), body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

router.post('/forgot-password', passwordLimiter, [body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail()], validate, forgotPassword);
router.post(
  '/reset-password/:token',
  passwordLimiter,
  [param('token').notEmpty().withMessage('Token is required'), body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validate,
  resetPassword
);

module.exports = router;

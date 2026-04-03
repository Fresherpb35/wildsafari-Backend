// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { adminLoginRules, validate } = require('../middleware/validators');
const rateLimit = require('express-rate-limit');

// Strict rate limit for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Public
router.post('/login', loginLimiter, adminLoginRules, validate, ctrl.login);

// Protected
router.get ('/me',       protect, ctrl.getMe);
router.get ('/dashboard',protect, ctrl.getDashboard);

module.exports = router;

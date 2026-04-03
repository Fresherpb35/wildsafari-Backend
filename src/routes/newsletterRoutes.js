// ─── NEWSLETTER ROUTES ────────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/newsletterController');
const { protect } = require('../middleware/auth');
const { newsletterRules, validate } = require('../middleware/validators');

// Public
router.post('/subscribe',   newsletterRules, validate, ctrl.subscribe);
router.post('/unsubscribe', newsletterRules, validate, ctrl.unsubscribe);

// Admin-protected
router.get('/', protect, ctrl.getAllSubscribers);

module.exports = router;

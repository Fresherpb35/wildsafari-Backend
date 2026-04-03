// ─── CONTACT ROUTES ───────────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/contactController');
const { protect } = require('../middleware/auth');
const { contactRules, validate } = require('../middleware/validators');

// Public
router.post('/', contactRules, validate, ctrl.createContact);

// Admin-protected
router.get ('/',    protect, ctrl.getAllContacts);
router.get ('/:id', protect, ctrl.getContactById);
router.patch('/:id/status', protect, ctrl.updateContactStatus);
router.delete('/:id', protect, ctrl.deleteContact);

module.exports = router;

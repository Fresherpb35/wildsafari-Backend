// ─── BOOKING ROUTES ───────────────────────────────────────────────────────────
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { bookingRules, validate } = require('../middleware/validators');

// Public
router.post('/', bookingRules, validate, ctrl.createBooking);

// Admin-protected
router.get ('/',    protect, ctrl.getAllBookings);
router.get ('/:id', protect, ctrl.getBookingById);
router.patch('/:id/status',  ctrl.updateBookingStatus);
router.delete('/:id', protect, ctrl.deleteBooking);

module.exports = router;

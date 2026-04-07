const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const { bookingRules, validate } = require('../middleware/validators');

// ====================== PUBLIC ROUTES ======================
router.post('/', bookingRules, validate, ctrl.createBooking);
router.get('/stats', ctrl.getBookingStats);

// ====================== ADMIN PROTECTED ROUTES ======================
router.get('/', protect, ctrl.getAllBookings);
router.get('/:id', protect, ctrl.getBookingById);

// ✅ FULL UPDATE (This is what frontend Edit uses)
router.put('/:id', protect, ctrl.updateBooking || ((req, res) => {
  res.status(501).json({ success: false, message: "updateBooking controller not implemented yet" });
}));

// Optional: Status only update
router.patch('/:id/status', protect, ctrl.updateBookingStatus);

// Delete
router.delete('/:id', protect, ctrl.deleteBooking);

// Bulk delete
router.post('/bulk-delete', protect, ctrl.deleteBulkBookings || ((req, res) => {
  res.status(501).json({ success: false, message: "deleteBulkBookings not implemented" });
}));

module.exports = router;
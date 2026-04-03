// ─── BOOKING CONTROLLER ───────────────────────────────────────────────────────
const { prisma } = require('../config/db');
const email      = require('../config/email');
const logger     = require('../config/logger');

// POST /api/bookings  — public
async function createBooking(req, res, next) {
  try {
    const { name, email: userEmail, phone, safariDate, safariType, safariZone, safariTime } = req.body;

    const booking = await prisma.booking.create({
      data: {
        name,
        email:      userEmail,
        phone:      phone || null,
        safariDate: new Date(safariDate),
        safariType: safariType || 'GYPSY',
        safariZone,
        safariTime: safariTime || 'MORNING',
      },
    });

    // Fire emails (non-blocking — don't fail request if email fails)
    Promise.allSettled([
      email.sendBookingAlert(booking),//admin only
    ]).then(results => {
      results.forEach((r, i) => {
        if (r.status === 'rejected') logger.warn(`Booking email ${i} failed:`, r.reason?.message);
      });
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request received! We will confirm within 24 hours.',
      data:    { id: booking.id, status: booking.status },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings  — admin
async function getAllBookings(req, res, next) {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = status ? { status } : {};

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    return res.json({
      success: true,
      data:    bookings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/:id  — admin
async function getBookingById(req, res, next) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    return res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/status  — admin
async function updateBookingStatus(req, res, next) {
  try {
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(422).json({ success: false, message: 'Invalid status' });
    }

    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status },
    });

    // 🔥 ADD THIS BLOCK
  if (status === 'CONFIRMED' || status === 'CANCELLED') {
      try {
        await email.sendBookingConfirmation(booking);
        logger.info("📧 Confirmation email sent after status update");
      } catch (err) {
        logger.warn("❌ Confirmation email failed:", err.message);
      }
    }

    return res.json({
      success: true,
      message: `Booking ${status.toLowerCase()}`,
      data: booking,
    });

  } catch (err) {
    next(err);
  }
}

// DELETE /api/bookings/:id  — admin
async function deleteBooking(req, res, next) {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getAllBookings, getBookingById, updateBookingStatus, deleteBooking };

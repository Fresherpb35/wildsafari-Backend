// ─── BOOKING CONTROLLER ───────────────────────────────────────────────────────
const { prisma } = require('../config/db');
const email      = require('../config/email');
const logger     = require('../config/logger');

// POST /api/bookings  — public
async function createBooking(req, res, next) {
  try {
    const { name, email: userEmail, phone, safariDate, safariType, safariZone, safariTime, status = 'PENDING', notes } = req.body;

    const booking = await prisma.booking.create({
      data: {
        name,
        email:      userEmail,
        phone:      phone || null,
        safariDate: new Date(safariDate),
        safariType: safariType || 'GYPSY',
        safariZone,
        safariTime: safariTime || 'MORNING',
        status,
        notes:      notes || null,
      },
    });

    // ✅ FIX: Wait for emails BEFORE sending the response
    // Dono emails ko parallel mein bhejo par 'await' karo
    try {
      await Promise.all([
        email.sendBookingAlert(booking),
        email.sendBookingConfirmation(booking)
      ]);
      logger.info(`📧 Emails sent for booking: ${booking.id}`);
    } catch (mailErr) {
      // Agar mail fail bhi ho jaye, hum error log karenge 
      // par customer ko success response mil jayega kyunki booking DB mein ban chuki hai.
      logger.error(`❌ Email sending failed: ${mailErr.message}`);
    }

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
      pagination: { 
        total, 
        page: parseInt(page), 
        limit: parseInt(limit), 
        pages: Math.ceil(total / parseInt(limit)) 
      },
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

// PUT /api/bookings/:id  — Full Update (Used by Frontend Edit)
// PATCH /api/bookings/:id/status  — admin
// PUT /api/bookings/:id  — Full Update
// PUT /api/bookings/:id — Full Update
async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const data = req.body;

    const oldBooking = await prisma.booking.findUnique({ where: { id } });
    if (!oldBooking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        safariDate: data.safariDate ? new Date(data.safariDate) : undefined,
        safariType: data.safariType,
        safariZone: data.safariZone,
        safariTime: data.safariTime,
        status: data.status,
        notes: data.notes || null,
      },
    });

    // 🔥 FIX: Remove 'await' from email sending. Let it happen in the background.
    if (data.status && data.status !== oldBooking.status) {
      if (data.status === 'CONFIRMED' || data.status === 'CANCELLED') {
        // Hum await nahi kar rahe, seedha call kar rahe hain
        email.sendBookingStatusUpdate(updatedBooking)
          .then(() => logger.info(`📧 Email sent to ${updatedBooking.email}`))
          .catch((err) => logger.warn(`❌ Email failed:`, err.message));
      }
    }

    // Response turant bhej do, email background mein chalta rahega
    return res.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }
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
    return res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    next(err);
  }
}

// Bulk Delete
async function deleteBulkBookings(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty ids array" });
    }

    await prisma.booking.deleteMany({
      where: { id: { in: ids } }
    });

    return res.json({ 
      success: true, 
      message: `${ids.length} bookings deleted successfully` 
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings/stats
async function getBookingStats(req, res, next) {
  try {
    const [total, confirmed, pending, cancelled] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
    ]);

    return res.json({
      success: true,
      data: { total, confirmed, pending, cancelled },
    });
  } catch (err) {
    next(err);
  }
}

// Export all functions
module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,           // ← Now properly exported
  updateBookingStatus,
  deleteBooking,
  deleteBulkBookings,      // ← Added
  getBookingStats,
};
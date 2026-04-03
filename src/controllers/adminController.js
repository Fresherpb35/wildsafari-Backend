// ─── ADMIN CONTROLLER ─────────────────────────────────────────────────────────
const { prisma } = require('../config/db');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const logger     = require('../config/logger');

// POST /api/admin/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      logger.warn(`Failed login attempt for: ${email}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    logger.info(`Admin logged in: ${email}`);

    return res.json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/me  — protected
async function getMe(req, res) {
  return res.json({ success: true, admin: req.admin });
}

// GET /api/admin/dashboard  — protected
async function getDashboard(req, res, next) {
  try {
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalContacts,
      unreadContacts,
      totalSubscribers,
      recentBookings,
      recentContacts,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({ where: { status: 'CONFIRMED' } }),
      prisma.booking.count({ where: { status: 'CANCELLED' } }),
      prisma.contact.count(),
      prisma.contact.count({ where: { status: 'UNREAD' } }),
      prisma.newsletter.count({ where: { isActive: true } }),
      prisma.booking.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      prisma.contact.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);

    return res.json({
      success: true,
      data: {
        stats: {
          bookings: { total: totalBookings, pending: pendingBookings, confirmed: confirmedBookings, cancelled: cancelledBookings },
          contacts: { total: totalContacts, unread: unreadContacts },
          newsletter: { subscribers: totalSubscribers },
        },
        recentBookings,
        recentContacts,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, getMe, getDashboard };

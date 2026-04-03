// ─── NEWSLETTER CONTROLLER ────────────────────────────────────────────────────
const { prisma } = require('../config/db');
const email      = require('../config/email');
const logger     = require('../config/logger');

// POST /api/newsletter/subscribe  — public
async function subscribe(req, res, next) {
  try {
    const { email: userEmail } = req.body;

    const existing = await prisma.newsletter.findUnique({ where: { email: userEmail } });

    if (existing) {
      if (existing.isActive) {
        return res.json({ success: true, message: 'You are already subscribed!' });
      }
      // Re-subscribe
      await prisma.newsletter.update({ where: { email: userEmail }, data: { isActive: true } });
      return res.json({ success: true, message: 'Welcome back! You have been re-subscribed.' });
    }

    await prisma.newsletter.create({ data: { email: userEmail } });

    // Send welcome email (non-blocking)
    email.sendNewsletterWelcome(userEmail).catch(err =>
      logger.warn('Newsletter welcome email failed:', err.message)
    );

    return res.status(201).json({
      success: true,
      message: 'Subscribed! Welcome to the Wildlife Journal.',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/newsletter/unsubscribe  — public
async function unsubscribe(req, res, next) {
  try {
    const { email: userEmail } = req.body;

    const record = await prisma.newsletter.findUnique({ where: { email: userEmail } });
    if (!record) {
      return res.status(404).json({ success: false, message: 'Email not found in our list.' });
    }

    await prisma.newsletter.update({ where: { email: userEmail }, data: { isActive: false } });

    return res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (err) {
    next(err);
  }
}

// GET /api/newsletter  — admin
async function getAllSubscribers(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        where:   { isActive: true },
        orderBy: { subscribedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.newsletter.count({ where: { isActive: true } }),
    ]);

    return res.json({ success: true, data: subscribers, total });
  } catch (err) {
    next(err);
  }
}

module.exports = { subscribe, unsubscribe, getAllSubscribers };

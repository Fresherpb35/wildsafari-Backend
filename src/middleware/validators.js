// ─── VALIDATORS ──────────────────────────────────────────────────────────────
const { body, validationResult } = require('express-validator');

// Run results and return errors if any
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors:  errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// ── Booking rules ─────────────────────────────────────────────────────────────
const bookingRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }).withMessage('Name too long'),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('phone')
    .optional()
    .matches(/^[+\d\s\-()]{7,20}$/).withMessage('Invalid phone number'),

  body('safariDate')
    .notEmpty().withMessage('Safari date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((val) => {
      const d = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d < today) throw new Error('Safari date cannot be in the past');
      return true;
    }),

  body('safariType')
    .optional()
    .isIn(['GYPSY', 'CANTER']).withMessage('Invalid safari type'),

  body('safariZone')
    .notEmpty().withMessage('Zone is required')
    .matches(/^Zone\s([1-9]|10)$/).withMessage('Invalid zone (Zone 1–10)'),

  body('safariTime')
    .optional()
    .isIn(['MORNING', 'EVENING']).withMessage('Invalid safari time'),
];

// ── Contact rules ─────────────────────────────────────────────────────────────
const contactRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required')
    .isLength({ max: 100 }),

  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),

  body('message')
    .trim().notEmpty().withMessage('Message is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10–2000 characters'),
];

// ── Newsletter rules ──────────────────────────────────────────────────────────
const newsletterRules = [
  body('email')
    .trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
];

// ── Admin login rules ─────────────────────────────────────────────────────────
const adminLoginRules = [
  body('email').trim().isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

module.exports = {
  validate,
  bookingRules,
  contactRules,
  newsletterRules,
  adminLoginRules,
};

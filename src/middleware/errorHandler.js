// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error(`${err.message} — ${req.method} ${req.originalUrl}`, err);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'A record with this data already exists.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  const statusCode = err.statusCode || 500;
  const message    = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Something went wrong on the server.'
    : err.message;

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;

// ─── SERVER ENTRY POINT ───────────────────────────────────────────────────────
require('dotenv').config();

const app        = require('./app');
const logger     = require('./config/logger');
const { prisma } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test DB connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  await prisma.$disconnect();
  process.exit(0);
}

startServer();

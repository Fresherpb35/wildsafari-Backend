const winston = require('winston');

const transports = [
  new winston.transports.Console(), // always allowed
];

// ❌ Only use file logging in local (NOT in Vercel)
if (process.env.NODE_ENV !== 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');

  transports.push(
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    })
  );
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports,
});

module.exports = logger;
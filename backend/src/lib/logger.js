const pino = require('pino');
const config = require('../config');

const initializeLogger = () => {
  const logger = pino({
    level: config.logging.level,
    transport: process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    base: {
      env: process.env.NODE_ENV || 'development',
    },
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'token', 'secret'],
      censor: '[REDACTED]',
    },
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  });
  
  return logger;
};

module.exports = { initializeLogger };
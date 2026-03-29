const Sentry = require('@sentry/node');
const config = require('../config');

const initializeSentry = (logger) => {
  if (!config.sentry.dsn) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return;
  }
  
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out health check errors
      if (event.request?.url?.includes('/health')) {
        return null;
      }
      
      // Remove sensitive data
      if (event.user) {
        delete event.user.email;
        delete event.user.username;
      }
      
      return event;
    },
  });
  
  // Global error handler
  Sentry.setupExpressErrorHandler(app => {
    app.use((err, req, res, next) => {
      logger.error({
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
      }, 'Sentry captured error');
      
      if (!res.headersSent) {
        res.status(500).send('Internal Server Error');
      }
    });
  });
  
  console.log('Sentry initialized');
  return Sentry;
};

module.exports = { initializeSentry };
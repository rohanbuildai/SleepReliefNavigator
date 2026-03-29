const Sentry = require('@sentry/node');
const config = require('../config');

const initializeSentry = (logger) => {
  if (!config.sentry.dsn) {
    console.log('Sentry DSN not configured, skipping Sentry initialization');
    return null;
  }
  
  Sentry.init({
    dsn: config.sentry.dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [],
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

  // Create error handler that logs and forwards to Sentry
  const sentryErrorHandler = (err, req, res, next) => {
    if (logger) {
      logger.error({
        error: err.message,
        stack: err.stack,
        requestId: req.requestId,
      }, 'Sentry captured error');
    }
    
    // Let Sentry capture the exception
    Sentry.captureException(err, {
      extra: {
        requestId: req.requestId,
        path: req.path,
        method: req.method,
      },
    });

    if (!res.headersSent) {
      res.status(err.status || 500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: process.env.NODE_ENV === 'production' 
            ? 'An unexpected error occurred' 
            : err.message,
        },
      });
    }
  };

  console.log('Sentry initialized');
  return { Sentry, sentryErrorHandler };
};

module.exports = { initializeSentry };
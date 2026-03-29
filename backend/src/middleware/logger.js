const { AsyncResource } = require('async_hooks');

// Request logging middleware
const requestLogger = (logger) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Log request
    logger.info({
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      query: req.query,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }, 'Incoming request');
    
    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      logger.info({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      }, 'Request completed');
    });
    
    next();
  };
};

module.exports = { requestLogger };
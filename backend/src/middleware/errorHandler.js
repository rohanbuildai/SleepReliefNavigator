const { ApiError } = require('../utils/ApiError');

// Global error handler middleware
const errorHandler = (logger) => {
  return (err, req, res, next) => {
    // Log the error
    logger.error({
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code,
      },
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    }, 'Request error');
    
    // Handle known API errors
    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
        requestId: req.requestId,
      });
    }
    
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: messages.join(', '),
          details: err.errors,
        },
        requestId: req.requestId,
      });
    }
    
    // Handle Mongoose duplicate key errors
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ERROR',
          message: `${field} already exists`,
        },
        requestId: req.requestId,
      });
    }
    
    // Handle Mongoose cast errors (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid resource ID format',
        },
        requestId: req.requestId,
      });
    }
    
    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid authentication token',
        },
        requestId: req.requestId,
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Authentication token has expired',
        },
        requestId: req.requestId,
      });
    }
    
    // Handle Stripe errors
    if (err.type && err.type.startsWith('Stripe')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PAYMENT_ERROR',
          message: err.message,
        },
        requestId: req.requestId,
      });
    }
    
    // Handle CORS errors
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CORS_ERROR',
          message: 'Origin not allowed',
        },
        requestId: req.requestId,
      });
    }
    
    // Handle rate limit errors
    if (err.statusCode === 429) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later',
        },
        requestId: req.requestId,
      });
    }
    
    // Default error response
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500
      ? 'An unexpected error occurred'
      : err.message;
    
    res.status(statusCode).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: message,
      },
      requestId: req.requestId,
    });
  };
};

module.exports = { errorHandler };
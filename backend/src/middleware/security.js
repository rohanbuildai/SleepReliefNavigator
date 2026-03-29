// Security-related middleware
const helmet = require('helmet');

// Additional security headers/middleware beyond Helmet
const securityHeaders = (req, res, next) => {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=()');
  
  next();
};

// Validate request content type for API routes
const validateContentType = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_MEDIA_TYPE',
          message: 'Content-Type must be application/json',
        },
      });
    }
  }
  next();
};

// Prevent parameter pollution
const sanitizeQueryParams = (req, res, next) => {
  // Whitelist allowed query parameters (optional, can be customized per route)
  const allowedParams = ['page', 'limit', 'sort', 'order', 'search', 'filter'];
  
  // Remove any unknown parameters (optional security measure)
  // This can be enabled for specific routes where you want strict parameter control
  
  next();
};

// Prevent nosql injection in MongoDB queries
const preventNoSQLInjection = (req, res, next) => {
  const checkValue = (value) => {
    if (typeof value === 'string') {
      // Check for MongoDB operators in strings
      if (value.includes('$') && value.match(/\$[a-z]+\s*:/i)) {
        return false;
      }
    }
    return true;
  };
  
  const checkObject = (obj) => {
    for (const key of Object.keys(obj)) {
      if (!checkValue(key) || !checkValue(obj[key])) {
        return false;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (!checkObject(obj[key])) return false;
      }
    }
    return true;
  };
  
  if (req.body && !checkObject(req.body)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'Invalid input detected',
      },
    });
  }
  
  next();
};

module.exports = {
  securityHeaders,
  validateContentType,
  sanitizeQueryParams,
  preventNoSQLInjection,
};
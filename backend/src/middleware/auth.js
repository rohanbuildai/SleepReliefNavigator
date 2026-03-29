const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { ApiError } = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Access token required');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new ApiError(401, 'Access token required');
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Access token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApiError(401, 'Invalid access token');
      }
      throw new ApiError(401, 'Authentication failed');
    }
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new ApiError(401, 'User not found');
    }
    
    if (user.isDeleted) {
      throw new ApiError(401, 'Account has been deleted');
    }
    
    // Attach user to request
    req.user = user;
    req.userId = user._id;
    req.tokenData = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.userId);
      
      if (user && !user.isDeleted) {
        req.user = user;
        req.userId = user._id;
        req.tokenData = decoded;
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate, optionalAuth };
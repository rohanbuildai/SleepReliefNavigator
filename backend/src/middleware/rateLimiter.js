const rateLimit = require('express-rate-limit');
const config = require('../config');

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: config.rateLimit.general.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
});

// Auth routes limiter (stricter)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    // Use IP + email for more granular limiting on auth
    return `${req.ip}-${req.body?.email || 'unknown'}`;
  },
});

// Quiz limiter (moderate)
const quizLimiter = rateLimit({
  windowMs: config.rateLimit.quiz.windowMs,
  max: config.rateLimit.quiz.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many quiz submissions, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for sensitive operations (password reset, etc.)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts, please try again in an hour',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook limiter (for Stripe webhooks - should be IP-based)
const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Webhook rate limit exceeded',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip;
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  quizLimiter,
  strictLimiter,
  webhookLimiter,
};
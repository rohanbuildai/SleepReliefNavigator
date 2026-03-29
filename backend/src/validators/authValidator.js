const { body, param, query, validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

// Validation result handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => {
      if (err.path) {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });
    
    throw new ApiError(400, errorMessages.join(', '));
  }
  
  next();
};

// Auth validations
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('First name must be less than 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be less than 50 characters'),
  handleValidation,
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidation,
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidation,
];

const resetPasswordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  handleValidation,
];

// Quiz validation
const quizStepValidation = [
  body('sessionId')
    .isMongoId()
    .withMessage('Valid session ID required'),
  body('step')
    .isInt({ min: 0 })
    .withMessage('Step must be a number'),
  body('responses')
    .isObject()
    .withMessage('Responses must be an object'),
  handleValidation,
];

const quizCompleteValidation = [
  body('sessionId')
    .isMongoId()
    .withMessage('Valid session ID required'),
  body('answers')
    .isObject()
    .withMessage('Answers must be an object'),
  body('safetyFlags')
    .optional()
    .isArray()
    .withMessage('Safety flags must be an array'),
  body('emailCaptured')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required if provided'),
  handleValidation,
];

// Outcome log validation
const outcomeLogValidation = [
  body('planId')
    .optional()
    .isMongoId()
    .withMessage('Valid plan ID required'),
  body('nightDate')
    .isISO8601()
    .withMessage('Valid date required'),
  body('interventionsAttempted')
    .optional()
    .isArray()
    .withMessage('Interventions must be an array'),
  body('sleepOnsetMinutes')
    .optional()
    .isInt({ min: 0, max: 480 })
    .withMessage('Invalid sleep onset time'),
  body('totalSleepHours')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('Invalid sleep hours'),
  body('sleepQuality')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Sleep quality must be 1-5'),
  body('morningGrogginess')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Grogginess must be 1-5'),
  handleValidation,
];

// ID param validation
const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Valid ID required'),
  handleValidation,
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  quizStepValidation,
  quizCompleteValidation,
  outcomeLogValidation,
  mongoIdValidation,
  paginationValidation,
};
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const quizRoutes = require('./quiz');
const planRoutes = require('./plans');
const evidenceRoutes = require('./evidence');
const billingRoutes = require('./billing');
const webhookRoutes = require('./webhooks');
const outcomeRoutes = require('./outcomes');
const adminRoutes = require('./admin');
const userRoutes = require('./users');

// Mount routes
router.use('/auth', authRoutes);
router.use('/quiz', quizRoutes);
router.use('/plans', planRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/billing', billingRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/outcomes', outcomeRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Sleep Relief Navigator API',
      version: '1.0.0',
      status: 'operational',
      documentation: '/api/v1/docs',
    },
  });
});

module.exports = router;
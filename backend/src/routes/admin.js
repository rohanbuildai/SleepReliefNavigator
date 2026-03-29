const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const Intervention = require('../models/Intervention');
const RecommendationRule = require('../models/RecommendationRule');
const SleepProfile = require('../models/SleepProfile');
const User = require('../models/User');
const QuizSession = require('../models/QuizSession');
const Subscription = require('../models/Subscription');
const AuditLog = require('../models/AuditLog');
const GeneratedPlan = require('../models/GeneratedPlan');
const AuditLogModel = require('../models/AuditLog');

// All admin routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard overview
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeSubscriptions,
    totalQuizzes,
    totalPlans,
    recentLogins,
  ] = await Promise.all([
    User.countDocuments({ isDeleted: { $ne: true } }),
    Subscription.countDocuments({ status: 'active' }),
    QuizSession.countDocuments(),
    GeneratedPlan.countDocuments(),
    AuditLogModel.countDocuments({
      action: 'login',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }),
  ]);
  
  res.json({
    success: true,
    data: {
      totalUsers,
      activeSubscriptions,
      totalQuizzes,
      totalPlans,
      recentLogins,
      timestamp: new Date(),
    },
  });
}));

// Get all interventions with edit capability
router.get('/interventions', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [interventions, total] = await Promise.all([
    Intervention.find()
      .sort({ category: 1, sortOrder: 1 })
      .skip(skip)
      .limit(limit),
    Intervention.countDocuments(),
  ]);
  
  res.json({
    success: true,
    data: {
      interventions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Create intervention
router.post('/interventions', asyncHandler(async (req, res) => {
  const intervention = await Intervention.create(req.body);
  
  await AuditLogModel.create({
    userId: req.userId,
    action: 'create_intervention',
    resource: 'intervention',
    resourceId: intervention._id,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });
  
  res.status(201).json({
    success: true,
    data: { intervention },
  });
}));

// Update intervention
router.patch('/interventions/:id', asyncHandler(async (req, res) => {
  const intervention = await Intervention.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  if (!intervention) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Intervention not found' },
    });
  }
  
  await AuditLogModel.create({
    userId: req.userId,
    action: 'update_intervention',
    resource: 'intervention',
    resourceId: intervention._id,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });
  
  res.json({
    success: true,
    data: { intervention },
  });
}));

// Delete intervention (soft delete)
router.delete('/interventions/:id', asyncHandler(async (req, res) => {
  const intervention = await Intervention.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  
  if (!intervention) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Intervention not found' },
    });
  }
  
  await AuditLogModel.create({
    userId: req.userId,
    action: 'delete_intervention',
    resource: 'intervention',
    resourceId: intervention._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });
  
  res.json({
    success: true,
    data: { message: 'Intervention archived' },
  });
}));

// Get recommendation rules
router.get('/rules', asyncHandler(async (req, res) => {
  const rules = await RecommendationRule.find()
    .sort({ type: 1, priority: 1 });
  
  res.json({
    success: true,
    data: { rules },
  });
}));

// Create recommendation rule
router.post('/rules', asyncHandler(async (req, res) => {
  const rule = await RecommendationRule.create(req.body);
  
  await AuditLogModel.create({
    userId: req.userId,
    action: 'create_rule',
    resource: 'recommendation_rule',
    resourceId: rule._id,
    changes: req.body,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });
  
  res.status(201).json({
    success: true,
    data: { rule },
  });
}));

// Update recommendation rule
router.patch('/rules/:id', asyncHandler(async (req, res) => {
  const rule = await RecommendationRule.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  if (!rule) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Rule not found' },
    });
  }
  
  res.json({
    success: true,
    data: { rule },
  });
}));

// Get sleep profiles
router.get('/profiles', asyncHandler(async (req, res) => {
  const profiles = await SleepProfile.find().sort({ priority: 1 });
  
  res.json({
    success: true,
    data: { profiles },
  });
}));

// Get users list (admin only, paginated)
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find({ isDeleted: { $ne: true } })
      .select('-password -emailVerificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ isDeleted: { $ne: true } }),
  ]);
  
  res.json({
    success: true,
    data: {
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get audit logs
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  const action = req.query.action;
  const query = {};
  
  if (action) {
    query.action = action;
  }
  
  const [logs, total] = await Promise.all([
    AuditLogModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'email firstName'),
    AuditLogModel.countDocuments(query),
  ]);
  
  res.json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}));

// Get analytics summary
router.get('/analytics', asyncHandler(async (req, res) => {
  // Get data for last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  const [
    quizStarts,
    quizCompletions,
    planGenerations,
    subscriptionsLast30Days,
    revenueLast30Days,
    profileDistribution,
  ] = await Promise.all([
    QuizSession.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    QuizSession.countDocuments({ 
      status: 'completed',
      completedAt: { $gte: thirtyDaysAgo },
    }),
    GeneratedPlan.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Subscription.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo },
      status: 'active',
    }),
    Subscription.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thirtyDaysAgo },
          status: 'active',
        },
      },
      { $group: { _id: null, total: { $sum: '$priceAmount' } } },
    ]),
    GeneratedPlan.aggregate([
      { $group: { _id: '$profileSlug', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);
  
  res.json({
    success: true,
    data: {
      period: 'last_30_days',
      quizStarts,
      quizCompletions,
      completionRate: quizStarts > 0 ? Math.round((quizCompletions / quizStarts) * 100) : 0,
      planGenerations,
      newSubscriptions: subscriptionsLast30Days,
      estimatedRevenue: revenueLast30Days[0]?.total / 100 || 0,
      profileDistribution,
    },
  });
}));

// Update user role (for making someone admin)
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_ROLE', message: 'Invalid role' },
    });
  }
  
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: { code: 'USER_NOT_FOUND', message: 'User not found' },
    });
  }
  
  await AuditLogModel.create({
    userId: req.userId,
    action: 'change_user_role',
    resource: 'user',
    resourceId: user._id,
    changes: { role },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    success: true,
  });
  
  res.json({
    success: true,
    data: { user },
  });
}));

module.exports = router;
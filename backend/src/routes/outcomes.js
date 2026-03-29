const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { outcomeLogValidation, mongoIdValidation } = require('../validators/authValidator');
const OutcomeLog = require('../models/OutcomeLog');
const AuditLog = require('../models/AuditLog');

// Create outcome log
router.post('/', authenticate, outcomeLogValidation, asyncHandler(async (req, res) => {
  const {
    planId,
    nightDate,
    interventionsAttempted,
    sleepOnsetMinutes,
    totalSleepHours,
    sleepQuality,
    morningGrogginess,
    alertness,
    outcomes,
    notes,
    context,
    whatHelped,
    whatDidntHelp,
  } = req.body;
  
  const log = await OutcomeLog.create({
    userId: req.userId,
    planId,
    nightDate,
    interventionsAttempted,
    sleepOnsetMinutes,
    totalSleepHours,
    sleepQuality,
    morningGrogginess,
    alertness,
    outcomes,
    notes,
    context,
    whatHelped,
    whatDidntHelp,
  });
  
  res.status(201).json({
    success: true,
    data: { log },
  });
}));

// Get user's outcome logs
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    OutcomeLog.find({ userId: req.userId })
      .sort({ nightDate: -1 })
      .skip(skip)
      .limit(limit),
    OutcomeLog.countDocuments({ userId: req.userId }),
  ]);
  
  res.json({
    success: true,
    data: {
      logs: logs.map(l => ({
        id: l._id,
        planId: l.planId,
        nightDate: l.nightDate,
        sleepQuality: l.sleepQuality,
        morningGrogginess: l.morningGrogginess,
        totalSleepHours: l.totalSleepHours,
        outcomes: l.outcomes,
        whatHelped: l.whatHelped,
        whatDidntHelp: l.whatDidntHelp,
        createdAt: l.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// Get single outcome log
router.get('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const log = await OutcomeLog.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  
  if (!log) {
    return res.status(404).json({
      success: false,
      error: { code: 'LOG_NOT_FOUND', message: 'Outcome log not found' },
    });
  }
  
  res.json({
    success: true,
    data: { log },
  });
}));

// Update outcome log
router.patch('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const log = await OutcomeLog.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    req.body,
    { new: true }
  );
  
  if (!log) {
    return res.status(404).json({
      success: false,
      error: { code: 'LOG_NOT_FOUND', message: 'Outcome log not found' },
    });
  }
  
  res.json({
    success: true,
    data: { log },
  });
}));

// Delete outcome log
router.delete('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const log = await OutcomeLog.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  
  if (!log) {
    return res.status(404).json({
      success: false,
      error: { code: 'LOG_NOT_FOUND', message: 'Outcome log not found' },
    });
  }
  
  res.json({
    success: true,
    data: { message: 'Outcome log deleted' },
  });
}));

// Get stats for user
router.get('/stats/summary', authenticate, asyncHandler(async (req, res) => {
  const logs = await OutcomeLog.find({ userId: req.userId })
    .sort({ nightDate: -1 })
    .limit(30);
  
  const avgSleepQuality = logs.length > 0
    ? logs.reduce((sum, l) => sum + (l.sleepQuality || 0), 0) / logs.filter(l => l.sleepQuality).length
    : 0;
  
  const avgGrogginess = logs.length > 0
    ? logs.reduce((sum, l) => sum + (l.morningGrogginess || 0), 0) / logs.filter(l => l.morningGrogginess).length
    : 0;
  
  const avgSleepHours = logs.length > 0
    ? logs.reduce((sum, l) => sum + (l.totalSleepHours || 0), 0) / logs.filter(l => l.totalSleepHours).length
    : 0;
  
  const fellAsleepRate = logs.length > 0
    ? logs.filter(l => l.outcomes?.fellAsleep).length / logs.length * 100
    : 0;
  
  res.json({
    success: true,
    data: {
      totalLogs: logs.length,
      avgSleepQuality: Math.round(avgSleepQuality * 10) / 10,
      avgGrogginess: Math.round(avgGrogginess * 10) / 10,
      avgSleepHours: Math.round(avgSleepHours * 10) / 10,
      fellAsleepRate: Math.round(fellAsleepRate),
      recentTrends: logs.slice(0, 7).map(l => ({
        date: l.nightDate,
        quality: l.sleepQuality,
      })),
    },
  });
}));

module.exports = router;
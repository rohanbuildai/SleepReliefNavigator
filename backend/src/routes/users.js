const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Get user profile
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  
  res.json({
    success: true,
    data: { user },
  });
}));

// Update user profile
router.patch('/profile', authenticate, asyncHandler(async (req, res) => {
  const { firstName, lastName, analyticsConsent } = req.body;
  
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(analyticsConsent !== undefined && { analyticsConsent }),
    },
    { new: true }
  );
  
  res.json({
    success: true,
    data: { user },
  });
}));

// Delete account (soft delete for GDPR)
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      email: `deleted_${Date.now()}@deleted.local`, // Preserve unique index
    },
    { new: true }
  );
  
  // Revoke all tokens
  await AuditLog.create({
    userId: req.userId,
    action: 'account_deleted',
    resource: 'user',
    resourceId: req.userId,
    success: true,
    metadata: { reason: 'user_request' },
  });
  
  res.json({
    success: true,
    data: { message: 'Account deleted successfully' },
  });
}));

// Export user data (GDPR)
router.get('/export', authenticate, asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId)
    .populate('quizSessions')
    .populate('savedPlans')
    .populate('outcomeLogs')
    .populate('subscription');
  
  const data = {
    profile: {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
    quizSessions: user.quizSessions,
    savedPlans: user.savedPlans,
    outcomeLogs: user.outcomeLogs,
    subscription: user.subscription,
  };
  
  res.json({
    success: true,
    data,
  });
}));

module.exports = router;
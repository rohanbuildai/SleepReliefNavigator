const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middleware/auth');
const GeneratedPlan = require('../models/GeneratedPlan');
const { mongoIdValidation } = require('../validators/authValidator');

// Get user's plans
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [plans, total] = await Promise.all([
    GeneratedPlan.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-metadata.quizResponses'),
    GeneratedPlan.countDocuments({ userId: req.userId }),
  ]);
  
  res.json({
    success: true,
    data: {
      plans: plans.map(p => ({
        id: p._id,
        name: p.name || p.profileName,
        profileName: p.profileName,
        confidence: p.confidence,
        needsProfessionalHelp: p.needsProfessionalHelp,
        isSaved: p.isSaved,
        savedAt: p.savedAt,
        createdAt: p.createdAt,
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

// Get single plan
router.get('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const plan = await GeneratedPlan.findOne({
    _id: req.params.id,
    userId: req.userId,
  });
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' },
    });
  }
  
  res.json({
    success: true,
    data: { plan },
  });
}));

// Save/name a plan
router.patch('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const { name, notes, isSaved } = req.body;
  
  const plan = await GeneratedPlan.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    {
      ...(name !== undefined && { name }),
      ...(notes !== undefined && { notes }),
      ...(isSaved !== undefined && { 
        isSaved,
        savedAt: isSaved ? new Date() : undefined,
      }),
    },
    { new: true }
  );
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' },
    });
  }
  
  res.json({
    success: true,
    data: { plan },
  });
}));

// Delete a plan
router.delete('/:id', authenticate, mongoIdValidation, asyncHandler(async (req, res) => {
  const plan = await GeneratedPlan.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId,
  });
  
  if (!plan) {
    return res.status(404).json({
      success: false,
      error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found' },
    });
  }
  
  res.json({
    success: true,
    data: { message: 'Plan deleted' },
  });
}));

module.exports = router;
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { quizLimiter } = require('../middleware/rateLimiter');
const { quizStepValidation, quizCompleteValidation } = require('../validators/authValidator');
const QuizSession = require('../models/QuizSession');
const GeneratedPlan = require('../models/GeneratedPlan');
const { generateRecommendations } = require('../services/recommendationEngine');
const AuditLog = require('../models/AuditLog');

// Start new quiz session
router.post('/start', optionalAuth, quizLimiter, asyncHandler(async (req, res) => {
  const { type = 'full', source = 'landing_page' } = req.body;
  
  const session = await QuizSession.create({
    userId: req.userId,
    type,
    currentStep: 0,
    status: 'in_progress',
    source,
    metadata: {
      startedAt: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      referrer: req.headers['referer'],
    },
  });
  
  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      currentStep: session.currentStep,
      totalSteps: 8, // Define based on quiz structure
    },
  });
}));

// Save quiz step
router.post('/step', quizLimiter, quizStepValidation, asyncHandler(async (req, res) => {
  const { sessionId, step, responses } = req.body;
  
  const session = await QuizSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: 'SESSION_NOT_FOUND', message: 'Quiz session not found' },
    });
  }
  
  if (session.status !== 'in_progress') {
    return res.status(400).json({
      success: false,
      error: { code: 'SESSION_COMPLETED', message: 'Quiz session already completed' },
    });
  }
  
  // Update responses
  const currentResponses = session.responses instanceof Map 
    ? Object.fromEntries(session.responses) 
    : session.responses || {};
  
  session.responses = { ...currentResponses, ...responses };
  session.currentStep = step + 1;
  
  await session.save();
  
  res.json({
    success: true,
    data: {
      sessionId: session._id,
      currentStep: session.currentStep,
    },
  });
}));

// Complete quiz and generate plan
router.post('/complete', quizLimiter, quizCompleteValidation, asyncHandler(async (req, res) => {
  const { sessionId, answers, safetyFlags, emailCaptured } = req.body;
  
  const session = await QuizSession.findById(sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: 'SESSION_NOT_FOUND', message: 'Quiz session not found' },
    });
  }
  
  // Merge all answers
  const allResponses = {
    ...(session.responses instanceof Map 
      ? Object.fromEntries(session.responses) 
      : session.responses || {}),
    ...answers,
  };
  
  // Generate recommendations
  const recommendations = await generateRecommendations(allResponses, safetyFlags || []);
  
  // Create generated plan (userId is optional for anonymous users)
  const planData = {
    userId: req.userId || undefined, // Allow null/undefined for anonymous
    quizSessionId: session._id,
    profile: recommendations.profile.slug,
    profileSlug: recommendations.profile.slug,
    profileName: recommendations.profile.name,
    confidence: recommendations.profile.confidence,
    tonightPlan: recommendations.tonightPlan,
    tomorrowReset: recommendations.tomorrowReset,
    sevenNightPlan: recommendations.sevenNightPlan,
    supplementSuggestions: recommendations.supplementSuggestions || [],
    safetyFlagsTriggered: recommendations.safetyFlagsTriggered || [],
    needsProfessionalHelp: recommendations.needsProfessionalHelp || false,
    escalationNote: recommendations.escalationNote || '',
    metadata: {
      generatedAt: new Date(),
      engineVersion: '1.0.0',
      quizResponses: allResponses,
    },
  };
  
  // Remove undefined fields to avoid Mongoose warnings
  Object.keys(planData).forEach(key => {
    if (planData[key] === undefined) delete planData[key];
  });
  
  const plan = await GeneratedPlan.create(planData);
  
  // Update quiz session
  session.status = 'completed';
  session.completedAt = new Date();
  session.classification = {
    sleepProfile: recommendations.profile.slug,
    profileSlug: recommendations.profile.slug,
    confidence: recommendations.profile.confidence,
  };
  session.generatedPlanId = plan._id;
  
  if (safetyFlags) {
    session.safetyFlags = safetyFlags;
  }
  
  if (emailCaptured && !req.userId) {
    session.emailCaptured = emailCaptured;
  }
  
  // Calculate time spent
  if (session.metadata?.startedAt) {
    session.metadata.timeSpentSeconds = Math.round(
      (new Date() - new Date(session.metadata.startedAt)) / 1000
    );
  }
  
  await session.save();
  
  // Log quiz completion
  if (req.userId) {
    await AuditLog.create({
      userId: req.userId,
      action: 'quiz_completed',
      resource: 'quiz_session',
      resourceId: session._id,
      success: true,
      metadata: {
        profile: recommendations.profile.slug,
        hasPlan: !!plan._id,
      },
    });
  }
  
  res.status(201).json({
    success: true,
    data: {
      sessionId: session._id,
      planId: plan._id,
      profile: recommendations.profile,
      tonightPlan: {
        ...recommendations.tonightPlan,
        explanation: recommendations.explanation,
        safetyNote: recommendations.safetyNote,
      },
      needsProfessionalHelp: recommendations.needsProfessionalHelp,
      escalationNote: recommendations.escalationNote,
    },
  });
}));

// Get quiz session
router.get('/session/:sessionId', asyncHandler(async (req, res) => {
  const session = await QuizSession.findById(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: { code: 'SESSION_NOT_FOUND', message: 'Quiz session not found' },
    });
  }
  
  // Check authorization
  if (session.userId && session.userId.toString() !== req.userId?.toString()) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized to access this session' },
    });
  }
  
  res.json({
    success: true,
    data: {
      session: {
        id: session._id,
        type: session.type,
        currentStep: session.currentStep,
        status: session.status,
        classification: session.classification,
        createdAt: session.createdAt,
      },
    },
  });
}));

// Get quiz history (authenticated)
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [sessions, total] = await Promise.all([
    QuizSession.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('generatedPlanId', 'name profileName createdAt'),
    QuizSession.countDocuments({ userId: req.userId }),
  ]);
  
  res.json({
    success: true,
    data: {
      sessions: sessions.map(s => ({
        id: s._id,
        type: s.type,
        status: s.status,
        classification: s.classification,
        hasPlan: !!s.generatedPlanId,
        planName: s.generatedPlanId?.name,
        createdAt: s.createdAt,
        completedAt: s.completedAt,
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

module.exports = router;
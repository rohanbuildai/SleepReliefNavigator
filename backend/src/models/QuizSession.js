const mongoose = require('mongoose');

const quizSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  // Quiz type
  type: {
    type: String,
    enum: ['quick', 'full', 'follow-up'],
    default: 'full',
  },
  // Current step
  currentStep: {
    type: Number,
    default: 0,
  },
  // Quiz responses stored as object
  responses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  // Quiz metadata
  metadata: {
    startedAt: Date,
    completedAt: Date,
    timeSpentSeconds: Number,
    userAgent: String,
    ipAddress: String,
    referrer: String,
  },
  // Result classification
  classification: {
    sleepProfile: {
      type: String,
      ref: 'SleepProfile',
    },
    profileSlug: String,
    confidence: Number, // 0-100
  },
  // Generated plan reference
  generatedPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedPlan',
  },
  // Quiz status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'expired'],
    default: 'in_progress',
  },
  // Safety flags collected
  safetyFlags: [{
    type: String,
  }],
  // Email captured (for non-auth users)
  emailCaptured: {
    type: String,
    lowercase: true,
    trim: true,
  },
  // Source tracking
  source: {
    type: String,
    enum: ['landing_page', 'help_now', 'dashboard', 'email', 'direct'],
    default: 'landing_page',
  },
}, {
  timestamps: true,
});

// Indexes
quizSessionSchema.index({ userId: 1, createdAt: -1 });
quizSessionSchema.index({ 'metadata.startedAt': -1 });
quizSessionSchema.index({ status: 1, createdAt: -1 });

// TTL to expire old in-progress sessions (7 days)
quizSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const QuizSession = mongoose.model('QuizSession', quizSessionSchema);

module.exports = QuizSession;
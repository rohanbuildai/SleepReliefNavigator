const mongoose = require('mongoose');

const generatedPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Not required - anonymous users can take quiz
  },
  quizSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSession',
    required: true,
  },
  // Profile classification - store as slug for flexibility
  profile: String, // Store slug directly, not ObjectId reference
  profileSlug: String,
  profileName: String,
  confidence: Number,
  
  // Tonight's plan (immediate)
  tonightPlan: {
    primarySteps: [{
      order: Number,
      interventionSlug: String,
      interventionName: String,
      instructions: String,
      duration: Number, // minutes
      timing: String, // "now", "in 10 min", etc.
    }],
    backupPlan: [{
      interventionSlug: String,
      interventionName: String,
      instructions: String,
    }],
    avoidTonight: [{
      type: String,
    }],
    explanation: String,
    safetyNote: String,
    grogginessRisk: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
    dependencyRisk: {
      type: Number,
      min: 0,
      max: 10,
      default: 0,
    },
  },
  
  // Tomorrow's reset plan
  tomorrowReset: {
    steps: [{
      interventionSlug: String,
      interventionName: String,
      instructions: String,
      timing: String,
    }],
  },
  
  // 7-night reset plan (premium)
  sevenNightPlan: {
    nights: [{
      night: Number, // 1-7
      focus: String,
      interventions: [{
        interventionSlug: String,
        interventionName: String,
        instructions: String,
        note: String,
      }],
      expectedOutcome: String,
    }],
    totalDuration: Number, // days
    isPremium: {
      type: Boolean,
      default: false,
    },
  },
  
  // Supplement suggestions (if applicable and not blocked)
  supplementSuggestions: [{
    name: String,
    reason: String,
    dosage: String,
    timing: String,
    confidence: Number,
  }],
  
  // Safety flags triggered
  safetyFlagsTriggered: [{
    type: String,
  }],
  needsProfessionalHelp: {
    type: Boolean,
    default: false,
  },
  escalationNote: String,
  
  // Plan metadata
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    engineVersion: String,
    quizResponses: mongoose.Schema.Types.Mixed,
  },
  
  // User can save/nickname the plan
  name: {
    type: String,
    maxlength: [100, 'Plan name cannot exceed 100 characters'],
  },
  notes: String,
  
  // Is this a favorite/saved plan
  isSaved: {
    type: Boolean,
    default: false,
  },
  savedAt: Date,
  
  // Plan visibility
  isPublic: {
    type: Boolean,
    default: false, // For potential future community features
  },
}, {
  timestamps: true,
});

// Indexes
generatedPlanSchema.index({ userId: 1, createdAt: -1 });
generatedPlanSchema.index({ quizSessionId: 1 });
generatedPlanSchema.index({ profileSlug: 1 });

const GeneratedPlan = mongoose.model('GeneratedPlan', generatedPlanSchema);

module.exports = GeneratedPlan;
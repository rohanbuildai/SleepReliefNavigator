const mongoose = require('mongoose');

const recommendationRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  // Rule type
  type: {
    type: String,
    enum: ['profile_match', 'contraindication', 'ranking', 'fallback', 'safety'],
    required: true,
  },
  // Which profiles this rule applies to
  applicableProfiles: [{
    type: String, // profile slug
  }],
  // Priority (lower = higher priority)
  priority: {
    type: Number,
    default: 100,
  },
  // Conditions that trigger this rule
  conditions: {
    // Quiz response conditions
    quizResponses: [{
      question: String,
      operator: {
        type: String,
        enum: ['equals', 'contains', 'any', 'all', 'not'],
      },
      value: mongoose.Schema.Types.Mixed,
    }],
    // Profile conditions
    profileSlugs: [{
      type: String,
    }],
    // Safety flag conditions
    safetyFlags: [{
      type: String,
    }],
    // Subscription conditions
    subscriptionRequired: {
      type: String,
      enum: ['none', 'active', 'premium'],
      default: 'none',
    },
  },
  // Actions to take when rule matches
  actions: {
    // Include these interventions
    includeInterventions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intervention',
    }],
    // Exclude these interventions
    excludeInterventions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Intervention',
    }],
    // Set plan order
    setOrder: Number,
    // Add warning
    addWarning: String,
    // Add note
    addNote: String,
    // Set as primary
    setPrimary: Boolean,
    // Set as backup
    setBackup: Boolean,
  },
  // Explanation shown to user
  explanation: String,
  // Is this rule active
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Version for tracking changes
  version: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

recommendationRuleSchema.index({ unique: true });
recommendationRuleSchema.index({ type: 1, isActive: 1 });
recommendationRuleSchema.index({ applicableProfiles: 1 });

const RecommendationRule = mongoose.model('RecommendationRule', recommendationRuleSchema);

module.exports = RecommendationRule;
const mongoose = require('mongoose');

const outcomeLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedPlan',
    index: true,
  },
  // Date of the night being logged
  nightDate: {
    type: Date,
    required: true,
    index: true,
  },
  // What interventions were attempted
  interventionsAttempted: [{
    interventionSlug: String,
    interventionName: String,
    completed: {
      type: Boolean,
      default: false,
    },
    partiallyCompleted: {
      type: Boolean,
      default: false,
    },
    notes: String,
  }],
  // Sleep quality outcomes
  sleepOnsetMinutes: Number, // How long to fall asleep
  wakeCount: Number, // Times woken up
  totalSleepHours: Number,
  sleepQuality: {
    type: Number,
    min: 1,
    max: 5,
  },
  // Morning outcomes
  morningGrogginess: {
    type: Number,
    min: 1,
    max: 5,
  },
  alertness: {
    type: Number,
    min: 1,
    max: 5,
  },
  // Subjective outcomes
  outcomes: {
    fellAsleep: Boolean,
    stayedAsleep: Boolean,
    wokeRefreshed: Boolean,
    nightAnxietyReduced: Boolean,
  },
  // Notes and context
  notes: String,
  context: {
    hadCaffeine: Boolean,
    hadAlcohol: Boolean,
    exercisedToday: Boolean,
    stressLevel: {
      type: Number,
      min: 1,
      max: 5,
    },
  },
  // What helped / what didn't
  whatHelped: [{
    type: String,
  }],
  whatDidntHelp: [{
    type: String,
  }],
  // Follow-up needed
  needsFollowUp: {
    type: Boolean,
    default: false,
  },
  followUpNotes: String,
}, {
  timestamps: true,
});

// Index for user's history
outcomeLogSchema.index({ userId: 1, nightDate: -1 });
outcomeLogSchema.index({ userId: 1, createdAt: -1 });

const OutcomeLog = mongoose.model('OutcomeLog', outcomeLogSchema);

module.exports = OutcomeLog;
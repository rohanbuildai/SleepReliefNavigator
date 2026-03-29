const mongoose = require('mongoose');

const interventionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // NOTE: unique creates index, no separate index needed
  },
  category: {
    type: String,
    enum: ['behavioral', 'supplement', 'audio', 'routine', 'environmental', 'breathing', 'cognitive'],
    required: true,
    index: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [150, 'Short description cannot exceed 150 characters'],
  },
  // What this intervention is best for (matching to sleep profiles)
  bestFor: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  // When to avoid this intervention
  avoidIf: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  // Contraindication flags
  contraindications: [{
    type: String,
    lowercase: true,
  }],
  // Evidence level (1-5)
  evidenceLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3,
  },
  // Time to effect in minutes
  onsetMinutes: {
    type: Number,
    min: 1,
    max: 120,
    required: true,
  },
  // Grogginess risk (1-5, 5 being highest)
  grogginessRisk: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  // Dependency risk (1-5, 5 being highest)
  dependencyRisk: {
    type: Number,
    min: 1,
    max: 5,
    default: 1,
  },
  // Safety notes (HTML allowed)
  safetyNotes: {
    type: String,
    maxlength: [1000, 'Safety notes cannot exceed 1000 characters'],
  },
  // Common mistakes to avoid
  commonMistakes: [{
    type: String,
    trim: true,
  }],
  // Alternatives when this isn't suitable
  alternatives: [{
    type: String,
    ref: 'Intervention',
  }],
  // Instructions for use
  instructions: {
    type: String,
    maxlength: [2000, 'Instructions cannot exceed 2000 characters'],
  },
  // Quick protocol (for help-now page)
  quickProtocol: {
    type: String,
    maxlength: [500, 'Quick protocol cannot exceed 500 characters'],
  },
  // Premium only flag
  premiumOnly: {
    type: Boolean,
    default: false,
  },
  // Active/archived
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Sort order for display
  sortOrder: {
    type: Number,
    default: 0,
  },
  // Icon name (Lucide or custom)
  icon: {
    type: String,
    default: 'moon',
  },
  // Color theme
  color: {
    type: String,
    default: '#6366f1', // Indigo
  },
}, {
  timestamps: true,
});

// Indexes
interventionSchema.index({ slug: 1 }, { unique: true });
interventionSchema.index({ category: 1, isActive: 1 });
interventionSchema.index({ bestFor: 1 });

const Intervention = mongoose.model('Intervention', interventionSchema);

module.exports = Intervention;
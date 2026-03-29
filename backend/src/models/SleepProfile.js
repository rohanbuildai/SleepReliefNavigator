const mongoose = require('mongoose');

const sleepProfileSchema = new mongoose.Schema({
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
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  // Symptoms that identify this profile
  symptoms: [{
    type: String,
    lowercase: true,
    trim: true,
  }],
  // Primary category
  category: {
    type: String,
    enum: ['onset', 'maintenance', 'early_wake', 'combined'],
    required: true,
  },
  // Common triggers
  triggers: [{
    type: String,
  }],
  // How common this profile is (percentage)
  prevalence: {
    type: Number,
    min: 0,
    max: 100,
    default: 10,
  },
  // Warning signs specific to this profile
  warningSigns: [{
    type: String,
  }],
  // Recommended first action for immediate relief
  immediateAction: {
    type: String,
    maxlength: [300, 'Immediate action cannot exceed 300 characters'],
  },
  // Is this a valid/active profile
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Priority order for display
  priority: {
    type: Number,
    default: 0,
  },
  // Color theme for UI
  color: {
    type: String,
    default: '#6366f1',
  },
  // Icon
  icon: {
    type: String,
    default: 'bed',
  },
}, {
  timestamps: true,
});

sleepProfileSchema.index({ slug: 1 }, { unique: true });
sleepProfileSchema.index({ category: 1, isActive: 1 });

const SleepProfile = mongoose.model('SleepProfile', sleepProfileSchema);

module.exports = SleepProfile;
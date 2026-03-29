const mongoose = require('mongoose');

const evidenceEntrySchema = new mongoose.Schema({
  title: {
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
  // Content sections
  summary: {
    type: String,
    required: true,
    maxlength: [300, 'Summary cannot exceed 300 characters'],
  },
  whatItIs: String,
  bestFor: [{
    type: String,
    lowercase: true,
  }],
  notBestFor: [{
    type: String,
    lowercase: true,
  }],
  howItWorks: String,
  evidenceStrength: {
    type: String,
    enum: ['strong', 'moderate', 'preliminary', 'mixed', 'limited'],
    required: true,
  },
  // Timing info
  onsetMinutes: {
    type: Number,
    min: 1,
    max: 180,
  },
  duration: String,
  // Risk assessments (1-5)
  grogginessRisk: {
    type: Number,
    min: 1,
    max: 5,
  },
  dependencyRisk: {
    type: Number,
    min: 1,
    max: 5,
  },
  sideEffectRisk: {
    type: Number,
    min: 1,
    max: 5,
  },
  // Safety
  safetyNotes: String,
  whenToAvoid: [{
    type: String,
  }],
  commonMistakes: [{
    type: String,
  }],
  // Alternatives
  alternatives: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
  }],
  // Research citations
  citations: [{
    title: String,
    url: String,
    year: Number,
    journal: String,
  }],
  // SEO
  metaTitle: String,
  metaDescription: String,
  keywords: [{
    type: String,
    lowercase: true,
  }],
  // Related content
  relatedLearnSlugs: [{
    type: String,
  }],
  // Related intervention
  relatedIntervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
  },
  // Featured image
  imageUrl: String,
  // Active status
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  // Sort order
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

evidenceEntrySchema.index({ slug: 1 }, { unique: true });
evidenceEntrySchema.index({ isActive: 1, sortOrder: 1 });
evidenceEntrySchema.index({ keywords: 1 });

const EvidenceEntry = mongoose.model('EvidenceEntry', evidenceEntrySchema);

module.exports = EvidenceEntry;
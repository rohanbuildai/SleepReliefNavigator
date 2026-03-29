const mongoose = require('mongoose');

const emailLeadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  // Source of the lead
  source: {
    type: String,
    enum: ['quiz_result', 'help_now', 'footer_signup', 'pricing_page', 'library', 'other'],
    required: true,
  },
  // Quiz session if applicable
  quizSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSession',
  },
  // User reference if signed up
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Consent
  marketingConsent: {
    type: Boolean,
    default: false,
  },
  consentGivenAt: Date,
  // Status
  status: {
    type: String,
    enum: ['new', 'contacted', 'converted', 'unsubscribed', 'bounced'],
    default: 'new',
  },
  // Campaign tracking
  campaign: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,
  // Metadata
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

emailLeadSchema.index({ email: 1 }, { unique: true });
emailLeadSchema.index({ status: 1, createdAt: -1 });

const EmailLead = mongoose.model('EmailLead', emailLeadSchema);

module.exports = EmailLead;
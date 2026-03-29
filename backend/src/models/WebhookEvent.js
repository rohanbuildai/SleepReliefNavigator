const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  stripeEventId: {
    type: String,
    required: true,
    unique: true,
    // NOTE: unique creates index, no separate index needed
  },
  type: {
    type: String,
    required: true,
    // NOTE: compound index defined below
  },
  processed: {
    type: Boolean,
    default: false,
    // NOTE: compound index defined below
  },
  processedAt: Date,
  processingError: String,
  processedBy: String, // Function/handler name
  payload: mongoose.Schema.Types.Mixed,
  result: String,
}, {
  timestamps: true,
});

// TTL index - keep webhook events for 30 days
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

module.exports = WebhookEvent;
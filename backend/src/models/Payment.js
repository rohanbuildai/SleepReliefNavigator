const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    // NOTE: compound index defined below
  },
  // Stripe payment details
  stripePaymentIntentId: {
    type: String,
    unique: true,
    sparse: true,
    // NOTE: compound index defined below
  },
  stripeChargeId: {
    type: String,
  },
  // Payment type
  type: {
    type: String,
    enum: ['one_time', 'subscription', 'refund'],
    required: true,
  },
  // Amount
  amount: {
    type: Number,
    required: true, // in cents
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true,
  },
  // Status
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  // Product/Plan
  productName: String,
  priceId: String,
  // Subscription reference
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  // Associated quiz session or plan
  quizSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizSession',
  },
  generatedPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GeneratedPlan',
  },
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  // Failure reason
  failureMessage: String,
  failureCode: String,
}, {
  timestamps: true,
});

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
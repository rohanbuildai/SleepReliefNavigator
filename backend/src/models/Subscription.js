const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  stripeSubscriptionId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  stripeCustomerId: {
    type: String,
    index: true,
  },
  // Plan type
  plan: {
    type: String,
    enum: ['monthly', 'annual', 'one_time', 'lifetime'],
    required: true,
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'paused'],
    default: 'active',
  },
  // Pricing
  priceId: String,
  priceAmount: Number, // cents
  priceCurrency: {
    type: String,
    default: 'usd',
  },
  // Billing cycle
  interval: {
    type: String,
    enum: ['month', 'year'],
  },
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  trialEnd: Date,
  canceledAt: Date,
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false,
  },
  // Subscription metadata
  metadata: {
    productName: String,
    productId: String,
  },
  // Access flags
  access: {
    premiumContent: {
      type: Boolean,
      default: false,
    },
    advancedTracking: {
      type: Boolean,
      default: false,
    },
    sevenNightPlans: {
      type: Boolean,
      default: false,
    },
    unlimitedQuizzes: {
      type: Boolean,
      default: false,
    },
    emailSupport: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 }); // For cron job to check renewals

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
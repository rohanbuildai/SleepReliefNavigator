const { asyncHandler } = require('../utils/asyncHandler');
const stripeService = require('../services/stripeService');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const config = require('../config');

// Get pricing info (with INR support)
const getPricing = asyncHandler(async (req, res) => {
  const currency = req.query.currency || 'usd';
  
  res.json({
    success: true,
    data: {
      pricing: stripeService.PRICING,
      currency: currency,
      currencySymbol: currency.toLowerCase() === 'inr' ? '₹' : '$',
      supportedCurrencies: ['usd', 'inr'],
      upiEnabled: currency.toLowerCase() === 'inr',
    },
  });
});

// Create checkout session for one-time purchase
const createOneTimeCheckout = asyncHandler(async (req, res) => {
  const { priceKey, currency = 'usd' } = req.body;
  
  if (!priceKey) {
    return res.status(400).json({
      success: false,
      error: { code: 'PRICE_KEY_REQUIRED', message: 'Price key is required' },
    });
  }
  
  const session = await stripeService.createCheckoutSession(
    req.userId,
    req.user.email,
    priceKey,
    `${config.frontendUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    `${config.frontendUrl}/dashboard/billing?canceled=true`,
    currency
  );
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
      currency: currency,
      upiEnabled: currency.toLowerCase() === 'inr',
    },
  });
});

// Create subscription checkout
const createSubscriptionCheckout = asyncHandler(async (req, res) => {
  const { currency = 'usd' } = req.body;
  
  const session = await stripeService.createSubscriptionCheckout(
    req.userId,
    req.user.email,
    `${config.frontendUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    `${config.frontendUrl}/dashboard/billing?canceled=true`,
    currency
  );
  
  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
      currency: currency,
      upiEnabled: currency.toLowerCase() === 'inr',
    },
  });
});

// Get billing portal session
const getBillingPortal = asyncHandler(async (req, res) => {
  const user = await User.findById(req.userId);
  
  if (!user?.stripeCustomerId) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_CUSTOMER', message: 'No billing account found' },
    });
  }
  
  const session = await stripeService.createBillingPortalSession(
    user.stripeCustomerId,
    `${config.frontendUrl}/dashboard/billing`
  );
  
  res.json({
    success: true,
    data: {
      url: session.url,
    },
  });
});

// Get user's subscription
const getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({
    userId: req.userId,
    status: { $in: ['active', 'trialing', 'past_due'] },
  }).sort({ createdAt: -1 });
  
  if (!subscription) {
    return res.json({
      success: true,
      data: {
        subscription: null,
        hasActivePlan: false,
      },
    });
  }
  
  res.json({
    success: true,
    data: {
      subscription,
      hasActivePlan: subscription.status === 'active',
    },
  });
});

// Get payment history
const getPaymentHistory = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const [payments, total] = await Promise.all([
    Payment.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments({ userId: req.userId }),
  ]);
  
  res.json({
    success: true,
    data: {
      payments: payments.map(p => ({
        id: p._id,
        type: p.type,
        amount: p.amount / 100, // Convert from cents
        currency: p.currency.toUpperCase(),
        status: p.status,
        productName: p.productName,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// Cancel subscription
const cancelSubscription = asyncHandler(async (req, res) => {
  const { cancelNow } = req.body;
  
  const subscription = await Subscription.findOne({
    userId: req.userId,
    status: { $in: ['active', 'trialing'] },
  });
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      error: { code: 'NO_SUBSCRIPTION', message: 'No active subscription found' },
    });
  }
  
  const result = await stripeService.cancelSubscription(
    subscription.stripeSubscriptionId,
    cancelNow
  );
  
  // Update local subscription
  subscription.cancelAtPeriodEnd = result.cancel_at_period_end;
  if (cancelNow) {
    subscription.status = 'canceled';
    subscription.canceledAt = new Date();
  }
  await subscription.save();
  
  res.json({
    success: true,
    data: {
      message: cancelNow 
        ? 'Subscription canceled immediately' 
        : 'Subscription will be canceled at period end',
      cancelAtPeriodEnd: result.cancel_at_period_end,
    },
  });
});

module.exports = {
  getPricing,
  createOneTimeCheckout,
  createSubscriptionCheckout,
  getBillingPortal,
  getSubscription,
  getPaymentHistory,
  cancelSubscription,
};
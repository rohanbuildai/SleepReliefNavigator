const Stripe = require('stripe');
const config = require('../config');

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

// Product pricing
const PRICING = {
  oneTime: {
    '7night_reset': {
      name: '7-Night Sleep Reset',
      description: 'A comprehensive 7-night sleep improvement program',
      priceId: config.stripe.priceOneTime,
      amount: 2900, // $29.00 USD
      amountInr: 2399, // ₹2399 INR
      currency: 'usd',
      currencyInr: 'inr',
    },
  },
  subscription: {
    monthly: {
      name: 'Sleep Relief Premium Monthly',
      description: 'Full access to all features and personalized plans',
      priceId: config.stripe.priceSubscription,
      amount: 990, // $9.99/month USD
      amountInr: 799, // ₹799/month INR
      currency: 'usd',
      currencyInr: 'inr',
      interval: 'month',
    },
  },
};

/**
 * Get price configuration based on currency
 */
const getPriceConfig = (price, currency = 'usd') => {
  const isInr = currency.toLowerCase() === 'inr';
  return {
    name: price.name,
    description: price.description,
    amount: isInr ? price.amountInr : price.amount,
    currency: isInr ? price.currencyInr : price.currency,
  };
};

/**
 * Create a Stripe Checkout Session for one-time purchase
 */
const createCheckoutSession = async (userId, userEmail, priceKey, successUrl, cancelUrl, currency = 'usd') => {
  const price = PRICING.oneTime[priceKey];
  
  if (!price) {
    throw new Error('Invalid price key');
  }
  
  const priceConfig = getPriceConfig(price, currency);
  
  // UPI is only available for INR currency, cards work for all
  const paymentMethods = currency.toLowerCase() === 'inr' 
    ? ['card', 'upi'] 
    : ['card'];
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: paymentMethods,
    customer_email: userEmail,
    currency: priceConfig.currency,
    line_items: [
      {
        price_data: {
          currency: priceConfig.currency,
          product_data: {
            name: priceConfig.name,
            description: priceConfig.description,
          },
          unit_amount: priceConfig.amount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      product: priceKey,
      currency: currency,
    },
  });
  
  return session;
};

/**
 * Create a Stripe Checkout Session for subscription
 */
const createSubscriptionCheckout = async (userId, userEmail, successUrl, cancelUrl, currency = 'usd') => {
  const price = PRICING.subscription.monthly;
  const priceConfig = getPriceConfig(price, currency);
  
  // UPI is only available for INR currency, cards work for all
  const paymentMethods = currency.toLowerCase() === 'inr' 
    ? ['card', 'upi'] 
    : ['card'];
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: paymentMethods,
    customer_email: userEmail,
    currency: priceConfig.currency,
    line_items: [
      {
        price_data: {
          currency: priceConfig.currency,
          product_data: {
            name: priceConfig.name,
            description: priceConfig.description,
          },
          unit_amount: priceConfig.amount,
          recurring: {
            interval: price.interval,
          },
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      product: 'monthly_subscription',
      currency: currency,
    },
  });
  
  return session;
};

/**
 * Create or get Stripe customer
 */
const getOrCreateCustomer = async (userId, email, name) => {
  // Check if user already has a customer ID
  const User = require('../models/User');
  const user = await User.findById(userId);
  
  if (user?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      return customer;
    } catch (error) {
      // Customer might have been deleted on Stripe side
    }
  }
  
  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId: userId.toString(),
    },
  });
  
  // Save customer ID to user
  if (user) {
    user.stripeCustomerId = customer.id;
    await user.save();
  }
  
  return customer;
};

/**
 * Create billing portal session
 */
const createBillingPortalSession = async (customerId, returnUrl) => {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  
  return session;
};

/**
 * Get subscription status
 */
const getSubscriptionStatus = async (subscriptionId) => {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return {
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
  };
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (subscriptionId, cancelNow = false) => {
  if (cancelNow) {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
  
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

module.exports = {
  stripe,
  PRICING,
  createCheckoutSession,
  createSubscriptionCheckout,
  getOrCreateCustomer,
  createBillingPortalSession,
  getSubscriptionStatus,
  cancelSubscription,
};
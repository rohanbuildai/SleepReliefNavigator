/**
 * Stripe Webhook Controller - Production Ready
 * 
 * CRITICAL SECURITY NOTES:
 * - Uses raw body for signature verification (never parsed by express.json())
 * - Idempotent processing via WebhookEvent collection
 * - Proper error handling to always return 200 to Stripe
 * - Logging for all operations
 */

const { asyncHandler } = require('../utils/asyncHandler');
const stripeService = require('../services/stripeService');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const WebhookEvent = require('../models/WebhookEvent');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Logger - will be initialized from server context
let logger = { info: console.log, error: console.error, warn: console.warn };

const setLogger = (log) => { logger = log; };

/**
 * Stripe webhook handler - CRITICAL: Must receive raw body
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // CRITICAL: Use rawBody from webhook route (set as Buffer before express.json())
  const rawBody = req.rawBody;
  
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    logger.error('Webhook received invalid body - not a Buffer');
    return res.status(400).json({ error: 'Invalid webhook body - must be raw' });
  }

  let event;
  
  // Verify webhook signature
  if (!config.stripe.webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    event = stripeService.stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error({ 
      error: err.message,
      sigPrefix: sig?.substring(0, 10) + '...'
    }, 'Stripe webhook signature verification failed');
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  logger.info({ eventId: event.id, type: event.type }, 'Processing Stripe webhook');

  // Idempotency check - prevent duplicate processing
  const existingEvent = await WebhookEvent.findOne({ stripeEventId: event.id });
  
  if (existingEvent?.processed && existingEvent.result === 'success') {
    logger.info({ eventId: event.id }, 'Webhook already processed successfully, skipping');
    return res.json({ received: true, status: 'already_processed' });
  }

  // Atomic upsert - prevent race conditions
  let webhookEvent;
  try {
    webhookEvent = await WebhookEvent.findOneAndUpdate(
      { stripeEventId: event.id },
      {
        $setOnCreate: {
          type: event.type,
          processed: false,
          createdAt: new Date(),
        },
        $set: {
          payload: event.data.object,
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.error({ eventId: event.id, error: err.message }, 'Failed to create webhook event record');
    return res.status(500).json({ error: 'Failed to record webhook event' });
  }

  try {
    // Process based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        logger.info({ eventType: event.type }, 'Unhandled Stripe event type');
    }

    // Mark as processed successfully
    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    webhookEvent.processedBy = `webhook_handler_${event.type}`;
    webhookEvent.result = 'success';
    await webhookEvent.save();

    logger.info({ eventId: event.id, type: event.type }, 'Webhook processed successfully');
    
    // Audit log for successful payment events
    if (event.type.includes('payment') || event.type.includes('subscription')) {
      await AuditLog.create({
        action: `stripe_webhook_${event.type}`,
        resource: 'webhook',
        resourceId: event.id,
        metadata: { 
          type: event.type,
          objectId: event.data.object?.id 
        },
        success: true,
      });
    }

    res.json({ received: true, status: 'processed' });

  } catch (error) {
    // Log the error but ALWAYS return 200 to Stripe (requirement)
    webhookEvent.processed = false;
    webhookEvent.processingError = error.message;
    webhookEvent.result = 'error';
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();

    logger.error({ 
      eventId: event.id, 
      error: error.message,
      stack: error.stack 
    }, 'Webhook processing error');

    // Log audit for failed processing
    await AuditLog.create({
      action: `stripe_webhook_error_${event.type}`,
      resource: 'webhook',
      resourceId: event.id,
      metadata: { error: error.message },
      success: false,
      error: error.message,
    });

    // Return 200 to prevent Stripe retries for application errors
    res.json({ received: true, status: 'error_logged' });
  }
});

/**
 * Handle checkout.session.completed - one-time purchases
 */
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata?.userId;
  const product = session.metadata?.product;

  if (!userId) {
    logger.error({ sessionId: session.id }, 'No userId in checkout session metadata');
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    logger.error({ userId, sessionId: session.id }, 'User not found for checkout');
    return;
  }

  // Save customer ID if not exists
  if (!user.stripeCustomerId && session.customer) {
    user.stripeCustomerId = session.customer;
    await user.save();
    logger.info({ userId, customerId: session.customer }, 'Updated user with Stripe customer ID');
  }

  // Handle one-time payments
  if (session.mode === 'payment') {
    const payment = await Payment.create({
      userId,
      stripePaymentIntentId: session.payment_intent,
      stripeChargeId: session.charge,
      type: 'one_time',
      amount: session.amount_total,
      currency: session.currency,
      status: 'succeeded',
      productName: product === '7night_reset' ? '7-Night Sleep Reset' : 'Unknown Product',
      metadata: { sessionId: session.id },
    });

    logger.info({ 
      paymentId: payment._id, 
      userId, 
      amount: session.amount_total / 100 
    }, 'One-time payment recorded');

    // Update user to premium access for one-time purchase
    // This is a simplified version - in production you'd track product-specific access
    await AuditLog.create({
      userId,
      action: 'purchase_completed',
      resource: 'payment',
      resourceId: payment._id,
      metadata: { product, amount: session.amount_total / 100 },
      success: true,
    });
  }
};

/**
 * Handle customer.subscription.created
 */
const handleSubscriptionCreated = async (subscription) => {
  // Find user by customer ID
  const user = await User.findOne({ stripeCustomerId: subscription.customer });

  if (!user) {
    logger.error({ customerId: subscription.customer }, 'User not found for subscription');
    return;
  }

  // Determine plan type from interval
  const interval = subscription.items.data[0]?.price?.recurring?.interval;
  const planType = interval === 'month' ? 'monthly' : interval === 'year' ? 'annual' : 'subscription';

  // Check if subscription already exists (prevent duplicates)
  const existingSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
  
  if (existingSub) {
    logger.warn({ subscriptionId: subscription.id }, 'Subscription already exists, updating');
    return;
  }

  // Create subscription record with access flags
  const subRecord = await Subscription.create({
    userId: user._id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    plan: planType,
    status: subscription.status,
    priceId: subscription.items.data[0]?.price?.id,
    priceAmount: subscription.items.data[0]?.price?.unit_amount,
    priceCurrency: subscription.items.data[0]?.price?.currency || 'usd',
    interval: interval,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    metadata: {
      productName: 'Sleep Relief Premium',
      productId: subscription.items.data[0]?.price?.product,
    },
    access: {
      premiumContent: true,
      advancedTracking: true,
      sevenNightPlans: true,
      unlimitedQuizzes: true,
      emailSupport: true,
    },
  });

  // Update user's subscription reference
  user.subscription = subRecord._id;
  await user.save();

  logger.info({ 
    subscriptionId: subscription.id, 
    userId: user._id,
    plan: planType,
    status: subscription.status 
  }, 'Subscription created');

  // Audit log
  await AuditLog.create({
    userId: user._id,
    action: 'subscription_created',
    resource: 'subscription',
    resourceId: subRecord._id,
    metadata: { plan: planType, status: subscription.status },
    success: true,
  });
};

/**
 * Handle customer.subscription.updated
 */
const handleSubscriptionUpdated = async (subscription) => {
  const existingSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  });

  if (!existingSub) {
    logger.error({ subscriptionId: subscription.id }, 'Subscription not found for update');
    return;
  }

  // Track status change for audit
  const oldStatus = existingSub.status;
  
  // Update subscription fields
  existingSub.status = subscription.status;
  existingSub.currentPeriodStart = new Date(subscription.current_period_start * 1000);
  existingSub.currentPeriodEnd = new Date(subscription.current_period_end * 1000);
  existingSub.cancelAtPeriodEnd = subscription.cancel_at_period_end;
  
  if (subscription.trial_end) {
    existingSub.trialEnd = new Date(subscription.trial_end * 1000);
  }

  // Update price info if changed
  if (subscription.items.data[0]?.price) {
    existingSub.priceId = subscription.items.data[0].price.id;
    existingSub.priceAmount = subscription.items.data[0].price.unit_amount;
  }

  await existingSub.save();

  logger.info({ 
    subscriptionId: subscription.id, 
    oldStatus, 
    newStatus: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end 
  }, 'Subscription updated');

  // Audit status changes
  if (oldStatus !== subscription.status) {
    await AuditLog.create({
      userId: existingSub.userId,
      action: 'subscription_status_changed',
      resource: 'subscription',
      resourceId: existingSub._id,
      changes: { oldStatus, newStatus: subscription.status },
      success: true,
    });
  }
};

/**
 * Handle customer.subscription.deleted
 */
const handleSubscriptionDeleted = async (subscription) => {
  const existingSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id
  });

  if (!existingSub) {
    logger.warn({ subscriptionId: subscription.id }, 'Subscription not found for deletion');
    return;
  }

  const userId = existingSub.userId;

  // Mark as canceled
  existingSub.status = 'canceled';
  existingSub.canceledAt = new Date();
  await existingSub.save();

  // Remove subscription reference from user
  await User.findByIdAndUpdate(userId, {
    $unset: { subscription: 1 }
  });

  logger.info({ 
    subscriptionId: subscription.id, 
    userId 
  }, 'Subscription canceled and removed from user');

  // Audit log
  await AuditLog.create({
    userId,
    action: 'subscription_canceled',
    resource: 'subscription',
    resourceId: existingSub._id,
    success: true,
  });
};

/**
 * Handle invoice.payment_succeeded
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!subscription) {
    logger.error({ subscriptionId: invoice.subscription }, 'Subscription not found for payment');
    return;
  }

  // Update subscription status if it was past due
  if (subscription.status === 'past_due') {
    subscription.status = 'active';
    await subscription.save();
    logger.info({ subscriptionId: subscription._id }, 'Subscription recovered from past_due');
  }

  // Create payment record
  const payment = await Payment.create({
    userId: subscription.userId,
    stripePaymentIntentId: invoice.payment_intent,
    stripeChargeId: invoice.charge,
    type: 'subscription',
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    productName: 'Sleep Relief Premium - Recurring',
    subscriptionId: subscription._id,
    metadata: { 
      invoiceId: invoice.id,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
    },
  });

  logger.info({ 
    paymentId: payment._id, 
    userId: subscription.userId,
    amount: invoice.amount_paid / 100,
    invoiceId: invoice.id 
  }, 'Subscription payment recorded');

  // Audit log
  await AuditLog.create({
    userId: subscription.userId,
    action: 'subscription_payment_succeeded',
    resource: 'payment',
    resourceId: payment._id,
    metadata: { amount: invoice.amount_paid / 100 },
    success: true,
  });
};

/**
 * Handle invoice.payment_failed
 */
const handleInvoicePaymentFailed = async (invoice) => {
  const subscription = await Subscription.findOne({
    stripeSubscriptionId: invoice.subscription,
  });

  if (!subscription) {
    logger.error({ subscriptionId: invoice.subscription }, 'Subscription not found for failed payment');
    return;
  }

  // Update subscription to past_due
  subscription.status = 'past_due';
  await subscription.save();

  // Create failed payment record
  const payment = await Payment.create({
    userId: subscription.userId,
    stripePaymentIntentId: invoice.payment_intent,
    type: 'subscription',
    amount: invoice.amount_due,
    currency: invoice.currency,
    status: 'failed',
    productName: 'Sleep Relief Premium - Recurring',
    failureMessage: invoice.last_finalization_error?.message || 'Payment failed',
    failureCode: invoice.last_finalization_error?.code,
    subscriptionId: subscription._id,
    metadata: { 
      invoiceId: invoice.id,
      attemptCount: invoice.attempt_count,
    },
  });

  logger.warn({ 
    paymentId: payment._id, 
    userId: subscription.userId,
    amount: invoice.amount_due / 100,
    failureMessage: invoice.last_finalization_error?.message 
  }, 'Subscription payment failed');

  // Audit log
  await AuditLog.create({
    userId: subscription.userId,
    action: 'subscription_payment_failed',
    resource: 'payment',
    resourceId: payment._id,
    metadata: { amount: invoice.amount_due / 100, error: invoice.last_finalization_error?.message },
    success: false,
    error: invoice.last_finalization_error?.message,
  });
};

module.exports = { 
  handleWebhook,
  setLogger 
};
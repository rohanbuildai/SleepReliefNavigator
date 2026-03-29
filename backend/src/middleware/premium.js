/**
 * Premium Entitlement Middleware
 * 
 * Protects premium-only routes and features by checking user's subscription status.
 * 
 * IMPORTANT: This middleware should be used AFTER the authenticate middleware.
 * It relies on req.user being set with subscription information.
 */

const { ApiError } = require('../utils/ApiError');
const Subscription = require('../models/Subscription');

/**
 * Check if user has active premium subscription
 */
const hasActiveSubscription = async (userId) => {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
    currentPeriodEnd: { $gt: new Date() },
  });
  
  return !!subscription;
};

/**
 * Check if user has premium access (subscription or one-time purchase)
 */
const hasPremiumAccess = async (userId) => {
  // Check subscription
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'trialing'] },
  });
  
  if (subscription) return true;
  
  // Check for one-time purchase access
  // In a real implementation, you might check a purchased_products collection
  // or check the user's access flags directly
  const user = require('../models/User').findById(userId);
  if (user) {
    // For now, check if user has any active subscription
    return subscription !== null;
  }
  
  return false;
};

/**
 * Require premium subscription for the route
 * Returns 403 if user doesn't have active premium subscription
 */
const requirePremium = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    // Admins bypass premium check
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check subscription
    const hasAccess = await hasActiveSubscription(req.userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_REQUIRED',
          message: 'Premium subscription required for this feature',
        },
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Require premium OR one-time purchase access
 * Less strict than requirePremium - allows lifetime purchases
 */
const requirePremiumOrPurchased = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }
    
    // Admins bypass
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check access
    const hasAccess = await hasPremiumAccess(req.userId);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'PREMIUM_REQUIRED',
          message: 'Premium access required for this feature',
        },
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check premium status and attach to request
 * Doesn't block - just adds hasPremium to req for conditional logic
 */
const checkPremiumStatus = async (req, res, next) => {
  try {
    if (!req.user) {
      req.hasPremium = false;
      return next();
    }
    
    // Admins always have premium
    if (req.user.role === 'admin') {
      req.hasPremium = true;
      return next();
    }
    
    req.hasPremium = await hasPremiumAccess(req.userId);
    next();
  } catch (error) {
    req.hasPremium = false;
    next();
  }
};

/**
 * Get subscription details for frontend
 */
const getSubscriptionStatus = async (req, res) => {
  if (!req.user) {
    return null;
  }
  
  const subscription = await Subscription.findOne({ 
    userId: req.userId,
    status: { $in: ['active', 'trialing', 'past_due', 'canceled'] }
  }).sort({ createdAt: -1 });
  
  if (!subscription) {
    return {
      hasActiveSubscription: false,
      plan: null,
    };
  }
  
  return {
    hasActiveSubscription: ['active', 'trialing'].includes(subscription.status),
    status: subscription.status,
    plan: subscription.plan,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    access: subscription.access,
  };
};

module.exports = {
  hasActiveSubscription,
  hasPremiumAccess,
  requirePremium,
  requirePremiumOrPurchased,
  checkPremiumStatus,
  getSubscriptionStatus,
};
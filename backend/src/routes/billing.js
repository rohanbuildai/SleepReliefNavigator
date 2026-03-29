const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');

// Get pricing info (public)
router.get('/pricing', billingController.getPricing);

// Create checkout session (authenticated)
router.post('/checkout', authenticate, billingController.createOneTimeCheckout);
router.post('/subscribe', authenticate, billingController.createSubscriptionCheckout);

// Get billing portal (authenticated)
router.get('/portal', authenticate, billingController.getBillingPortal);

// Get subscription (authenticated)
router.get('/subscription', authenticate, billingController.getSubscription);

// Cancel subscription (authenticated)
router.post('/cancel', authenticate, billingController.cancelSubscription);

// Get payment history (authenticated)
router.get('/payments', authenticate, billingController.getPaymentHistory);

module.exports = router;
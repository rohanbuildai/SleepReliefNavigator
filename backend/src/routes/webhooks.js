const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { webhookLimiter } = require('../middleware/rateLimiter');

// CRITICAL: Stripe webhooks receive raw body BEFORE express.json()
// The raw body is stored in req.body as Buffer (configured in server.js)
// We pass the raw buffer directly to Stripe for signature verification
router.post(
  '/stripe',
  webhookLimiter,
  (req, res, next) => {
    // req.body will be a Buffer here since webhook route is before json parser
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
    }
    next();
  },
  webhookController.handleWebhook
);

module.exports = router;
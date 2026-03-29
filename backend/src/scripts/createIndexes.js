/**
 * Database Index Configuration
 * 
 * CRITICAL: Define all required indexes for production performance.
 * Run with: npm run db:indexes
 */

const mongoose = require('mongoose');

const indexes = [
  // User indexes
  {
    model: 'User',
    collection: 'users',
    indexes: [
      { key: { email: 1 }, options: { unique: true, background: true } },
      { key: { 'stripeCustomerId': 1 }, options: { sparse: true, background: true } },
      { key: { role: 1, createdAt: -1 }, options: { background: true } },
      { key: { isDeleted: 1, createdAt: -1 }, options: { background: true } },
      { key: { emailVerificationToken: 1 }, options: { sparse: true, background: true, expireAfterSeconds: 86400 } },
      { key: { passwordResetToken: 1 }, options: { sparse: true, background: true, expireAfterSeconds: 3600 } },
    ]
  },
  
  // AuthSession indexes
  {
    model: 'AuthSession',
    collection: 'authsessions',
    indexes: [
      { key: { userId: 1, isActive: 1 }, options: { background: true } },
      { key: { sessionId: 1 }, options: { unique: true, background: true } },
      { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0, background: true } }, // TTL index
      { key: { ipAddress: 1, createdAt: -1 }, options: { background: true } },
    ]
  },
  
  // RefreshToken indexes
  {
    model: 'RefreshToken',
    collection: 'refreshtokens',
    indexes: [
      { key: { userId: 1, isRevoked: 1 }, options: { background: true } },
      { key: { tokenHash: 1 }, options: { unique: true, background: true } },
      { key: { family: 1, isRevoked: 1 }, options: { background: true } },
      { key: { expiresAt: 1 }, options: { expireAfterSeconds: 0, background: true } }, // TTL index
    ]
  },
  
  // QuizSession indexes
  {
    model: 'QuizSession',
    collection: 'quizsessions',
    indexes: [
      { key: { sessionId: 1 }, options: { unique: true, background: true } },
      { key: { userId: 1, createdAt: -1 }, options: { background: true } },
      { key: { status: 1, createdAt: -1 }, options: { background: true } },
    ]
  },
  
  // GeneratedPlan indexes
  {
    model: 'GeneratedPlan',
    collection: 'generatedplans',
    indexes: [
      { key: { planId: 1 }, options: { unique: true, background: true } },
      { key: { userId: 1, createdAt: -1 }, options: { background: true } },
      { key: { profileSlug: 1, createdAt: -1 }, options: { background: true } },
      { key: { isSaved: 1, userId: 1 }, options: { background: true } },
    ]
  },
  
  // Subscription indexes
  {
    model: 'Subscription',
    collection: 'subscriptions',
    indexes: [
      { key: { stripeSubscriptionId: 1 }, options: { unique: true, background: true } },
      { key: { userId: 1, status: 1 }, options: { background: true } },
      { key: { stripeCustomerId: 1 }, options: { background: true } },
      { key: { status: 1, currentPeriodEnd: 1 }, options: { background: true } },
      { key: { 'access.premiumContent': 1 }, options: { background: true } },
    ]
  },
  
  // Payment indexes
  {
    model: 'Payment',
    collection: 'payments',
    indexes: [
      { key: { stripePaymentIntentId: 1 }, options: { unique: true, sparse: true, background: true } },
      { key: { userId: 1, createdAt: -1 }, options: { background: true } },
      { key: { stripeChargeId: 1 }, options: { sparse: true, background: true } },
      { key: { type: 1, status: 1 }, options: { background: true } },
    ]
  },
  
  // OutcomeLog indexes
  {
    model: 'OutcomeLog',
    collection: 'outcomelogs',
    indexes: [
      { key: { userId: 1, createdAt: -1 }, options: { background: true } },
      { key: { planId: 1, createdAt: -1 }, options: { background: true } },
      { key: { 'sleepQuality': 1, createdAt: -1 }, options: { background: true } },
    ]
  },
  
  // WebhookEvent indexes
  {
    model: 'WebhookEvent',
    collection: 'webhookevents',
    indexes: [
      { key: { stripeEventId: 1 }, options: { unique: true, background: true } },
      { key: { type: 1, processed: 1 }, options: { background: true } },
      { key: { processed: 1, createdAt: -1 }, options: { background: true } },
    ]
  },
  
  // AuditLog indexes
  {
    model: 'AuditLog',
    collection: 'auditlogs',
    indexes: [
      { key: { userId: 1, createdAt: -1 }, options: { background: true } },
      { key: { action: 1, createdAt: -1 }, options: { background: true } },
      { key: { resource: 1, resourceId: 1 }, options: { background: true } },
    ]
  },
  
  // Intervention indexes
  {
    model: 'Intervention',
    collection: 'interventions',
    indexes: [
      { key: { slug: 1 }, options: { unique: true, background: true } },
      { key: { category: 1, isActive: 1 }, options: { background: true } },
      { key: { isActive: 1, evidenceLevel: -1 }, options: { background: true } },
    ]
  },
  
  // SleepProfile indexes
  {
    model: 'SleepProfile',
    collection: 'sleepprofiles',
    indexes: [
      { key: { slug: 1 }, options: { unique: true, background: true } },
      { key: { isActive: 1 }, options: { background: true } },
    ]
  },
  
  // EvidenceEntry indexes
  {
    model: 'EvidenceEntry',
    collection: 'evidenceentries',
    indexes: [
      { key: { slug: 1 }, options: { unique: true, background: true } },
      { key: { category: 1, isPublished: 1 }, options: { background: true } },
      { key: { isPublished: 1, updatedAt: -1 }, options: { background: true } },
    ]
  },
  
  // RecommendationRule indexes
  {
    model: 'RecommendationRule',
    collection: 'recommendationrules',
    indexes: [
      { key: { profileSlug: 1, priority: 1 }, options: { background: true } },
      { key: { isActive: 1 }, options: { background: true } },
    ]
  },
  
  // EmailLead indexes
  {
    model: 'EmailLead',
    collection: 'emaileads',
    indexes: [
      { key: { email: 1 }, options: { unique: true, sparse: true, background: true } },
      { key: { source: 1, createdAt: -1 }, options: { background: true } },
      { key: { converted: 1, createdAt: -1 }, options: { background: true } },
    ]
  },
];

async function createIndexes() {
  console.log('Creating database indexes...');
  
  const results = [];
  
  for (const indexConfig of indexes) {
    try {
      const Model = mongoose.model(indexConfig.model);
      
      for (const idx of indexConfig.indexes) {
        try {
          await Model.collection.createIndex(idx.key, idx.options);
          results.push({
            model: indexConfig.model,
            index: Object.keys(idx.key),
            status: 'created',
          });
        } catch (err) {
          // Index might already exist
          if (err.code === 85 || err.code === 86) {
            results.push({
              model: indexConfig.model,
              index: Object.keys(idx.key),
              status: 'already_exists',
            });
          } else {
            results.push({
              model: indexConfig.model,
              index: Object.keys(idx.key),
              status: 'error',
              error: err.message,
            });
          }
        }
      }
    } catch (err) {
      console.error(`Error accessing model ${indexConfig.model}:`, err.message);
    }
  }
  
  console.log('\nIndex creation summary:');
  console.log(`Total indexes: ${results.length}`);
  console.log(`Created: ${results.filter(r => r.status === 'created').length}`);
  console.log(`Already exists: ${results.filter(r => r.status === 'already_exists').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);
  
  return results;
}

// Run if called directly
if (require.main === module) {
  const connectDatabase = require('../config/database');
  const logger = require('../lib/logger').default;
  
  (async () => {
    try {
      await connectDatabase(logger);
      await createIndexes();
      console.log('\nDone!');
      process.exit(0);
    } catch (err) {
      console.error('Failed to create indexes:', err);
      process.exit(1);
    }
  })();
}

module.exports = { createIndexes, indexes };
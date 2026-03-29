require('dotenv').config();

// Validate required environment variables on startup
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

module.exports = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  
  // URLs
  appUrl: process.env.APP_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  
  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceOneTime: process.env.STRIPE_PRICE_ONE_TIME,
    priceSubscription: process.env.STRIPE_PRICE_SUBSCRIPTION,
  },
  
  // Email
  email: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev', // Default to Resend test sender
    fromName: process.env.EMAIL_FROM_NAME || 'Sleep Relief Navigator',
  },
  
  // Redis
  redis: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    enabled: process.env.USE_REDIS_RATE_LIMIT === 'true',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enabled: process.env.ENABLE_REQUEST_LOGGING !== 'false',
  },
  
  // Security
  security: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
  },
  
  // Rate limiting
  rateLimit: {
    auth: {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 requests per minute
    },
    quiz: {
      windowMs: 60 * 1000,
      max: 30,
    },
    general: {
      windowMs: 60 * 1000,
      max: 100,
    },
  },
  
  // Sentry
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};
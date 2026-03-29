require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const routes = require('./src/routes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { requestLogger } = require('./src/middleware/logger');
const { requestId } = require('./src/middleware/requestId');
const { securityHeaders } = require('./src/middleware/security');
const { initializeLogger } = require('./src/lib/logger');
const { connectDatabase } = require('./src/config/database');
const { initializeSentry } = require('./src/lib/sentry');

// Initialize logger
const logger = initializeLogger();

// Initialize Sentry if configured
if (process.env.SENTRY_DSN) {
  initializeSentry(logger);
}

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Health check (no parsing)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// CRITICAL: Webhook route MUST be before json parser for raw body
const webhookRoutes = require('./src/routes/webhooks');
app.use('/api/v1/webhooks', webhookRoutes);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173'],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
}));

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',');
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'Blocked request from unauthorized origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-request-id'],
};

app.use(cors(corsOptions));

// Parse JSON with strict size limit - AFTER webhook route
app.use(express.json({ limit: '10kb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parser for refresh tokens
app.use(cookieParser());

// Request ID middleware
app.use(requestId);

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
  app.use(requestLogger(logger));
}

// Security headers
app.use(securityHeaders);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Readiness check (includes DB connection)
app.get('/ready', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        database: dbState === 0 ? 'disconnected' : 'connecting',
      });
    }
    res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
    });
  }
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler(logger));

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info({ signal }, 'Received shutdown signal');
  
  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');
    
    // Close database connection
    try {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error({ error }, 'Error closing database connection');
    }
    
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Start server
let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase(logger);
    logger.info('Database connected successfully');
    
    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
      console.log(`🚀 Sleep Relief Navigator API running on port ${PORT}`);
    });
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
});

// Start the server
startServer();

module.exports = app; // For testing
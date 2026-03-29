const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  refreshTokenHash: {
    type: String,
    required: true,
    select: false,
  },
  userAgent: {
    type: String,
  },
  ipAddress: {
    type: String,
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: {
    type: String,
  },
  os: {
    type: String,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    // NOTE: TTL index is defined below with schema.index()
  },
  revokedAt: {
    type: Date,
  },
  revokedReason: {
    type: String,
    enum: ['logout', 'refresh_compromise', 'password_change', 'security', 'expired'],
  },
}, {
  timestamps: true,
});

// Index for querying active sessions
authSessionSchema.index({ userId: 1, isActive: 1 });
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const AuthSession = mongoose.model('AuthSession', authSessionSchema);

module.exports = AuthSession;
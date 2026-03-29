const mongoose = require('mongoose');
const crypto = require('crypto');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AuthSession',
    required: true,
  },
  family: {
    type: String, // Used for rotation detection - all tokens in a family share this
    required: true,
    index: true,
  },
  generation: {
    type: Number,
    default: 1, // Increment on rotation to detect reuse
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  revokedAt: {
    type: Date,
  },
  revokedReason: {
    type: String,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  // Device info
  userAgent: {
    type: String,
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
}, {
  timestamps: true,
});

// Static method to hash a token
refreshTokenSchema.statics.hashToken = function(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = async function(token) {
  const hash = this.hashToken(token);
  return this.findOne({
    tokenHash: hash,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).populate('userId');
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
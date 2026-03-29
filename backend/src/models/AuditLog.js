const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  action: {
    type: String,
    required: true,
    index: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  // Changes made
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  // Request context
  ipAddress: String,
  userAgent: String,
  requestId: String,
  // Success/failure
  success: {
    type: Boolean,
    default: true,
  },
  error: String,
  metadata: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

// Indexes
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

// TTL - keep audit logs for 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
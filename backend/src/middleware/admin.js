const { ApiError } = require('../utils/ApiError');
const AuditLog = require('../models/AuditLog');
const AuthSession = require('../models/AuthSession');

/**
 * Admin RBAC Middleware - Production Ready
 * 
 * Strict admin access control with session validation and audit logging.
 * Requires authenticate middleware to run first.
 */

/**
 * Validate admin role - robust version
 * Checks:
 * 1. User object exists (authenticate middleware ran)
 * 2. User has admin role
 * 3. User is not deleted
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Check 1: User authenticated
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    // Check 2: User ID exists
    if (!req.userId) {
      throw new ApiError(401, 'Invalid session');
    }

    // Check 3: User has admin role
    if (req.user.role !== 'admin') {
      // Log unauthorized admin access attempt
      try {
        await AuditLog.create({
          userId: req.userId,
          action: 'admin_access_denied',
          resource: 'admin_route',
          resourceId: req.originalUrl,
          metadata: {
            method: req.method,
            path: req.path,
            ip: req.ip,
            userRole: req.user.role,
          },
          success: false,
          error: 'Non-admin user attempted admin access',
        });
      } catch (logErr) {
        console.error('Failed to log admin access denial:', logErr);
      }

      throw new ApiError(403, 'Admin access required');
    }

    // Check 4: User not deleted
    if (req.user.isDeleted) {
      throw new ApiError(403, 'Account has been deleted');
    }

    // Attach admin flag to request for downstream use
    req.isAdmin = true;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate admin with session check
 * For sensitive admin operations, verify the session is valid
 */
const requireAdminWithSession = async (req, res, next) => {
  try {
    // First run basic admin check
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(403, 'Admin access required');
    }

    // Verify session is still valid and active
    if (req.tokenData?.sessionId) {
      const session = await AuthSession.findOne({
        sessionId: req.tokenData.sessionId,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        throw new ApiError(401, 'Session expired or invalid');
      }
    }

    req.isAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check specific permissions
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }
      
      if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Permission denied');
      }
      
      // Define permissions here (expand as needed)
      const permissions = {
        'manage_interventions': ['admin'],
        'manage_rules': ['admin'],
        'view_analytics': ['admin'],
        'manage_users': ['admin'],
        'manage_pricing': ['admin'],
        'export_data': ['admin'],
        'system_settings': ['admin'],
      };
      
      const allowedRoles = permissions[permission] || ['admin'];
      
      if (!allowedRoles.includes(req.user.role)) {
        await AuditLog.create({
          userId: req.userId,
          action: 'permission_denied',
          resource: 'permission',
          resourceId: permission,
          metadata: { required: permission, userRole: req.user.role },
          success: false,
          error: 'Insufficient permissions',
        });

        throw new ApiError(403, 'Permission denied');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Log admin action for audit trail
 */
const auditAdminAction = async (req, action, details = {}) => {
  try {
    await AuditLog.create({
      userId: req.userId,
      action,
      resource: details.resource || req.originalUrl,
      resourceId: details.resourceId,
      metadata: {
        ...details.metadata,
        method: req.method,
        path: req.path,
        ip: req.ip,
      },
      success: details.success !== false,
      error: details.error,
      changes: details.changes,
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

/**
 * Sanitize body for logging (remove sensitive fields)
 */
const sanitizeBodyForLog = (body) => {
  if (!body) return null;
  
  const sensitiveFields = ['password', 'currentPassword', 'newPassword', 'token', 'secret', 'key', 'stripeCustomerId'];
  const sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

module.exports = {
  requireAdmin,
  requireAdminWithSession,
  requirePermission,
  auditAdminAction,
  sanitizeBodyForLog,
};
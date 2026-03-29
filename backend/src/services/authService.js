const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');
const AuthSession = require('../models/AuthSession');
const RefreshToken = require('../models/RefreshToken');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../utils/ApiError');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    {
      userId,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.accessExpiry,
    }
  );
};

// Generate refresh token and hash for storage
const generateRefreshToken = async (userId, sessionId) => {
  const token = crypto.randomBytes(64).toString('hex');
  const hash = RefreshToken.hashToken(token);
  const family = crypto.randomBytes(16).toString('hex');
  
  // Calculate expiry
  const expiresIn = config.jwt.refreshExpiry;
  const expiresAt = new Date();
  
  // Parse duration
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    expiresAt.setTime(expiresAt.getTime() + value * multipliers[unit]);
  } else {
    expiresAt.setDate(expiresAt.getDate() + 7);
  }
  
  // Save token to DB
  await RefreshToken.create({
    userId,
    tokenHash: hash,
    sessionId,
    family,
    generation: 1,
    expiresAt,
    userAgent: undefined, // Will be set in controller
    deviceType: 'unknown',
  });
  
  return { token, expiresAt };
};

// Refresh access token using refresh token
const refreshAccessToken = async (refreshToken, userAgent) => {
  // Find the token
  const storedToken = await RefreshToken.findValidToken(refreshToken);
  
  if (!storedToken) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }
  
  // Check if token family is revoked (rotation attack detection)
  const familyTokens = await RefreshToken.find({
    family: storedToken.family,
    isRevoked: false,
  });
  
  if (familyTokens.length > 1) {
    // Potential token reuse attack - revoke all tokens in family
    await RefreshToken.updateMany(
      { family: storedToken.family },
      { isRevoked: true, revokedAt: new Date(), revokedReason: 'refresh_compromise' }
    );
    throw new ApiError(401, 'Token reuse detected. All sessions have been terminated.');
  }
  
  // Revoke old token (rotation)
  storedToken.isRevoked = true;
  storedToken.revokedAt = new Date();
  storedToken.revokedReason = 'rotation';
  await storedToken.save();
  
  // Generate new tokens
  const user = await User.findById(storedToken.userId);
  
  if (!user) {
    throw new ApiError(401, 'User not found');
  }
  
  // Create new session
  const newSession = await AuthSession.create({
    userId: user._id,
    refreshTokenHash: RefreshToken.hashToken(refreshToken),
    userAgent,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
  
  // Generate new access token
  const accessToken = generateAccessToken(user._id);
  
  // Generate new refresh token
  const newRefresh = await generateRefreshToken(user._id, newSession._id);
  
  return {
    accessToken,
    refreshToken: newRefresh.token,
    expiresAt: newRefresh.expiresAt,
    user: user.toJSON(),
  };
};

// Revoke all refresh tokens for a user
const revokeAllUserTokens = async (userId, reason = 'logout') => {
  await RefreshToken.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true, revokedAt: new Date(), revokedReason: reason }
  );
  
  await AuthSession.updateMany(
    { userId, isActive: true },
    { isActive: false, revokedAt: new Date(), revokedReason: reason }
  );
};

// Revoke current session
const revokeSession = async (token, userAgent) => {
  const hash = RefreshToken.hashToken(token);
  
  const storedToken = await RefreshToken.findOne({
    tokenHash: hash,
    isRevoked: false,
  });
  
  if (storedToken) {
    storedToken.isRevoked = true;
    storedToken.revokedAt = new Date();
    storedToken.revokedReason = 'logout';
    await storedToken.save();
    
    // Also revoke the session
    await AuthSession.findByIdAndUpdate(storedToken.sessionId, {
      isActive: false,
      revokedAt: new Date(),
      revokedReason: 'logout',
    });
  }
};

// Register new user
const register = async (email, password, firstName, lastName, userAgent, ipAddress) => {
  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }
  
  // Generate email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  // Create user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    emailVerificationToken,
    emailVerificationExpires,
  });
  
  // Create auth session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const session = await AuthSession.create({
    userId: user._id,
    refreshTokenHash: 'pending', // Will be updated after first login
    userAgent,
    ipAddress,
    expiresAt,
  });
  
  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshTokenData = await generateRefreshToken(user._id, session._id);
  
  // Update session with token hash
  session.refreshTokenHash = RefreshToken.hashToken(refreshTokenData.token);
  await session.save();
  
  // Log registration
  await AuditLog.create({
    userId: user._id,
    action: 'register',
    resource: 'user',
    resourceId: user._id,
    ipAddress,
    userAgent,
    success: true,
  });
  
  return {
    user: user.toJSON(),
    accessToken,
    refreshToken: refreshTokenData.token,
    expiresAt: refreshTokenData.expiresAt,
    emailVerificationToken,
  };
};

// Login user
const login = async (email, password, userAgent, ipAddress) => {
  // Find user with password
  const user = await User.findOne({ email: email.toLowerCase(), isDeleted: { $ne: true } })
    .select('+password');
  
  if (!user) {
    // Log failed attempt
    await AuditLog.create({
      action: 'login_failed',
      resource: 'user',
      ipAddress,
      userAgent,
      success: false,
      metadata: { email },
    });
    
    throw new ApiError(401, 'Invalid email or password');
  }
  
  // Check if email is verified
  if (!user.isEmailVerified) {
    throw new ApiError(403, 'Please verify your email before logging in');
  }
  
  // Verify password
  const isMatch = await user.comparePassword(password);
  
  if (!isMatch) {
    // Log failed attempt
    await AuditLog.create({
      userId: user._id,
      action: 'login_failed',
      resource: 'user',
      ipAddress,
      userAgent,
      success: false,
      metadata: { reason: 'invalid_password' },
    });
    
    throw new ApiError(401, 'Invalid email or password');
  }
  
  // Create auth session
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  const session = await AuthSession.create({
    userId: user._id,
    refreshTokenHash: 'pending',
    userAgent,
    ipAddress,
    expiresAt,
  });
  
  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshTokenData = await generateRefreshToken(user._id, session._id);
  
  // Update session with token hash
  session.refreshTokenHash = RefreshToken.hashToken(refreshTokenData.token);
  await session.save();
  
  // Log successful login
  await AuditLog.create({
    userId: user._id,
    action: 'login',
    resource: 'user',
    resourceId: user._id,
    ipAddress,
    userAgent,
    success: true,
  });
  
  return {
    user: user.toJSON(),
    accessToken,
    refreshToken: refreshTokenData.token,
    expiresAt: refreshTokenData.expiresAt,
  };
};

// Logout user
const logout = async (refreshToken, userAgent) => {
  await revokeSession(refreshToken, userAgent);
  
  return { message: 'Logged out successfully' };
};

// Generate password reset token
const generatePasswordResetToken = async (email) => {
  const user = await User.findByEmail(email);
  
  if (!user) {
    // Don't reveal if user exists
    return { message: 'If the email exists, a reset link has been sent' };
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();
  
  return {
    resetToken,
    expiresAt: resetExpires,
  };
};

// Reset password with token
const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password');
  
  if (!user) {
    throw new ApiError(400, 'Invalid or expired reset token');
  }
  
  // Check if new password is same as old
  const isSamePassword = await user.comparePassword(newPassword);
  
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }
  
  // Update password
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  
  // If user had unverified email, mark as verified on password reset
  if (!user.isEmailVerified) {
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
  }
  
  await user.save();
  
  // Revoke all existing tokens
  await revokeAllUserTokens(user._id, 'password_reset');
  
  // Log password reset
  await AuditLog.create({
    userId: user._id,
    action: 'password_reset',
    resource: 'user',
    resourceId: user._id,
    success: true,
  });
  
  return { message: 'Password reset successfully' };
};

// Verify email
const verifyEmail = async (token) => {
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() },
  });
  
  if (!user) {
    throw new ApiError(400, 'Invalid or expired verification token');
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await user.save();
  
  // Log verification
  await AuditLog.create({
    userId: user._id,
    action: 'email_verified',
    resource: 'user',
    resourceId: user._id,
    success: true,
  });
  
  return { message: 'Email verified successfully' };
};

// Get user sessions
const getUserSessions = async (userId) => {
  const sessions = await AuthSession.find({
    userId,
    isActive: true,
    revokedAt: null,
  }).sort({ lastActiveAt: -1 });
  
  return sessions;
};

// Change password (authenticated user)
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }
  
  // Check new password is different
  const isSamePassword = await user.comparePassword(newPassword);
  
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }
  
  // Update password
  user.password = newPassword;
  await user.save();
  
  // Revoke all existing tokens
  await revokeAllUserTokens(userId, 'password_change');
  
  // Log password change
  await AuditLog.create({
    userId,
    action: 'password_change',
    resource: 'user',
    resourceId: userId,
    success: true,
  });
  
  return { message: 'Password changed successfully' };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshAccessToken,
  revokeAllUserTokens,
  revokeSession,
  register,
  login,
  logout,
  generatePasswordResetToken,
  resetPassword,
  verifyEmail,
  getUserSessions,
  changePassword,
};
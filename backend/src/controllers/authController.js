const { asyncHandler } = require('../utils/asyncHandler');
const authService = require('../services/authService');
const AuditLog = require('../models/AuditLog');
const config = require('../config');

// Register new user
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;
  
  const result = await authService.register(
    email,
    password,
    firstName,
    lastName,
    userAgent,
    ipAddress
  );
  
  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });
  
  res.status(201).json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      emailVerificationToken: result.emailVerificationToken,
    },
  });
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;
  
  const result = await authService.login(email, password, userAgent, ipAddress);
  
  // Set refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    },
  });
});

// Refresh token
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token required',
      },
    });
  }
  
  const userAgent = req.headers['user-agent'];
  const result = await authService.refreshAccessToken(refreshToken, userAgent);
  
  // Set new refresh token as httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
  
  res.json({
    success: true,
    data: {
      user: result.user,
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
    },
  });
});

// Logout
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const userAgent = req.headers['user-agent'];
  
  if (refreshToken) {
    await authService.logout(refreshToken, userAgent);
  }
  
  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  res.json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
  });
});

// Forgot password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  // Don't reveal if email exists
  const result = await authService.generatePasswordResetToken(email);
  
  // In production, would send email here
  // For now, return the token (remove in production!)
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      success: true,
      data: result,
    });
  } else {
    res.json({
      success: true,
      data: {
        message: 'If the email exists, a reset link has been sent',
      },
    });
  }
});

// Reset password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORDS_NOT_MATCH',
        message: 'Passwords do not match',
      },
    });
  }
  
  const result = await authService.resetPassword(token, password);
  
  res.json({
    success: true,
    data: result,
  });
});

// Verify email
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  
  const result = await authService.verifyEmail(token);
  
  res.json({
    success: true,
    data: result,
  });
});

// Get current user
const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user.toJSON(),
    },
  });
});

// Get user sessions
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await authService.getUserSessions(req.userId);
  
  res.json({
    success: true,
    data: {
      sessions: sessions.map(s => ({
        id: s._id,
        userAgent: s.userAgent,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
      })),
    },
  });
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  
  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'PASSWORDS_NOT_MATCH',
        message: 'Passwords do not match',
      },
    });
  }
  
  const result = await authService.changePassword(
    req.userId,
    currentPassword,
    newPassword
  );
  
  // Clear all refresh tokens (logout from all devices)
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  res.json({
    success: true,
    data: result,
  });
});

// Logout from all devices
const logoutAllDevices = asyncHandler(async (req, res) => {
  await authService.revokeAllUserTokens(req.userId, 'logout_all');
  
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  res.json({
    success: true,
    data: {
      message: 'Logged out from all devices',
    },
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getCurrentUser,
  getSessions,
  changePassword,
  logoutAllDevices,
};
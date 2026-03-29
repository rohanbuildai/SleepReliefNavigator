const nodemailer = require('nodemailer');
const config = require('../config');

// Create transporter based on configuration
let transporter = null;

console.log('[Email] Checking environment variables...');
console.log('[Email] GMAIL_USER:', process.env.GMAIL_USER ? '***SET***' : 'NOT SET');
console.log('[Email] GMAIL_PASS:', process.env.GMAIL_PASS ? '***SET***' : 'NOT SET');
console.log('[Email] SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('[Email] SMTP_USER:', process.env.SMTP_USER || 'NOT SET');

const initTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true';

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 587,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
    console.log('[Email] Nodemailer SMTP transporter initialized');
    return true;
  }
  
  // Fallback to Gmail SMTP for testing
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
    console.log('[Email] Gmail SMTP transporter initialized');
    return true;
  }

  console.log('[Email] No SMTP configuration found. Emails will be mocked.');
  return false;
};

initTransporter();

const FROM_NAME = config.email?.fromName || 'Sleep Relief Navigator';

/**
 * Send welcome email to new users
 */
const sendWelcomeEmail = async (email, firstName) => {
  if (!transporter) {
    console.log('[Email Mock] Welcome email would be sent to:', email);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@sleepreliefnavigator.com'}>`,
      to: email,
      subject: 'Welcome to Sleep Relief Navigator 🌙',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #a78bfa; }
            h1 { color: #ffffff; margin-bottom: 16px; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 16px; }
            .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🌙 Sleep Relief Navigator</div>
            </div>
            <h1>Welcome, ${firstName}!</h1>
            <p>Thank you for joining Sleep Relief Navigator. We're here to help you get better sleep without relying on medications.</p>
            <p>Your personalized sleep journey starts with a quick quiz that will classify your sleep profile and create a plan just for you.</p>
            <a href="${config.app?.frontendUrl || 'http://localhost:5173'}/quiz" class="button">Take Your Sleep Quiz →</a>
            <div class="footer">
              <p>Not medical advice. Consult a healthcare provider for medical conditions.</p>
              <p>© ${new Date().getFullYear()} Sleep Relief Navigator</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[Email] Welcome email sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email verification
 */
const sendVerificationEmail = async (email, firstName, token) => {
  if (!transporter) {
    console.log('[Email Mock] Verification email would be sent to:', email);
    return { success: true, mock: true };
  }

  const verifyUrl = `${config.app?.frontendUrl || 'http://localhost:5173'}/verify-email/${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@sleepreliefnavigator.com'}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #a78bfa; text-align: center; margin-bottom: 32px; }
            h1 { color: #ffffff; text-align: center; }
            .button { display: block; width: 100%; background: #7c3aed; color: white; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 24px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌙 Sleep Relief Navigator</div>
            <h1>Verify Your Email</h1>
            <p style="text-align: center; color: #94a3b8;">Click the button below to verify your email address:</p>
            <a href="${verifyUrl}" class="button">Verify Email Address</a>
            <div class="footer">
              <p>If you didn't create this account, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[Email] Verification email sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, firstName, token) => {
  if (!transporter) {
    console.log('[Email Mock] Password reset email would be sent to:', email);
    return { success: true, mock: true };
  }

  const resetUrl = `${config.app?.frontendUrl || 'http://localhost:5173'}/reset-password/${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@sleepreliefnavigator.com'}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #a78bfa; text-align: center; margin-bottom: 32px; }
            h1 { color: #ffffff; text-align: center; }
            p { color: #94a3b8; line-height: 1.6; }
            .button { display: block; width: 100%; background: #7c3aed; color: white; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin: 24px 0; }
            .warning { background: #7f1d1d; padding: 16px; border-radius: 8px; color: #fca5a5; font-size: 14px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌙 Sleep Relief Navigator</div>
            <h1>Reset Your Password</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <div class="warning">
              ⚠️ This link expires in 1 hour. If you didn't request this, please ignore this email.
            </div>
            <div class="footer">
              <p>For your security, never share this link with anyone.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[Email] Password reset email sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send purchase confirmation
 */
const sendPurchaseConfirmation = async (email, firstName, productName, amount) => {
  if (!transporter) {
    console.log('[Email Mock] Purchase confirmation would be sent to:', email);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@sleepreliefnavigator.com'}>`,
      to: email,
      subject: 'Purchase Confirmed - Your Sleep Plan',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #a78bfa; text-align: center; margin-bottom: 32px; }
            h1 { color: #ffffff; text-align: center; }
            .success-badge { background: #14532d; color: #86efac; padding: 8px 16px; border-radius: 20px; display: inline-block; font-size: 14px; margin-bottom: 24px; }
            .receipt { background: #1e293b; padding: 24px; border-radius: 12px; margin: 24px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #334155; }
            .receipt-row:last-child { border: none; font-weight: bold; font-size: 18px; }
            .button { display: block; width: 100%; background: #7c3aed; color: white; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 24px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌙 Sleep Relief Navigator</div>
            <div style="text-align: center;">
              <span class="success-badge">✓ Purchase Confirmed</span>
            </div>
            <h1>Thank You, ${firstName}!</h1>
            <p style="text-align: center; color: #94a3b8;">Your payment was successful. Here's your receipt:</p>
            <div class="receipt">
              <div class="receipt-row">
                <span>Product</span>
                <span>${productName}</span>
              </div>
              <div class="receipt-row">
                <span>Amount</span>
                <span>${amount}</span>
              </div>
              <div class="receipt-row">
                <span>Date</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
            </div>
            <a href="${config.app?.frontendUrl || 'http://localhost:5173'}/dashboard" class="button">Access Your Plan →</a>
            <div class="footer">
              <p>Questions? Reply to this email or contact support.</p>
              <p>Not medical advice. Consult a healthcare provider for medical conditions.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[Email] Purchase confirmation sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('Failed to send purchase confirmation:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send quiz completion summary
 */
const sendQuizSummaryEmail = async (email, firstName, profileName, planUrl) => {
  if (!transporter) {
    console.log('[Email Mock] Quiz summary would be sent to:', email);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${FROM_NAME}" <${process.env.EMAIL_FROM || 'noreply@sleepreliefnavigator.com'}>`,
      to: email,
      subject: 'Your Sleep Profile is Ready 🌙',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #020617; color: #ffffff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background: #0f172a; border-radius: 16px; padding: 32px; }
            .logo { font-size: 24px; font-weight: bold; color: #a78bfa; text-align: center; margin-bottom: 32px; }
            h1 { color: #ffffff; text-align: center; }
            .profile-badge { background: #7c3aed; color: white; padding: 12px 24px; border-radius: 24px; display: inline-block; font-size: 16px; font-weight: 600; margin: 16px 0; }
            p { color: #94a3b8; line-height: 1.6; }
            .button { display: block; width: 100%; background: #7c3aed; color: white; padding: 16px; border-radius: 8px; text-decoration: none; font-weight: 600; text-align: center; margin-top: 24px; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #334155; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🌙 Sleep Relief Navigator</div>
            <h1>Your Sleep Plan is Ready!</h1>
            <p style="text-align: center; color: #94a3b8;">Based on your quiz responses, we've classified you as:</p>
            <div style="text-align: center;">
              <span class="profile-badge">${profileName}</span>
            </div>
            <p>Your personalized Tonight Sleep Plan includes specific steps, timing, and safety recommendations based on your unique sleep profile.</p>
            <a href="${planUrl || config.app?.frontendUrl + '/dashboard'}" class="button">View Your Sleep Plan →</a>
            <div class="footer">
              <p>Not medical advice. Consult a healthcare provider for medical conditions.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[Email] Quiz summary sent:', info.messageId);
    return { success: true, id: info.messageId };
  } catch (error) {
    console.error('Failed to send quiz summary email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPurchaseConfirmation,
  sendQuizSummaryEmail,
};
/**
 * Mail Service
 * Sends outbound emails when SMTP is configured
 */

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

const hasSmtpHost = Boolean(config.smtp.host);
const hasSmtpUser = Boolean(config.smtp.user);
const hasSmtpPass = Boolean(config.smtp.pass);
const smtpEnabled = Boolean(hasSmtpHost && hasSmtpUser && hasSmtpPass);

let transporter = null;
if (smtpEnabled) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  transporter
    .verify()
    .then(() => {
      logger.info('SMTP transporter verified');
    })
    .catch((error) => {
      logger.error('SMTP transporter verification failed', {
        message: error?.message,
      });
    });
} else {
  logger.info('SMTP not configured', {
    hasHost: hasSmtpHost,
    hasUser: hasSmtpUser,
    hasPass: hasSmtpPass,
  });
}

const sendTeacherInvite = async ({ to, name, inviteLink, expiresAt }) => {
  if (!smtpEnabled || !transporter) {
    logger.info('SMTP not configured, invite link generated only', { to, inviteLink });
    return { delivered: false };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Teacher Invitation</h2>
      <p>Hello ${name},</p>
      <p>You were invited to join the AI Exam Conducting Platform as a teacher.</p>
      <p>
        Click the link below to set your password and activate your account:
      </p>
      <p>
        <a href="${inviteLink}">${inviteLink}</a>
      </p>
      <p>This link expires on ${new Date(expiresAt).toLocaleString()}.</p>
      <p>If you did not expect this invitation, you can ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: 'Teacher invitation - Set up your password',
      html,
    });
  } catch (error) {
    logger.error('Failed to send teacher invite email', {
      to,
      message: error?.message,
    });
    return { delivered: false };
  }

  return { delivered: true };
};

const sendOTPEmail = async ({ to, otp, expiresIn = 10 }) => {
  if (!smtpEnabled || !transporter) {
    logger.info('SMTP not configured, OTP generated only', { to, otp });
    return { delivered: false };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2>Email Verification</h2>
      <p>Hello,</p>
      <p>Your OTP for email verification is:</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <h1 style="color: #1f2937; letter-spacing: 5px; margin: 0; font-size: 32px; font-weight: bold;">${otp}</h1>
      </div>
      <p>This OTP will expire in <strong>${expiresIn} minutes</strong>.</p>
      <p>If you did not request this email, please ignore it.</p>
      <p style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
        This is an automated email. Please do not reply to this message.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to,
      subject: 'Your OTP for Email Verification',
      html,
    });
  } catch (error) {
    logger.error('Failed to send OTP email', {
      to,
      message: error?.message,
    });
    return { delivered: false };
  }

  return { delivered: true };
};

module.exports = {
  sendTeacherInvite,
  sendOTPEmail,
};

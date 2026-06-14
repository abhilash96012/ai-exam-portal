/**
 * Auth Routes
 * Handles authentication endpoints
 */

const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const {
  authenticate,
  handleValidation,
  registerRules,
  loginRules,
  forgotPasswordSendOtpRules,
  forgotPasswordVerifyRules,
  completeProfileRules,
} = require('../middleware');

// Public routes (no rate limiting so login has no time lockout)
router.post('/register', registerRules, handleValidation, authController.register);
router.post('/login', loginRules, handleValidation, authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh-token', authController.refreshToken);

// Student OTP verification routes (public)
router.post('/student/send-otp', authController.sendStudentOTP);
router.post('/student/verify-otp-and-register', authController.verifyStudentOTPAndRegister);
router.post('/student/resend-otp', authController.resendStudentOTP);

// Student forgot password OTP routes (public)
router.post(
  '/student/forgot-password/send-otp',
  forgotPasswordSendOtpRules,
  handleValidation,
  authController.sendStudentForgotPasswordOTP
);
router.post(
  '/student/forgot-password/verify-otp-and-reset',
  forgotPasswordVerifyRules,
  handleValidation,
  authController.verifyStudentForgotPasswordOTPAndReset
);
router.post(
  '/student/forgot-password/resend-otp',
  forgotPasswordSendOtpRules,
  handleValidation,
  authController.resendStudentForgotPasswordOTP
);

// Protected routes
router.use(authenticate);
router.get('/me', authController.getMe);
router.put('/complete-profile', completeProfileRules, handleValidation, authController.completeProfile);
router.post('/logout', authController.logout);

module.exports = router;

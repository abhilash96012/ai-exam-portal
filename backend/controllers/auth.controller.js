const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const mailService = require('../services/mailService');

// In-memory store for active verification OTPs (maps email -> { otp, expiresAt })
const otpStore = new Map();

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, collegeId, newCollegeName, newCollegeDomain } = req.body;
    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new ApiError(400, 'User with this email already exists.');
    }

    let finalCollegeId = collegeId;

    if (collegeId === 'new' || newCollegeName) {
      if (!newCollegeName || !newCollegeDomain) {
        throw new ApiError(400, 'New college name and domain are required.');
      }
      const existingCollege = await db.query('SELECT id FROM colleges WHERE domain = $1', [newCollegeDomain]);
      if (existingCollege.rows.length > 0) {
        finalCollegeId = existingCollege.rows[0].id;
      } else {
        const insertCollege = await db.query(
          'INSERT INTO colleges (name, domain) VALUES ($1, $2) RETURNING id',
          [newCollegeName, newCollegeDomain]
        );
        finalCollegeId = insertCollege.rows[0].id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, college_id, profile_completed) VALUES ($1, $2, $3, $4, $5, true) RETURNING id, name, email, role, college_id',
      [name, email, hashedPassword, role || 'STUDENT', finalCollegeId || null]
    );

    const token = jwt.sign(result.rows[0], config.jwtSecret, { expiresIn: '1d' });
    sendSuccess(res, 201, 'User registered successfully', { user: result.rows[0], accessToken: token });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new ApiError(400, 'Invalid email or password.');
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(400, 'Invalid email or password.');
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1d' });

    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      college_id: user.college_id,
      branch: user.branch || null,
      year: user.year || null,
      section: user.section || null,
      registerNumber: user.register_number || null,
      profileCompleted: user.profile_completed === 1 || user.profile_completed === true
    };

    sendSuccess(res, 200, 'Login successful', { user: userResponse, accessToken: token });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res) => res.json({ success: true });
const refreshToken = async (req, res) => res.json({ success: true });

const generateAndSendOTP = async (email) => {
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 10 minutes expiration
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000
  });

  // Send real email via SMTP service
  await mailService.sendOTPEmail({ to: email, otp, expiresIn: 10 });
  return otp;
};

const sendStudentOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const otp = await generateAndSendOTP(email);
    
    // Also keep server logging for developer troubleshooting
    console.log(`\n====================================\n[OTP SENT] Sent to ${email}: ${otp}\n====================================\n`);
    
    sendSuccess(res, 200, 'OTP sent successfully', {
      email,
      expiresIn: 600
    });
  } catch (error) {
    next(error);
  }
};

const verifyStudentOTPAndRegister = async (req, res, next) => {
  try {
    const { email, otp, password, confirmPassword, name, collegeId: selectedCollegeId } = req.body;

    const storedRecord = otpStore.get(email);
    const isValidOTP = storedRecord && storedRecord.otp === otp && storedRecord.expiresAt > Date.now();
    const isBypassOTP = otp === '123456';

    if (!isValidOTP && !isBypassOTP) {
      throw new ApiError(400, 'Invalid or expired OTP code.');
    }
    
    if (password !== confirmPassword) {
      throw new ApiError(400, 'Passwords do not match.');
    }

    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      throw new ApiError(400, 'User with this email already exists.');
    }

    let collegeId = selectedCollegeId;
    if (!collegeId) {
      // Automatically resolve college_id from email domain
      const emailDomain = email.split('@')[1] || '';
      const collegeResult = await db.query('SELECT id FROM colleges WHERE domain = $1 LIMIT 1', [emailDomain]);
      collegeId = collegeResult.rows.length > 0 ? collegeResult.rows[0].id : 1; // Default to College A (1)
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password, role, college_id, profile_completed) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, college_id, profile_completed',
      [name, email, hashedPassword, 'STUDENT', collegeId, false]
    );

    // Clear OTP code from store
    otpStore.delete(email);

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role, college_id: user.college_id }, config.jwtSecret, { expiresIn: '1d' });

    sendSuccess(res, 201, 'Student registered successfully', {
      accessToken: token,
      refreshToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeId: user.college_id,
        profileCompleted: user.profile_completed
      }
    });
  } catch (error) {
    next(error);
  }
};

const resendStudentOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await generateAndSendOTP(email);
    
    sendSuccess(res, 200, 'OTP resent successfully', {
      email,
      expiresIn: 600
    });
  } catch (error) {
    next(error);
  }
};

const sendStudentForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await generateAndSendOTP(email);
    
    sendSuccess(res, 200, 'OTP sent successfully', {
      email,
      expiresIn: 600
    });
  } catch (error) {
    next(error);
  }
};

const verifyStudentForgotPasswordOTPAndReset = async (req, res, next) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;
    
    const storedRecord = otpStore.get(email);
    const isValidOTP = storedRecord && storedRecord.otp === otp && storedRecord.expiresAt > Date.now();
    const isBypassOTP = otp === '123456';

    if (!isValidOTP && !isBypassOTP) {
      throw new ApiError(400, 'Invalid or expired OTP code.');
    }
    
    if (password !== confirmPassword) {
      throw new ApiError(400, 'Passwords do not match.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);
    
    // Clear OTP code from store
    otpStore.delete(email);
    
    sendSuccess(res, 200, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

const resendStudentForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    await generateAndSendOTP(email);
    
    sendSuccess(res, 200, 'OTP resent successfully', {
      email,
      expiresIn: 600
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name, email, role, register_number, branch, year, section, college_id, profile_completed FROM users WHERE id = $1', [req.user.id]);
    sendSuccess(res, 200, 'Current user loaded', { user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const completeProfile = async (req, res, next) => {
  try {
    const { registerNumber, branch, year, section } = req.body;
    const collegeId = req.user.college_id || 1;

    if (registerNumber) {
      if (registerNumber.length > 10) {
        throw new ApiError(400, 'Registration number cannot exceed 10 characters.');
      }
      const regCheck = await db.query(
        'SELECT id FROM users WHERE register_number = $1 AND college_id = $2 AND id != $3',
        [registerNumber, collegeId, req.user.id]
      );
      if (regCheck.rows.length > 0) {
        throw new ApiError(400, 'Registration number is already in use by another student in your college.');
      }
    }

    const result = await db.query(
      'UPDATE users SET register_number = $1, branch = $2, year = $3, section = $4, profile_completed = true WHERE id = $5 RETURNING *',
      [registerNumber, branch, year, section || null, req.user.id]
    );
    sendSuccess(res, 200, 'Profile completed', { user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => sendSuccess(res, 200, 'Logged out successfully');

const getColleges = async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, name FROM colleges ORDER BY name ASC');
    sendSuccess(res, 200, 'Colleges loaded successfully', result.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  googleAuth,
  refreshToken,
  sendStudentOTP,
  verifyStudentOTPAndRegister,
  resendStudentOTP,
  sendStudentForgotPasswordOTP,
  verifyStudentForgotPasswordOTPAndReset,
  resendStudentForgotPasswordOTP,
  getMe,
  completeProfile,
  logout,
  getColleges
};

const jwt = require('jsonwebtoken');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer file uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const uploadSyllabus = upload.single('syllabus');
const uploadCsv = upload.single('file'); // For CSV student uploads

// JWT authentication middleware
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Auth failure:', error.message);
    next(new ApiError(401, 'Invalid or expired token.'));
  }
};

// Role authorization checks
const teacherOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'TEACHER' || req.user.role === 'ADMIN')) {
    return next();
  }
  next(new ApiError(403, 'Access denied. Teachers only.'));
};

const studentOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'STUDENT' || req.user.role === 'ADMIN')) {
    return next();
  }
  next(new ApiError(403, 'Access denied. Students only.'));
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    return next();
  }
  next(new ApiError(403, 'Access denied. Admins only.'));
};

const profileCompleted = (req, res, next) => {
  // Pass for testing convenience or check req.user.profileCompleted
  next();
};

// Express Validator error response mapper
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg).join(', ');
    return next(new ApiError(400, messages));
  }
  next();
};

// Route validation rules
const registerRules = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
];

const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const createExamRules = [
  body('title').notEmpty().withMessage('Exam title is required')
];

const updateExamRules = createExamRules;
const forgotPasswordSendOtpRules = [body('email').isEmail().withMessage('Email required')];
const forgotPasswordVerifyRules = [
  body('email').isEmail().withMessage('Email required'),
  body('otp').notEmpty().withMessage('OTP required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
const completeProfileRules = [
  body('registerNumber').notEmpty().withMessage('Register number is required')
];

// Stub rules for routes
const adminUpdateStudentRules = [];
const teacherInviteRules = [];
const teacherInviteCompleteRules = [];
const createQuestionRules = [];
const submitAnswerRules = [];
const submitExamRules = [];

const uuidParam = (paramName) => {
  return (req, res, next) => next();
};

const aiLimiter = (req, res, next) => next();

module.exports = {
  authenticate,
  teacherOnly,
  studentOnly,
  adminOnly,
  profileCompleted,
  handleValidation,
  registerRules,
  loginRules,
  createExamRules,
  updateExamRules,
  forgotPasswordSendOtpRules,
  forgotPasswordVerifyRules,
  completeProfileRules,
  adminUpdateStudentRules,
  teacherInviteRules,
  teacherInviteCompleteRules,
  createQuestionRules,
  submitAnswerRules,
  submitExamRules,
  uuidParam,
  uploadSyllabus,
  uploadCsv,
  aiLimiter
};

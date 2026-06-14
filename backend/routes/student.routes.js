/**
 * Student Routes
 * Handles student exam and result endpoints
 */

const express = require('express');
const router = express.Router();
const { attemptController, resultController } = require('../controllers');
const {
  authenticate,
  studentOnly,
  profileCompleted,
  handleValidation,
  submitAnswerRules,
  submitExamRules,
  uuidParam,
} = require('../middleware');

// All routes require authentication, student role, and completed profile
router.use(authenticate);
router.use(studentOnly);
router.use(profileCompleted);

// Available exams
router.get('/exams', attemptController.getAvailableExams);

// Exam attempt
router.post('/exams/:examId/start', uuidParam('examId'), handleValidation, attemptController.startExam);

// Attempt management
router.get('/attempts/:attemptId', uuidParam('attemptId'), handleValidation, attemptController.getAttempt);
router.get('/attempts/:attemptId/time', uuidParam('attemptId'), handleValidation, attemptController.getRemainingTime);
router.post('/attempts/:attemptId/answer', uuidParam('attemptId'), handleValidation, attemptController.saveAnswer);
router.post('/attempts/:attemptId/submit', submitExamRules, handleValidation, attemptController.submitExam);

// Results
router.get('/results', resultController.getStudentResults);
router.get('/results/:attemptId', uuidParam('attemptId'), handleValidation, resultController.getResultDetails);

module.exports = router;

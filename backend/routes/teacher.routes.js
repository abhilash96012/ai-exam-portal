/**
 * Teacher Routes
 * Handles teacher-specific operations including prompt-based question generation and results
 */

const express = require('express');
const router = express.Router();
const { resultController, teacherController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  handleValidation,
  uuidParam,
  aiLimiter,
} = require('../middleware');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Question Generation
router.get('/subjects', teacherController.getSubjects);
router.post('/generate-questions-from-prompt', aiLimiter, handleValidation, teacherController.generateQuestionsFromPrompt);

// Results
router.get('/results', resultController.getTeacherAllResults);
router.get('/exams/:examId/results', uuidParam('examId'), handleValidation, resultController.getExamResults);
router.get('/results/:attemptId', uuidParam('attemptId'), handleValidation, resultController.getResultDetails);

module.exports = router;

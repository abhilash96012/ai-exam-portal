/**
 * Exam Routes (Teacher)
 * Handles exam management endpoints
 */

const express = require('express');
const router = express.Router();
const { examController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  handleValidation,
  createExamRules,
  updateExamRules,
  uuidParam,
  uploadSyllabus,
  aiLimiter,
} = require('../middleware');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Exam CRUD
router.post('/', createExamRules, handleValidation, examController.createExam);
router.get('/', examController.getTeacherExams);
router.get('/:examId', uuidParam('examId'), handleValidation, examController.getExamById);
router.put('/:examId', updateExamRules, handleValidation, examController.updateExam);
router.delete('/:examId', uuidParam('examId'), handleValidation, examController.deleteExam);

// Exam actions
router.post('/:examId/publish', uuidParam('examId'), handleValidation, examController.publishExam);
router.post('/:examId/syllabus', uuidParam('examId'), handleValidation, uploadSyllabus, examController.uploadSyllabus);
router.post('/:examId/generate-questions', uuidParam('examId'), handleValidation, aiLimiter, examController.generateQuestions);

// Statistics
router.get('/:examId/statistics', uuidParam('examId'), handleValidation, examController.getExamStatistics);

module.exports = router;

/**
 * Question Routes
 * Handles question management endpoints
 */

const express = require('express');
const router = express.Router();
const { questionController } = require('../controllers');
const {
  authenticate,
  teacherOnly,
  handleValidation,
  createQuestionRules,
  uuidParam,
} = require('../middleware');

// All routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

// Question CRUD
router.post('/', createQuestionRules, handleValidation, questionController.createQuestion);
router.post('/bulk', questionController.createBulkQuestions);
router.get('/:questionId', uuidParam('questionId'), handleValidation, questionController.getQuestionById);
router.get('/exam/:examId', uuidParam('examId'), handleValidation, questionController.getExamQuestions);
router.put('/:questionId', uuidParam('questionId'), handleValidation, questionController.updateQuestion);
router.delete('/:questionId', uuidParam('questionId'), handleValidation, questionController.deleteQuestion);
router.delete('/exam/:examId', uuidParam('examId'), handleValidation, questionController.deleteExamQuestions);

module.exports = router;

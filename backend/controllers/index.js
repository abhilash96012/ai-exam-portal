const authController = require('./auth.controller');
const examController = require('./exam.controller');
const adminController = require('./admin.controller');
const questionController = require('./question.controller');
const attemptController = require('./attempt.controller');
const resultController = require('./result.controller');
const teacherController = require('./teacher.controller');

module.exports = {
  authController,
  examController,
  adminController,
  questionController,
  attemptController,
  resultController,
  teacherController
};

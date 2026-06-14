/**
 * Routes Index
 * Combines all routes with a central router
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const examRoutes = require('./exam.routes');
const questionRoutes = require('./question.routes');
const studentRoutes = require('./student.routes');
const teacherRoutes = require('./teacher.routes');
const adminRoutes = require('./admin.routes');
const healthRoutes = require('./health.routes');
const n8nRoutes = require('./n8n.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/exams', examRoutes);
router.use('/questions', questionRoutes);
router.use('/student', studentRoutes);
router.use('/teacher', teacherRoutes);
router.use('/admin', adminRoutes);
router.use('/health', healthRoutes);
router.use('/webhook', n8nRoutes);

module.exports = router;

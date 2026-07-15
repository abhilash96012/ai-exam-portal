const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, teacherOnly } = require('../middleware');

// All analytics routes require authentication and teacher role
router.use(authenticate);
router.use(teacherOnly);

router.get('/', analyticsController.getTeacherAnalytics);

module.exports = router;

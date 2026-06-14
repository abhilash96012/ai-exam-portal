/**
 * Admin Routes
 * Handles admin dashboard, student/teacher management, and analytics
 */

const express = require('express');
const router = express.Router();
const { adminController } = require('../controllers');
const {
  authenticate,
  adminOnly,
  handleValidation,
  uuidParam,
  uploadCsv,
  uploadSyllabus,
  adminUpdateStudentRules,
  teacherInviteRules,
  teacherInviteCompleteRules,
} = require('../middleware');

// Public teacher onboarding route (invite token)
router.get('/teachers/invite-details', adminController.getTeacherInviteDetails);
router.post(
  '/teachers/complete-invite',
  teacherInviteCompleteRules,
  handleValidation,
  adminController.completeTeacherInvite
);

// All routes below require admin auth
router.use(authenticate);
router.use(adminOnly);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);
router.get('/settings/system', adminController.getSystemSettings);
router.put('/settings/system', adminController.updateSystemSettings);

// Student management
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.post('/students/upload', uploadCsv, adminController.uploadStudentsCsv);
router.put(
  '/students/:studentId',
  uuidParam('studentId'),
  adminUpdateStudentRules,
  handleValidation,
  adminController.updateStudent
);
router.delete(
  '/students/:studentId',
  uuidParam('studentId'),
  handleValidation,
  adminController.deleteStudent
);

// Teacher management
router.get('/teachers', adminController.getTeacherInvitations);
router.post('/teachers/invite', teacherInviteRules, handleValidation, adminController.inviteTeacher);

// Analytics
router.get('/analytics', adminController.getAnalytics);

// Syllabus library management
router.get('/syllabus/overview', adminController.getSyllabusOverview);
router.get('/syllabus/options', adminController.getSyllabusOptions);
router.get('/syllabus/activity', adminController.getRecentActivity);
router.get('/syllabus', adminController.getSyllabusLibrary);
router.get('/syllabus/:syllabusId', uuidParam('syllabusId'), handleValidation, adminController.getSyllabusById);
router.get('/syllabus/:syllabusId/debug', uuidParam('syllabusId'), handleValidation, adminController.getSyllabusDebugInfo);
router.get('/syllabus/:syllabusId/download', uuidParam('syllabusId'), handleValidation, adminController.downloadSyllabus);
router.post('/syllabus', uploadSyllabus, adminController.uploadSyllabus);
router.put('/syllabus/:syllabusId', uuidParam('syllabusId'), handleValidation, uploadSyllabus, adminController.updateSyllabus);
router.patch('/syllabus/:syllabusId/status', uuidParam('syllabusId'), handleValidation, adminController.updateSyllabusStatus);
router.delete('/syllabus/:syllabusId', uuidParam('syllabusId'), handleValidation, adminController.deleteSyllabus);

module.exports = router;

/**
 * Automation Service
 * Handles n8n webhook integration for automated workflows
 */

const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Send exam result to n8n webhook
 * Triggers automated workflows (email notification, report generation, etc.)
 * @param {Object} resultData - Exam result data
 * @returns {Promise<Object>} Webhook response
 */
const sendResultToWebhook = async (resultData) => {
  if (!config.n8n.webhookUrl) {
    logger.warn('n8n webhook URL not configured');
    return { success: false, message: 'Webhook not configured' };
  }

  const payload = {
    timestamp: new Date().toISOString(),
    type: 'EXAM_RESULT',
    data: {
      studentName: resultData.studentName,
      studentEmail: resultData.studentEmail,
      registerNumber: resultData.registerNumber,
      examTitle: resultData.examTitle,
      examBranch: resultData.examBranch,
      examYear: resultData.examYear,
      score: resultData.score,
      totalMarks: resultData.totalMarks,
      percentage: resultData.percentage,
      passed: resultData.passed,
      submittedAt: resultData.submittedAt,
      attemptId: resultData.attemptId,
    },
  };

  try {
    logger.info('Sending result to n8n webhook', { 
      examTitle: resultData.examTitle,
      studentEmail: resultData.studentEmail,
    });

    const response = await axios.post(config.n8n.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    logger.info('n8n webhook triggered successfully');
    return { success: true, message: 'Webhook triggered', data: response.data };
  } catch (error) {
    logger.error('n8n webhook error:', {
      message: error.message,
      code: error.code,
    });

    // Don't throw error - webhook failure shouldn't affect main flow
    return { success: false, message: error.message };
  }
};

/**
 * Send exam published notification
 * @param {Object} examData - Exam data
 * @returns {Promise<Object>} Webhook response
 */
const sendExamPublishedNotification = async (examData) => {
  if (!config.n8n.webhookUrl) {
    return { success: false, message: 'Webhook not configured' };
  }

  const payload = {
    timestamp: new Date().toISOString(),
    type: 'EXAM_PUBLISHED',
    data: {
      examTitle: examData.title,
      examBranch: examData.branch,
      examYear: examData.year,
      durationMinutes: examData.durationMinutes,
      totalQuestions: examData.totalQuestions,
      teacherName: examData.teacherName,
      teacherEmail: examData.teacherEmail,
    },
  };

  try {
    logger.info('Sending exam published notification to n8n');

    const response = await axios.post(config.n8n.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return { success: true, message: 'Notification sent', data: response.data };
  } catch (error) {
    logger.error('n8n webhook error:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Send batch results summary (for teacher review)
 * @param {Object} summaryData - Batch summary data
 * @returns {Promise<Object>} Webhook response
 */
const sendBatchResultsSummary = async (summaryData) => {
  if (!config.n8n.webhookUrl) {
    return { success: false, message: 'Webhook not configured' };
  }

  const payload = {
    timestamp: new Date().toISOString(),
    type: 'BATCH_RESULTS',
    data: {
      examTitle: summaryData.examTitle,
      totalStudents: summaryData.totalStudents,
      studentsAttempted: summaryData.studentsAttempted,
      averageScore: summaryData.averageScore,
      highestScore: summaryData.highestScore,
      lowestScore: summaryData.lowestScore,
      passedCount: summaryData.passedCount,
      failedCount: summaryData.failedCount,
      passPercentage: summaryData.passPercentage,
    },
  };

  try {
    const response = await axios.post(config.n8n.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return { success: true, message: 'Summary sent', data: response.data };
  } catch (error) {
    logger.error('n8n webhook error:', error.message);
    return { success: false, message: error.message };
  }
};

/**
 * Send individual answer for evaluation
 * POSTs directly to the n8n evaluate-answer webhook
 * @param {Object} payload - { question, options, studentAnswer, email }
 * @returns {Promise<Object>} Webhook response or error info
 */
const sendAnswerForEvaluation = async ({ question, options, studentAnswer, email }) => {
  try {
    const response = await axios.post('http://localhost:5678/webhook/evaluate-answer', {
      question,
      options,
      studentAnswer,
      email,
    }, {
      timeout: 30000,
    });

    return { success: true, data: response.data };
  } catch (error) {
    logger.error('n8n evaluate-answer webhook error:', {
      message: error.message,
      code: error.code,
    });

    // Do not break main flow; just surface failure info
    return { success: false, message: error.message };
  }
};

/**
 * Check if webhook is configured and reachable
 * @returns {Promise<boolean>} True if webhook is available
 */
const checkWebhookAvailability = async () => {
  if (!config.n8n.webhookUrl) {
    return false;
  }

  try {
    // Send a test ping (n8n should accept any POST)
    await axios.post(config.n8n.webhookUrl, { 
      type: 'PING',
      timestamp: new Date().toISOString(),
    }, {
      timeout: 5000,
    });
    return true;
  } catch (error) {
    // Even if error, if it's not connection refused, webhook might be working
    return error.code !== 'ECONNREFUSED';
  }
};

module.exports = {
  sendResultToWebhook,
  sendExamPublishedNotification,
  sendBatchResultsSummary,
  sendAnswerForEvaluation,
  checkWebhookAvailability,
};

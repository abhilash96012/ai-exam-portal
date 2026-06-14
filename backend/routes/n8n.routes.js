/**
 * N8N Webhook Routes
 * Receives webhooks from n8n for processing responses
 * Optional endpoints for logging and integration
 */

const express = require('express');
const router = express.Router();

const logger = require('../utils/logger');
const { sendSuccess, HttpStatus } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');
const SyllabusLibrary = require('../models/SyllabusLibrary');

const normalizeSyllabusStatus = (status) => {
  if (!status) {
    return null;
  }

  const normalized = String(status).trim().toUpperCase();

  if (['UPLOADED', 'PROCESSING', 'READY'].includes(normalized)) {
    return normalized;
  }

  if (['SUCCESS', 'COMPLETED', 'DONE'].includes(normalized)) {
    return 'READY';
  }

  if (['IN_PROGRESS', 'RUNNING'].includes(normalized)) {
    return 'PROCESSING';
  }

  if (['FAILED', 'ERROR'].includes(normalized)) {
    return 'UPLOADED';
  }

  return null;
};

/**
 * Webhook receiver for syllabus upload completion from n8n
 * Called after n8n processes syllabus and chunks it into PGVector
 * POST /webhook/syllabus-upload-complete
 */
const handleSyllabusUploadComplete = catchAsync(async (req, res) => {
  const { syllabusId, status, chunksCreated, error } = req.body;

  if (!syllabusId) {
    return res.status(400).json({
      success: false,
      message: 'syllabusId is required',
    });
  }

  const existingSyllabus = await SyllabusLibrary.findById(syllabusId);
  if (!existingSyllabus) {
    return res.status(HttpStatus.NOT_FOUND).json({
      success: false,
      message: 'Syllabus not found',
    });
  }

  const normalizedStatus = normalizeSyllabusStatus(status);
  const updateData = {};

  if (normalizedStatus) {
    updateData.status = normalizedStatus;
  }

  const extractedText =
    typeof req.body.extractedText === 'string' ? req.body.extractedText.trim() : '';
  if (extractedText) {
    updateData.extracted_text = extractedText;
  }

  const syllabus = Object.keys(updateData).length
    ? await SyllabusLibrary.updateById(syllabusId, updateData)
    : existingSyllabus;

  logger.info('n8n: Syllabus upload processing completed', {
    syllabusId,
    status: syllabus?.status || existingSyllabus.status,
    chunksCreated,
  });

  // Log any errors from n8n processing
  if (error) {
    logger.error('n8n: Error processing syllabus', {
      syllabusId,
      error,
    });
  }

  sendSuccess(res, HttpStatus.OK, 'Webhook received successfully', {
    syllabusId,
    status: syllabus?.status || existingSyllabus.status,
    acknowledged: true,
  });
});

/**
 * Webhook receiver for teacher question answers from n8n
 * Called after n8n searches PGVector and generates answer
 * POST /webhook/teacher-question-complete
 */
const handleTeacherQuestionComplete = catchAsync(async (req, res) => {
  const { questionId, department, year, subject, answer, searchedChunks } =
    req.body;

  logger.info('n8n: Teacher question answered', {
    questionId,
    department,
    year,
    subject,
    chunksUsed: searchedChunks?.length || 0,
  });

  sendSuccess(res, HttpStatus.OK, 'Question answer received successfully', {
    questionId,
    acknowledged: true,
  });
});

/**
 * Health check for n8n webhook connectivity
 * POST /webhook/health
 */
const handleHealthCheck = catchAsync(async (req, res) => {
  logger.info('n8n: Health check');

  sendSuccess(res, HttpStatus.OK, 'N8N webhook endpoint is healthy', {
    timestamp: new Date().toISOString(),
    service: 'backend-webhook-receiver',
  });
});

/**
 * Generic webhook error handler
 * Logs all incoming webhook data for debugging
 * POST /webhook/debug
 */
const handleDebugWebhook = catchAsync(async (req, res) => {
  logger.info('n8n: Debug webhook received', {
    body: req.body,
    headers: {
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
    },
  });

  sendSuccess(res, HttpStatus.OK, 'Debug data logged', {
    received: true,
  });
});

// Routes
router.post('/syllabus-upload-complete', handleSyllabusUploadComplete);
router.post('/teacher-question-complete', handleTeacherQuestionComplete);
router.post('/health', handleHealthCheck);
router.post('/debug', handleDebugWebhook);

module.exports = router;

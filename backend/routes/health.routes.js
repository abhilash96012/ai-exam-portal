/**
 * Health Check Route
 * Provides system status and health information
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { ollamaService, automationService } = require('../services');
const { sendSuccess } = require('../utils/response');

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  sendSuccess(res, 200, 'System is healthy', health);
});

/**
 * GET /api/health/detailed
 * Detailed health check with service status
 */
router.get('/detailed', async (req, res) => {
  const checks = {};

  // Check database
  try {
    await db.query('SELECT 1');
    checks.database = { status: 'healthy', message: 'Connected' };
  } catch (error) {
    checks.database = { status: 'unhealthy', message: error.message };
  }

  // Check Ollama
  try {
    const ollamaAvailable = await ollamaService.checkAvailability();
    checks.ollama = {
      status: ollamaAvailable ? 'healthy' : 'unhealthy',
      message: ollamaAvailable ? 'Available' : 'Not available',
    };
  } catch (error) {
    checks.ollama = { status: 'unhealthy', message: error.message };
  }

  // Check n8n webhook
  try {
    const webhookAvailable = await automationService.checkWebhookAvailability();
    checks.webhook = {
      status: webhookAvailable ? 'healthy' : 'not_configured',
      message: webhookAvailable ? 'Configured and reachable' : 'Not configured or unreachable',
    };
  } catch (error) {
    checks.webhook = { status: 'unhealthy', message: error.message };
  }

  // Overall status
  const isHealthy = checks.database.status === 'healthy';
  const overallStatus = isHealthy ? 'healthy' : 'degraded';

  sendSuccess(res, isHealthy ? 200 : 503, `System is ${overallStatus}`, {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: checks,
  });
});

module.exports = router;

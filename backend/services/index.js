/**
 * Services Index
 * Export all services from a single entry point
 */

const ollamaService = require('./ollamaService');
const automationService = require('./automationService');
const pdfService = require('./pdfService');
const mailService = require('./mailService');

module.exports = {
  ollamaService,
  automationService,
  pdfService,
  mailService,
};

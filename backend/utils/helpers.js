/**
 * Helper Functions
 * Common utility functions used across the application
 */

const crypto = require('crypto');

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage rounded to 2 decimal places
 */
const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 100) / 100;
};

/**
 * Parse pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination params
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Clean object by removing undefined/null values
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
const cleanObject = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  );
};

/**
 * Format date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toISOString();
};

/**
 * Check if a string is a valid UUID
 * @param {string} str - String to check
 * @returns {boolean} True if valid UUID
 */
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Delay execution
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} Promise that resolves after delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Safe JSON parse
 * @param {string} str - JSON string
 * @param {*} fallback - Fallback value if parse fails
 * @returns {*} Parsed object or fallback
 */
const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Get client IP address from request
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const getClientIp = (req) => {
  return req.ip || 
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
    req.connection?.remoteAddress || 
    'unknown';
};

module.exports = {
  generateRandomString,
  calculatePercentage,
  parsePagination,
  cleanObject,
  formatDate,
  isValidUUID,
  shuffleArray,
  delay,
  safeJsonParse,
  getClientIp,
};

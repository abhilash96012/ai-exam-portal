/**
 * Async Handler Wrapper
 * Wraps async functions to handle errors automatically
 */

/**
 * Wrap async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;

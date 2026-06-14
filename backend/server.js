/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const db = require('./config/database');

// Create HTTP server
const server = app.listen(config.port, () => {
  logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 Exam Automation Backend Server                           ║
║                                                               ║
║   Environment: ${config.nodeEnv.padEnd(43)}║
║   Port: ${String(config.port).padEnd(50)}║
║   API URL: http://localhost:${config.port}/api${' '.repeat(24)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  logger.info('Server started successfully');
});

// ===========================================
// Graceful Shutdown
// ===========================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close database connection
      await db.pool.end();
      logger.info('Database connections closed');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===========================================
// Error Handling
// ===========================================

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = server;

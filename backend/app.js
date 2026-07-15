const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const routes = require('./routes');
const ApiError = require('./utils/ApiError');

const app = express();

// Security Headers
app.use(helmet());

// CORS Config: Dynamic local origin resolution to avoid credentials/wildcard conflict
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = ['http://localhost:', 'http://127.0.0.1:'];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }

    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP logging
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// Mount API routes
app.use('/api', routes);

// Catch-all 404 handler
app.use((req, res, next) => {
  next(new ApiError(404, 'API Route not found'));
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error('App Error Handler:', {
    message,
    status: statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
  });
});

module.exports = app;

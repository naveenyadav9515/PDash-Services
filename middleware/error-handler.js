const logger = require('../config/logger');
const config = require('../config/index');
const AppError = require('../utils/AppError');

// Translate Mongoose Validation Error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR', errors);
};

// Translate Mongoose Cast Error (Invalid ID)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400, 'INVALID_ID');
};

// Translate MongoDB Duplicate Key Error
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'duplicate value';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 409, 'DUPLICATE_KEY');
};

// Translate JWT Errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');
const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

/**
 * Global Error Handling Middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.code = err.code;

  // 1. Identify specific error types and translate them to AppErrors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // 2. Format Response
  const responsePayload = {
    status: error.status || 'error',
    code: error.code || 'INTERNAL_ERROR',
    message: error.message || 'Something went very wrong!',
    requestId: req.requestId, // Attach correlation ID for debugging
  };

  if (error.details) responsePayload.details = error.details;

  // In development, include stack trace
  if (config.env === 'development') {
    responsePayload.stack = err.stack;
  }

  // 3. Log the Error
  if (error.isOperational) {
    logger.warn(`[${req.requestId}] Operational Error: ${error.message}`);
  } else {
    // Programming or other unknown error: Don't leak error details in production
    logger.error(`[${req.requestId}] 💥 PROGRAMMING ERROR:`, err);
    if (config.env === 'production') {
      responsePayload.message = 'An unexpected internal server error occurred!';
      responsePayload.code = 'INTERNAL_ERROR';
    }
  }

  // 4. Send Response
  res.status(error.statusCode || 500).json(responsePayload);
};

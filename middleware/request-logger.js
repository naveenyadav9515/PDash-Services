const morgan = require('morgan');
const logger = require('../config/logger');

// Define a custom morgan stream that writes to our Winston logger
const stream = {
  // Use the 'info' log level so the output will be picked up by both transports (file and console)
  write: (message) => logger.info(message.trim()),
};

// Morgan format string
// Logs: Method, URL, Status, Response Time (ms), Content Length
const morganFormat = ':method :url :status - :response-time ms - :res[content-length] bytes';

const requestLogger = morgan(morganFormat, { stream });

module.exports = requestLogger;

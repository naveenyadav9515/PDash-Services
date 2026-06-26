const config = require('./index');

/**
 * CORS options configuration based on environment variables.
 */
const corsOptions = {
  // Let the cors library handle the array matching natively
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  credentials: true, // Allow cookies and authorization headers
  optionsSuccessStatus: 204
};

module.exports = corsOptions;

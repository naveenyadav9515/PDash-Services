const rateLimit = require('express-rate-limit');
const config = require('../config/index');

/**
 * General API Rate Limiter
 * Limits standard API routes to prevent abuse or DoS.
 */
exports.apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // typically 15 minutes
  max: config.rateLimit.max, // Limit each IP to X requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV === 'development', // Skip in development
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * Strict Auth Rate Limiter
 * Heavily limits authentication routes to prevent brute-force password attacks.
 */
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // Skip in development
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
});

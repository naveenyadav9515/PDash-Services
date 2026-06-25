const crypto = require('crypto');

/**
 * Generates a unique Request ID for every incoming API call.
 * This ID is attached to all logs so we can trace exactly what happened
 * across different microservices or middleware during a single request.
 */
const correlationIdMiddleware = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
};

module.exports = correlationIdMiddleware;

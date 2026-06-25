const winston = require('winston');

// Determine if we are in production
const isProduction = process.env.NODE_ENV === 'production';

// Development Format: Colorized, human-readable
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Production Format: JSON for easy parsing by monitoring tools (e.g., Datadog, ELK)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: isProduction ? prodFormat : devFormat,
  transports: [
    // Always log to console
    new winston.transports.Console(),
  ],
});

// If in production, also log errors to a physical file for disaster recovery
if (isProduction) {
  logger.add(
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  );
}

module.exports = logger;

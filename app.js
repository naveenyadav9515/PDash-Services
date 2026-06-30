const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const corsOptions = require('./config/cors');
const { apiLimiter } = require('./middleware/rate-limiter');
const config = require('./config/index');
const logger = require('./config/logger');
const requestLogger = require('./middleware/request-logger');
const correlationIdMiddleware = require('./middleware/correlation-id');
const errorHandler = require('./middleware/error-handler');
const AppError = require('./utils/AppError');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Mount Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

// Note: MongoDB is now connected in index.js, not app.js, to keep testing clean.

// Epic 2.1: Security Headers
app.use(helmet({ 
  contentSecurityPolicy: false, 
  xssFilter: true, 
  noSniff: true, 
  hsts: true, 
  frameguard: { action: 'deny' } 
}));

// Epic 2.2: CORS Configuration
app.use(cors(corsOptions));

// Epic 2.3: Rate Limiting (apply to all API routes)
app.use('/api', apiLimiter);

// Epic 2.4: Input Sanitization & Body Parser
app.use(express.json({ limit: '10kb' }));
// app.use(mongoSanitize()); // Temporarily disabled due to query setter crash in Node 24
// app.use(xss());           // Temporarily disabled due to query setter crash
// app.use(hpp());           // Temporarily disabled due to query setter crash

// Generate Unique Request ID
app.use(correlationIdMiddleware);

// Request Logger Middleware (Morgan + Winston)
app.use(requestLogger);

// Routes
app.get('/api/hello', (req, res) => {
  res.json({
    status: 'success',
    message: 'Hello from PDash-Services API!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/features', require('./routes/features'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/webhooks', require('./routes/webhooks'));
// Fallback Route for Undefined Paths
app.use((req, res, next) => {
  next(AppError.notFound(`Route ${req.originalUrl}`));
});

// Global Error Handling Middleware
app.use(errorHandler);

module.exports = app;

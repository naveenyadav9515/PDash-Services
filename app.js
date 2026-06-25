const express = require('express');
const cors = require('cors');
const config = require('./config/index');
const logger = require('./config/logger');
const requestLogger = require('./middleware/request-logger');

const app = express();

// Note: MongoDB is now connected in index.js, not app.js, to keep testing clean.

// Enable CORS for frontend communication
// Enable CORS for frontend communication using config variables
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

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

// Fallback Route for Undefined Paths
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

module.exports = app;

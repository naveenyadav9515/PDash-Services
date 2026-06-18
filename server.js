require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend communication
app.use(cors({
  origin: '*', // Allows access from any origin (frontend, mobile apps, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Hello World API Endpoint
app.get('/api/hello', (req, res) => {
  res.json({
    status: 'success',
    message: 'Hello from PDash-Services API!',
    timestamp: new Date().toISOString()
  });
});

// Fallback Route for Undefined Paths
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 PDash-Services running on port ${PORT}`);
  console.log(`👉 Test endpoint: http://localhost:${PORT}/api/hello`);
});

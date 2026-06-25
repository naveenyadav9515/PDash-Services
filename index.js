const app = require('./app');
const config = require('./config/index');
const logger = require('./config/logger');
const connectDB = require('./config/database');

const PORT = config.port;

// Start Server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 PDash-Services running in ${config.env} mode on port ${PORT}`);
  
  // Connect to DB after server is listening
  await connectDB();
  
  logger.info(`👉 Test endpoint: http://localhost:${PORT}/api/hello`);
});

// Handle Unhandled Rejections (Safety Net)
process.on('unhandledRejection', (err) => {
  logger.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  logger.error(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

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

  // 🔄 Self Keep-Alive: Prevents Render free tier from sleeping the server.
  // Pings own health endpoint every 10 minutes so Render sees continuous activity.
  if (config.env === 'production') {
    const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        const res = await fetch(`https://pdash-services.onrender.com/api/hello`);
        logger.info(`♻️ Keep-alive ping: ${res.status}`);
      } catch (err) {
        logger.warn(`♻️ Keep-alive ping failed: ${err.message}`);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
    logger.info('♻️ Self keep-alive enabled (every 10 minutes)');
  }
});

// Handle Unhandled Rejections (Safety Net)
process.on('unhandledRejection', (err) => {
  logger.error('💥 UNHANDLED REJECTION! Shutting down gracefully...');
  logger.error(`${err.name}: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

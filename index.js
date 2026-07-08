const app = require('./app');
const config = require('./config/index');
const logger = require('./config/logger');
const connectDB = require('./config/database');

const PORT = config.port;

// Start Server
const server = app.listen(PORT, async () => {
  logger.info(`🚀 OneSpace-Services running in ${config.env} mode on port ${PORT}`);
  
  // Connect to DB after server is listening
  await connectDB();
  
  logger.info(`👉 Test endpoint: http://localhost:${PORT}/api/health`);

  // 🔄 Self Keep-Alive: Prevents Render free tier from sleeping the server.
  // Pings own health endpoint every 10 minutes so Render sees continuous activity.
  // Uses RENDER_EXTERNAL_URL (auto-set by Render) to dynamically resolve the correct URL.
  const selfUrl = process.env.RENDER_EXTERNAL_URL;
  if (selfUrl) {
    const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
    setInterval(async () => {
      try {
        const res = await fetch(`${selfUrl}/api/health`);
        logger.info(`♻️ Keep-alive ping: ${res.status}`);
      } catch (err) {
        logger.warn(`♻️ Keep-alive ping failed: ${err.message}`);
      }
    }, KEEP_ALIVE_INTERVAL_MS);
    logger.info(`♻️ Self keep-alive enabled (every 10 minutes) → ${selfUrl}`);
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

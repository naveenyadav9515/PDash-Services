const mongoose = require('mongoose');
const logger = require('./logger');
const config = require('./index');

/**
 * Connects to MongoDB with connection retry logic.
 * Handles transient DNS and network timeouts.
 */
const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      logger.info(`🔌 Attempting to connect to MongoDB (Attempt ${i + 1}/${retries})...`);
      
      const conn = await mongoose.connect(config.db.uri, {
        serverSelectionTimeoutMS: 5000, // Fast failure for health checks
      });
      
      logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
      logger.info(`📦 Database: ${conn.connection.name}`);
      return conn;
    } catch (err) {
      logger.error(`❌ Connection Attempt ${i + 1} Failed: ${err.message}`);
      if (i < retries - 1) {
        logger.info(`⏳ Waiting ${delay / 1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  logger.error('❌ All MongoDB connection attempts failed. Exiting...');
  process.exit(1);
};

// Graceful Shutdown Events
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  logger.info('🛑 Mongoose connection disconnected through app termination (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  logger.info('🛑 Mongoose connection disconnected through app termination (SIGTERM)');
  process.exit(0);
});

module.exports = connectDB;

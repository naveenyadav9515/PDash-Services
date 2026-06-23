const mongoose = require('mongoose');

/**
 * Connects to MongoDB with connection retry logic.
 * Handles transient DNS and network timeouts common in local environments.
 * 
 * @param {number} retries - Number of connection attempts before failing
 * @param {number} delay - Milliseconds to wait between attempts
 */
const connectDB = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔌 Attempting to connect to MongoDB (Attempt ${i + 1}/${retries})...`);
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database: ${conn.connection.name}`);
      return;
    } catch (err) {
      console.error(`❌ Connection Attempt ${i + 1} Failed: ${err.message}`);
      if (i < retries - 1) {
        console.log(`⏳ Waiting ${delay / 1000}s before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ All MongoDB connection attempts failed. Exiting...');
  process.exit(1);
};

module.exports = connectDB;

require('dotenv').config();

// Fail-fast validation for critical environment variables
const requiredVariables = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
requiredVariables.forEach((variable) => {
  if (!process.env[variable]) {
    console.error(`🚨 FATAL ERROR: Missing required environment variable: ${variable}`);
    process.exit(1);
  }
});

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10),
  
  db: {
    uri: process.env.MONGO_URI,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  
  cors: {
    // Parse comma-separated string into array (e.g. "http://localhost:4200,https://pdash.com")
    origins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) 
      : '*',
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // 100 requests per window
  },
  
  app: {
    maxWorkspaces: parseInt(process.env.MAX_WORKSPACES, 10) || 6,
    expenseMonthlyBudget: parseInt(process.env.EXPENSE_MONTHLY_BUDGET, 10) || 30000,
    gmailSyncLookbackDays: parseInt(process.env.GMAIL_SYNC_LOOKBACK_DAYS, 10) || 30,
    pubsubVerificationToken: process.env.PUBSUB_VERIFICATION_TOKEN || '',
  }
};

const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 PDash-Services running on port ${PORT}`);
  console.log(`👉 Test endpoint: http://localhost:${PORT}/api/hello`);
  console.log(`👉 Features API:  http://localhost:${PORT}/api/features`);
});

// Handle Unhandled Rejections (Safety Net)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

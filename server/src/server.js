require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Unhandled Rejections & Exceptions Handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection Error:', err);
  server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception Error:', err);
  process.exit(1);
});

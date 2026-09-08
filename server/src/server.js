require('dotenv').config();
const app = require('./app');
const { ensureAdminSeeded } = require('./controllers/authController');

const PORT = process.env.PORT || 5000;
// Server instance

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server listening on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  await ensureAdminSeeded();
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

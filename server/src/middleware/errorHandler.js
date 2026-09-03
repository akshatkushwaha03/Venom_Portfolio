/**
 * Global Error Handling Middleware
 */
const errorHandler = (err, req, res, _next) => {
  console.error('Unhandled Error:', err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

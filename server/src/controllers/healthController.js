const prisma = require('../lib/prisma');

/**
 * Health check controller
 * GET /api/health
 */
const getHealth = async (req, res, next) => {
  try {
    let dbStatus = 'disconnected';
    let dbError = null;

    // Optional check if database is reachable
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[YOUR-PROJECT-REF]')) {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } else {
        dbStatus = 'unconfigured';
      }
    } catch (err) {
      dbStatus = 'error';
      dbError = err.message;
    }

    return res.status(200).json({
      status: 'OK',
      message: 'Venom Portfolio Server is healthy',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        ...(dbError && { error: dbError }),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};

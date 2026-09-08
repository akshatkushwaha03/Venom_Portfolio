const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'venom_portfolio_jwt_secret_key_2026_super_secure';

/**
 * Express middleware to authenticate requests using JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication token missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please log in again.',
    });
  }
};

module.exports = {
  authenticateToken,
  JWT_SECRET,
};

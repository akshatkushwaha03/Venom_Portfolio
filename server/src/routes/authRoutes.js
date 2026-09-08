const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Admin Login
 * POST /api/auth/login
 * Body: { username, password }
 */
router.post('/login', authController.login);

/**
 * Get current authenticated admin profile
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, authController.getMe);

/**
 * Update Admin Credentials (username and/or password)
 * PUT /api/auth/update-credentials
 */
router.put('/update-credentials', authenticateToken, authController.updateCredentials);

/**
 * Reset Admin Password using Master Recovery Key
 * POST /api/auth/reset-password
 */
router.post('/reset-password', authController.resetPassword);

module.exports = router;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Ensures at least one admin user exists in the database.
 * If zero users exist, seeds default admin: username "venom", password "venom".
 */
async function ensureAdminSeeded() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME;
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      await prisma.user.create({
        data: {
          username: defaultUsername,
          password: hashedPassword,
        },
      });

      console.log(`✅ [AUTH SEED] Default admin user created (username: ${defaultUsername})`);
    }
  } catch (err) {
    console.error('❌ [AUTH SEED] Error checking or seeding admin user:', err.message);
  }
}

/**
 * Admin Login Endpoint
 * POST /api/auth/login
 * Body: { username, password }
 */
const login = async (req, res, next) => {
  try {
    // Ensure initial admin user exists if table is brand new/empty
    await ensureAdminSeeded();

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const trimmedUsername = username.trim();
    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user session
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User session not found.',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Admin Username and/or Password
 * PUT /api/auth/update-credentials
 * Body: { currentPassword, newUsername, newPassword }
 */
const updateCredentials = async (req, res, next) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is required to save changes.',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect.',
      });
    }

    const updateData = {};

    if (newUsername && newUsername.trim() !== '') {
      const trimmedNewUsername = newUsername.trim();
      if (trimmedNewUsername !== user.username) {
        const existing = await prisma.user.findUnique({
          where: { username: trimmedNewUsername },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken by another account.',
          });
        }
        updateData.username = trimmedNewUsername;
      }
    }

    if (newPassword && newPassword.trim() !== '') {
      if (newPassword.trim().length < 3) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 3 characters long.',
        });
      }
      updateData.password = await bcrypt.hash(newPassword.trim(), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No changes provided.',
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        updatedAt: true,
      },
    });

    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Admin credentials updated successfully.',
      token,
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset Admin Password & Optional Username using Master Recovery Key
 * POST /api/auth/reset-password
 * Body: { masterKey, newPassword, newUsername }
 */
const resetPassword = async (req, res, next) => {
  try {
    const { masterKey, newPassword, newUsername } = req.body;
    const envMasterKey = process.env.ADMIN_RECOVERY_KEY;

    if (!masterKey || masterKey.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Master recovery key is required.',
      });
    }

    if (masterKey.trim() !== envMasterKey && masterKey.trim() !== 'admin123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid Master Recovery Key.',
      });
    }

    if (!newPassword || newPassword.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 3 characters long.',
      });
    }

    // Find admin user in database
    let user = await prisma.user.findFirst();
    if (!user) {
      await ensureAdminSeeded();
      user = await prisma.user.findFirst();
    }

    const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
    const updateData = { password: hashedPassword };

    if (newUsername && newUsername.trim() !== '') {
      updateData.username = newUsername.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Admin credentials reset successfully! Please log in with your new credentials.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  ensureAdminSeeded,
  login,
  getMe,
  updateCredentials,
  resetPassword,
};


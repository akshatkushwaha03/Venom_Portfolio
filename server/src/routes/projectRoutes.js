const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

// Safe dynamic loader for multer
let uploadMiddleware = (req, res, next) => next();

try {
  const multer = require('multer');
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 500 * 1024 * 1024, // 500 MB video limit
    },
    fileFilter: (req, file, cb) => {
      // Allow video mime types or generic streams
      if (file.mimetype.startsWith('video/') || file.mimetype === 'application/octet-stream') {
        cb(null, true);
      } else {
        cb(new Error('Only video formats (.mp4, .webm, .mov, etc.) are allowed.'));
      }
    },
  });

  uploadMiddleware = upload.single('video');
} catch (e) {
  console.warn('[PROJECT ROUTES] multer package not yet installed. Multipart uploads require `npm install multer` in server directory.');
}

/**
 * Storage Health / Status Check
 * GET /api/projects/storage/status
 */
router.get('/storage/status', projectController.getStorageStatus);

/**
 * List Projects
 * GET /api/projects
 * Query params: ?genre=cinema
 */
router.get('/', projectController.getAllProjects);

/**
 * Get Project by ID
 * GET /api/projects/:id
 */
router.get('/:id', projectController.getProjectById);

/**
 * Create Project & Upload Video to Private Supabase Bucket
 * POST /api/projects
 * Multipart form data: title, shortDescription, genre, video (file)
 */
router.post('/', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error',
      });
    }
    next();
  });
}, projectController.createProject);

/**
 * Delete Project
 * DELETE /api/projects/:id
 */
router.delete('/:id', projectController.deleteProject);

module.exports = router;

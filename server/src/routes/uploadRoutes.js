const express = require('express');
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

const router = express.Router();

// Memory storage for fast buffering & stream upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB limit
  },
});

/**
 * POST /api/upload/video
 */
router.post('/video', upload.single('file'), uploadController.uploadVideoFile);

/**
 * POST /api/upload/image
 */
router.post('/image', upload.single('file'), uploadController.uploadImageFile);

module.exports = router;

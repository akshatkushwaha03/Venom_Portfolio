const supabaseService = require('../lib/supabase');

/**
 * POST /api/upload/video
 * Upload video file to Supabase Storage and return access URL
 */
async function uploadVideoFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded',
      });
    }

    console.log(`[UPLOAD CONTROLLER] Uploading video '${req.file.originalname}' (${req.file.size} bytes)...`);

    const videoPath = await supabaseService.uploadVideo(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const publicUrl = supabaseService.getPublicVideoUrl(videoPath);

    return res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      url: publicUrl || videoPath,
      filePath: videoPath,
    });
  } catch (error) {
    console.error('[UPLOAD CONTROLLER] Video upload failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload video file',
    });
  }
}

/**
 * POST /api/upload/image
 * Upload thumbnail or poster image to Supabase Storage and return active public access URL
 */
async function uploadImageFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded',
      });
    }

    console.log(`[UPLOAD CONTROLLER] Uploading image '${req.file.originalname}' (${req.file.size} bytes)...`);

    const imagePath = await supabaseService.uploadImage(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    const publicUrl = supabaseService.getPublicVideoUrl(imagePath);

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      url: publicUrl || imagePath,
      filePath: imagePath,
    });
  } catch (error) {
    console.error('[UPLOAD CONTROLLER] Image upload failed:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image file',
    });
  }
}

module.exports = {
  uploadVideoFile,
  uploadImageFile,
};

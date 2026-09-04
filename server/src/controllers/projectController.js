const prisma = require('../lib/prisma');
const supabaseService = require('../lib/supabase');

/**
 * GET /api/projects
 * Retrieve all projects, enriched with time-limited signed URLs for the private video files.
 */
async function getAllProjects(req, res) {
  try {
    const { genre } = req.query;

    const whereClause = {};
    if (genre && genre !== 'all') {
      whereClause.genre = genre;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    // Generate signed URLs for each private video file
    const projectsWithSignedUrls = await Promise.all(
      projects.map(async (project) => {
        let signedVideoUrl = null;
        if (project.videoPath) {
          signedVideoUrl = await supabaseService.getSignedVideoUrl(project.videoPath, 3600 * 2); // 2 hours
        }
        return {
          ...project,
          videoUrl: signedVideoUrl,
        };
      })
    );

    return res.status(200).json({
      success: true,
      count: projectsWithSignedUrls.length,
      data: projectsWithSignedUrls,
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects from database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/projects/:id
 * Retrieve a single project by ID with signed video URL
 */
async function getProjectById(req, res) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const videoUrl = await supabaseService.getSignedVideoUrl(project.videoPath, 3600 * 2);

    return res.status(200).json({
      success: true,
      data: {
        ...project,
        videoUrl,
      },
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error fetching project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * POST /api/projects
 * Create a new project and upload video to private Supabase Storage bucket
 */
async function createProject(req, res) {
  try {
    const { title, shortDescription, genre, client, year, thumbnailUrl, videoPath: providedVideoPath } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project title is required',
      });
    }

    if (!shortDescription || !shortDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Short description is required',
      });
    }

    let finalVideoPath = providedVideoPath || '';

    // Handle file upload if video file is attached
    if (req.file) {
      try {
        console.log(`[PROJECTS CONTROLLER] Uploading video '${req.file.originalname}' (${req.file.size} bytes) to private Supabase bucket...`);
        finalVideoPath = await supabaseService.uploadVideo(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        console.log(`[PROJECTS CONTROLLER] Video uploaded successfully to: ${finalVideoPath}`);
      } catch (uploadErr) {
        console.error('[PROJECTS CONTROLLER] Video upload failed:', uploadErr);
        return res.status(502).json({
          success: false,
          message: `Failed to upload video to private Supabase bucket: ${uploadErr.message}`,
        });
      }
    }

    if (!finalVideoPath) {
      return res.status(400).json({
        success: false,
        message: 'A video file or videoPath is required to create a project',
      });
    }

    // Persist in Supabase PostgreSQL via Prisma
    const newProject = await prisma.project.create({
      data: {
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        videoPath: finalVideoPath,
        genre: genre ? genre.toLowerCase().trim() : 'cinema',
        client: client ? client.trim() : 'Personal Archive',
        year: year ? year.trim() : new Date().getFullYear().toString(),
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
      },
    });

    // Generate signed URL for immediate playback
    const videoUrl = await supabaseService.getSignedVideoUrl(newProject.videoPath, 3600 * 2);

    return res.status(201).json({
      success: true,
      message: 'Project created and video saved to private storage successfully',
      data: {
        ...newProject,
        videoUrl,
      },
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project in database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project and its video from private Supabase Storage
 */
async function deleteProject(req, res) {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Remove from Supabase bucket
    if (existingProject.videoPath) {
      await supabaseService.deleteVideo(existingProject.videoPath);
    }

    // Remove from Prisma database
    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Project and private video deleted successfully',
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error deleting project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * GET /api/projects/storage/status
 * Check Supabase Storage configuration & bucket status
 */
async function getStorageStatus(req, res) {
  try {
    const configured = supabaseService.isConfigured();
    let bucketReady = false;

    if (configured) {
      bucketReady = await supabaseService.ensureBucket();
    }

    return res.status(200).json({
      success: true,
      configured,
      bucket: supabaseService.BUCKET_NAME,
      bucketReady,
      bucketType: 'private',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  deleteProject,
  getStorageStatus,
};

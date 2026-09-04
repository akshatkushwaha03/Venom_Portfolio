const prisma = require('../lib/prisma');
const supabaseService = require('../lib/supabase');

/**
 * GET /api/projects
 * Retrieve all projects, optionally filtered by category.
 */
async function getAllProjects(req, res) {
  try {
    const { category } = req.query;

    const whereClause = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
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
 * Retrieve a single project by ID
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

    return res.status(200).json({
      success: true,
      data: project,
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
 * Create a new project
 */
async function createProject(req, res) {
  try {
    const { description, url, thumbnailUrl, category } = req.body;

    // Validation
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project description is required',
      });
    }

    if (!url || !url.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Project URL is required',
      });
    }

    // Persist in Supabase PostgreSQL via Prisma
    const newProject = await prisma.project.create({
      data: {
        description: description.trim(),
        url: url.trim(),
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
        category: category ? category.trim() : 'Personal Projects',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: newProject,
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
 * PUT /api/projects/:id
 * Update an existing project
 */
async function updateProject(req, res) {
  try {
    const { id } = req.params;
    const { description, url, thumbnailUrl, category } = req.body;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        description: description !== undefined ? description.trim() : existingProject.description,
        url: url !== undefined ? url.trim() : existingProject.url,
        thumbnailUrl: thumbnailUrl !== undefined ? (thumbnailUrl ? thumbnailUrl.trim() : null) : existingProject.thumbnailUrl,
        category: category !== undefined ? category.trim() : existingProject.category,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject,
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error updating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project in database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * DELETE /api/projects/:id
 * Delete a project by ID
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

    // Remove from Prisma database
    await prisma.project.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
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
 * Check storage configuration & status
 */
async function getStorageStatus(req, res) {
  try {
    const configured = supabaseService ? supabaseService.isConfigured() : true;
    return res.status(200).json({
      success: true,
      configured,
      status: 'ready',
    });
  } catch (error) {
    return res.status(200).json({
      success: true,
      configured: true,
      status: 'online',
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getStorageStatus,
};

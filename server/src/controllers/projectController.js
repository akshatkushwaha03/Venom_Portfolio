const prisma = require('../lib/prisma');

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
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
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

    // Determine next order sequence for this category
    const catName = category ? category.trim() : 'Personal Projects';
    const lastProjectInCat = await prisma.project.findFirst({
      where: { category: catName },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const nextOrder = lastProjectInCat && typeof lastProjectInCat.order === 'number'
      ? lastProjectInCat.order + 1
      : 0;

    // Persist in Supabase PostgreSQL via Prisma
    const newProject = await prisma.project.create({
      data: {
        description: description.trim(),
        url: url.trim(),
        thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : null,
        category: catName,
        order: req.body.order !== undefined ? Number(req.body.order) : nextOrder,
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
        order: req.body.order !== undefined ? Number(req.body.order) : existingProject.order,
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
 * GET /api/projects/categories
 * Get list of all distinct project categories stored in DB
 */
async function getCategories(req, res) {
  try {
    const rawCategories = await prisma.project.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = rawCategories
      .map((p) => p.category)
      .filter((cat) => cat && cat.trim().length > 0);

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

/**
 * PUT /api/projects/reorder
 * Batch update the sequence/order of projects
 * Accepts { orderedIds: string[] } or { items: [{ id: string, order: number }] }
 */
async function reorderProjects(req, res) {
  try {
    const { orderedIds, items } = req.body;

    let updates = [];

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      updates = orderedIds.map((id, index) => ({
        id,
        order: index,
      }));
    } else if (Array.isArray(items) && items.length > 0) {
      updates = items.map((item, index) => ({
        id: item.id,
        order: typeof item.order === 'number' ? item.order : index,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: 'orderedIds array or items array is required to reorder projects',
      });
    }

    // Execute atomic transaction to update orders for each project
    await prisma.$transaction(
      updates.map((u) =>
        prisma.project.update({
          where: { id: u.id },
          data: { order: u.order },
        })
      )
    );

    return res.status(200).json({
      success: true,
      message: 'Projects reordered successfully',
      count: updates.length,
    });
  } catch (error) {
    console.error('[PROJECTS CONTROLLER] Error reordering projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project order in database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getCategories,
  reorderProjects,
};


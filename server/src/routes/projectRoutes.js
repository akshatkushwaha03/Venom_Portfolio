const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

/**
 * Storage Health / Status Check
 * GET /api/projects/storage/status
 */
router.get('/storage/status', projectController.getStorageStatus);

/**
 * List Projects
 * GET /api/projects
 * Query params: ?category=Personal%20Projects
 */
router.get('/', projectController.getAllProjects);

/**
 * Get Distinct Categories
 * GET /api/projects/categories
 */
router.get('/categories', projectController.getCategories);

/**
 * Get Project by ID
 * GET /api/projects/:id
 */
router.get('/:id', projectController.getProjectById);

/**
 * Create Project
 * POST /api/projects
 * Body: { description, url, thumbnailUrl, category }
 */
router.post('/', projectController.createProject);

/**
 * Update Project
 * PUT /api/projects/:id
 * Body: { description, url, thumbnailUrl, category }
 */
router.put('/:id', projectController.updateProject);

/**
 * Delete Project
 * DELETE /api/projects/:id
 */
router.delete('/:id', projectController.deleteProject);

module.exports = router;

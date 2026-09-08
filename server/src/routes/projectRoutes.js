const express = require('express');
const projectController = require('../controllers/projectController');

const router = express.Router();

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
 * Body: { url (required), description (optional), thumbnailUrl (optional), category (optional, default: 'Personal Projects') }
 */
router.post('/', projectController.createProject);

/**
 * Reorder Projects
 * PUT /api/projects/reorder
 * Body: { orderedIds: string[] } or { items: [{ id, order }] }
 */
router.put('/reorder', projectController.reorderProjects);

/**
 * Update Project
 * PUT /api/projects/:id
 * Body: { url, description (optional), thumbnailUrl (optional), category (optional), order }
 */
router.put('/:id', projectController.updateProject);

/**
 * Delete Project
 * DELETE /api/projects/:id
 */
router.delete('/:id', projectController.deleteProject);

module.exports = router;

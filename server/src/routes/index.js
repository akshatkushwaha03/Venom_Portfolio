const express = require('express');
const healthRoutes = require('./healthRoutes');
const contactRoutes = require('./contactRoutes');
const projectRoutes = require('./projectRoutes');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/contact', contactRoutes);
router.use('/projects', projectRoutes);

module.exports = router;

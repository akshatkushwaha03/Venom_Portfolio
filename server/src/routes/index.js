const express = require('express');
const healthRoutes = require('./healthRoutes');
const contactRoutes = require('./contactRoutes');
const projectRoutes = require('./projectRoutes');
const uploadRoutes = require('./uploadRoutes');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/contact', contactRoutes);
router.use('/projects', projectRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;

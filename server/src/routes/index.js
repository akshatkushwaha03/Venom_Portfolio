const express = require('express');
const healthRoutes = require('./healthRoutes');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

// Mount routes
router.use('/health', healthRoutes);
router.use('/contact', contactRoutes);

module.exports = router;

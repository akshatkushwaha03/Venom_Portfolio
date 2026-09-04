const express = require('express');
const router = express.Router();

/**
 * POST /api/contact
 * Handles incoming portfolio inquiries
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, discipline, message, budget } = req.body;

    // Basic validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your name.',
      });
    }

    if (!email || !email.trim() || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide details about your project or inquiry.',
      });
    }

    // Log the contact inquiry for the creator
    const inquiry = {
      timestamp: new Date().toISOString(),
      name: name.trim(),
      email: email.trim(),
      discipline: discipline || 'General Inquiry',
      budget: budget || 'Not specified',
      message: message.trim(),
    };

    console.log('[VENOM INQUIRY RECEIVED]:', inquiry);

    return res.status(200).json({
      success: true,
      message: 'Transmission received. Akshat will be in touch within 24 hours.',
      inquirySummary: {
        name: inquiry.name,
        email: inquiry.email,
        discipline: inquiry.discipline,
      },
    });
  } catch (error) {
    console.error('Error processing contact inquiry:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing your inquiry. Please reach out directly to venom.creative.stu@gmail.com',
    });
  }
});

module.exports = router;

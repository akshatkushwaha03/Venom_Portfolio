const express = require('express');
const { getHealth, testGdrive } = require('../controllers/healthController');

const router = express.Router();

router.get('/', getHealth);
if (typeof testGdrive === 'function') {
  router.get('/test-gdrive', testGdrive);
}

module.exports = router;

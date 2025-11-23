const express = require('express');
const router = express.Router();

const visionController = require('../controllers/visionController');
const authenticate = require('../middleware/authenticate');
const { generalUserLimiter } = require('../middleware/rateLimiter');

router.post(
  '/analyze-image',
  authenticate,
  generalUserLimiter,
  visionController.analyzeImage
);

module.exports = router;


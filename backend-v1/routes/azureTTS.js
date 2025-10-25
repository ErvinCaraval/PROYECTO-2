const express = require('express');
const router = express.Router();
const azureController = require('../controllers/azureTTSController');
const authenticate = require('../middleware/authenticate');
const { generalUserLimiter } = require('../middleware/rateLimiter');

// Text-to-Speech via Azure
router.post('/tts', authenticate, generalUserLimiter, azureController.textToSpeech);

// Get available voices
router.get('/voices', authenticate, generalUserLimiter, azureController.getVoices);

// Status
router.get('/status', azureController.getStatus);

module.exports = router;

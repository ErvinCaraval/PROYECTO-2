const express = require('express');
const ttsController = require('../controllers/ttsController');
const authenticate = require('../middleware/authenticate');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Route to synthesize speech
router.post('/synthesize', ttsController.synthesize);

// Route to get available voices
router.get('/voices', ttsController.getVoices);

module.exports = router;
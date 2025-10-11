const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const authenticate = require('../middleware/authenticate');
const { generalUserLimiter } = require('../middleware/rateLimiter');

// [HU8] Validar respuesta de voz
router.post('/validate', generalUserLimiter, voiceController.validateVoiceResponse);

// [HU8] Procesar respuesta de voz
router.post('/process', generalUserLimiter, voiceController.processVoiceResponse);

// [HU8] Obtener estadísticas de reconocimiento de voz
router.get('/stats/:userId', generalUserLimiter, voiceController.getVoiceRecognitionStats);

module.exports = router;
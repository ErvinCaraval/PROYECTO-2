const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const authenticate = require('../middleware/authenticate');
const { generalUserLimiter } = require('../middleware/rateLimiter');

// [HU8] Validar respuesta de voz
<<<<<<< HEAD
router.post('/validate', generalUserLimiter, voiceController.validateVoiceResponse);

// [HU8] Procesar respuesta de voz
router.post('/process', generalUserLimiter, voiceController.processVoiceResponse);

// [HU8] Obtener estadísticas de reconocimiento de voz
router.get('/stats/:userId', generalUserLimiter, voiceController.getVoiceRecognitionStats);

// [HU8] Procesar audio con AssemblyAI
router.post('/process-audio', generalUserLimiter, voiceController.processAudioWithAssemblyAI);

// [HU8] Verificar estado de AssemblyAI
router.get('/assemblyai/status', generalUserLimiter, voiceController.checkAssemblyAIStatus);
=======
router.post('/validate', authenticate, generalUserLimiter, voiceController.validateVoiceResponse);

// [HU8] Procesar respuesta de voz
router.post('/process', authenticate, generalUserLimiter, voiceController.processVoiceResponse);

// [HU8] Obtener estadísticas de reconocimiento de voz
router.get('/stats/:userId', authenticate, generalUserLimiter, voiceController.getVoiceRecognitionStats);
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e

module.exports = router;
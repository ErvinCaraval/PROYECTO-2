const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const assemblyAI = require('../services/assemblyAIService');
const { generalUserLimiter } = require('../middleware/rateLimiter');

const COLLECTION = 'voiceInteractions';

// [HU5] Registrar interacción de voz
router.post('/', generalUserLimiter, async (req, res) => {
  try {
    const { userId, questionId, action, duration, timestamp, voiceText, confidence, metadata } = req.body;
    // Validaciones adicionales
    if (!userId || typeof userId !== 'string' || userId.length < 3) {
      return res.status(400).json({ error: 'Invalid or missing userId.' });
    }
    if (!questionId || typeof questionId !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing questionId.' });
    }
    if (!['voice_answer', 'question_read'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action.' });
    }
    if (typeof duration !== 'number' || duration < 0) {
      return res.status(400).json({ error: 'Invalid duration.' });
    }
    if (!timestamp || isNaN(Date.parse(timestamp))) {
      return res.status(400).json({ error: 'Invalid timestamp.' });
    }
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({ error: 'Invalid metadata.' });
    }
    // Limitar tamaño de audioBase64
    if (metadata.audioBase64 && metadata.audioBase64.length > 2e6) {
      return res.status(413).json({ error: 'Audio demasiado grande.' });
    }

    // Procesar audio con AssemblyAI si está disponible
    let processedVoiceText = voiceText;
    let processedConfidence = confidence;
    
    if (metadata.audioBase64 && action === 'voice_answer') {
      try {
        // Convertir base64 a URL temporal para AssemblyAI
        const audioBuffer = Buffer.from(metadata.audioBase64, 'base64');
        const audioUrl = `data:audio/wav;base64,${metadata.audioBase64}`;
        
        // Procesar con AssemblyAI
        const result = await assemblyAI.transcribeAndWait(audioUrl, {
          language_code: 'es',
          punctuate: true,
          format_text: true
        });
        
        if (result.success) {
          processedVoiceText = result.text;
          processedConfidence = result.confidence;
        } else {
          console.warn('AssemblyAI transcription failed:', result.error);
        }
      } catch (error) {
        console.error('Error processing audio with AssemblyAI:', error);
        // Continuar sin fallar si AssemblyAI falla
      }
    }

    const doc = {
      userId,
      questionId,
      action,
      duration,
      timestamp: new Date(timestamp),
      voiceText: typeof processedVoiceText === 'string' ? processedVoiceText : null,
      confidence: typeof processedConfidence === 'number' ? processedConfidence : null,
      metadata: {
        ...metadata,
        assemblyAIProcessed: !!metadata.audioBase64 && action === 'voice_answer'
      }
    };
    await db.collection(COLLECTION).add(doc);
    res.status(201).json({ message: 'Voice interaction registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// [HU5] Endpoint de estadísticas básicas
router.get('/stats/:userId', generalUserLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
      if (!userId || typeof userId !== 'string') {
        return res.status(404).json({ error: 'Not found.' });
      }
    const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).get();
    let total = 0;
    let totalDuration = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (typeof data.duration === 'number') {
        total++;
        totalDuration += data.duration;
      }
    });
    const avgDuration = total > 0 ? totalDuration / total : 0;
    res.json({ total, averageDuration: avgDuration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU5] Recuperar historial de voz por usuario
router.get('/:userId', generalUserLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
      if (!userId || typeof userId !== 'string') {
        return res.status(404).json({ error: 'Not found.' });
      }
    const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).get();
    const result = [];
    snapshot.forEach(doc => {
      result.push({ id: doc.id, ...doc.data() });
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU5] Endpoint para eliminar historial de voz
router.delete('/:userId', generalUserLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
      if (!userId || typeof userId !== 'string') {
        return res.status(404).json({ error: 'Not found.' });
      }
    const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).get();
    let deleted = 0;
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      deleted++;
    });
    if (deleted === 0) {
      return res.status(404).json({ error: 'No interactions found to delete.' });
    }
    await batch.commit();
    res.json({ message: `Deleted ${deleted} interactions.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU5] Endpoint de estadísticas básicas
router.get('/stats/:userId', generalUserLimiter, async (req, res) => {
  try {
    const { userId } = req.params;
      if (!userId || typeof userId !== 'string') {
        return res.status(404).json({ error: 'Not found.' });
      }
    const snapshot = await db.collection(COLLECTION).where('userId', '==', userId).get();
    let total = 0;
    let totalDuration = 0;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (typeof data.duration === 'number') {
        total++;
        totalDuration += data.duration;
      }
    });
    const avgDuration = total > 0 ? totalDuration / total : 0;
    res.json({ total, averageDuration: avgDuration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU8] Procesar audio directamente con AssemblyAI
router.post('/process-audio', generalUserLimiter, async (req, res) => {
  try {
    const { audioBase64, questionOptions } = req.body;
    
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing audioBase64.' });
    }
    
    if (audioBase64.length > 2e6) {
      return res.status(413).json({ error: 'Audio demasiado grande.' });
    }
    
    // Convertir base64 a URL temporal para AssemblyAI
    const audioUrl = `data:audio/wav;base64,${audioBase64}`;
    
    // Procesar con AssemblyAI
    const result = await assemblyAI.transcribeAndWait(audioUrl, {
      language_code: 'es',
      punctuate: true,
      format_text: true
    });
    
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Transcription failed',
        details: result.error,
        suggestions: questionOptions ? assemblyAI.generateSuggestions(questionOptions) : []
      });
    }
    
    // Si hay opciones de pregunta, validar la respuesta
    let validation = null;
    if (questionOptions && Array.isArray(questionOptions)) {
      const { matchVoiceResponse } = require('../utils/voiceRecognition');
      validation = matchVoiceResponse(result.text, questionOptions);
    }
    
    res.json({
      success: true,
      text: result.text,
      confidence: result.confidence,
      duration: result.duration,
      language: result.language,
      validation: validation,
      suggestions: validation && !validation.isValid ? assemblyAI.generateSuggestions(questionOptions) : []
    });
    
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// [HU8] Verificar estado de AssemblyAI
router.get('/assemblyai/status', generalUserLimiter, async (req, res) => {
  try {
    const status = await assemblyAI.checkAPIStatus();
    res.json(status);
  } catch (error) {
    console.error('Error checking AssemblyAI status:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

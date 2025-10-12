const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

const COLLECTION = 'voiceInteractions';

// [HU5] Registrar interacción de voz
router.post('/', async (req, res) => {
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
    const doc = {
      userId,
      questionId,
      action,
      duration,
      timestamp: new Date(timestamp),
      voiceText: typeof voiceText === 'string' ? voiceText : null, // TODO: Integrar AssemblyAI para STT en HU9
      confidence: typeof confidence === 'number' ? confidence : null, // TODO: Integrar AssemblyAI para STT en HU9
      metadata
    };
    await db.collection(COLLECTION).add(doc);
    res.status(201).json({ message: 'Voice interaction registered successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU5] Recuperar historial de voz por usuario
router.get('/:userId', async (req, res) => {
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
router.delete('/:userId', async (req, res) => {
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
router.get('/stats/:userId', async (req, res) => {
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

module.exports = router;

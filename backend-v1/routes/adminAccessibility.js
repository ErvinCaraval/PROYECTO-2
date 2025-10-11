const express = require('express');
const router = express.Router();
const { db } = require('../firebase');

const SETTINGS_COLLECTION = 'adminSettings';

// [HU7] Obtener configuración de accesibilidad
router.get('/accessibility', async (req, res) => {
  try {
    const doc = await db.collection(SETTINGS_COLLECTION).doc('accessibility').get();
    res.json(doc.exists ? doc.data() : { voiceModeEnabled: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU7] Actualizar configuración de accesibilidad (solo admin)
router.put('/accessibility', async (req, res) => {
  try {
    // TODO: Validar que el usuario es admin (middleware de autenticación)
    const { voiceModeEnabled } = req.body;
    await db.collection(SETTINGS_COLLECTION).doc('accessibility').set({ voiceModeEnabled }, { merge: true });
    res.json({ message: 'Accesibilidad actualizada', voiceModeEnabled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU7] Endpoint de estadísticas de accesibilidad
router.get('/accessibility/stats', async (req, res) => {
  try {
    // Ejemplo: contar usuarios que han usado modo voz
    const snapshot = await db.collection('voiceInteractions').get();
    const userSet = new Set();
    snapshot.forEach(doc => {
      userSet.add(doc.data().userId);
    });
    res.json({ totalVoiceUsers: userSet.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

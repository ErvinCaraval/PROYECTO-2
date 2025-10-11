
const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const authenticate = require('../middleware/authenticate');

// [HU7] Obtener configuración de accesibilidad del usuario autenticado
router.get('/accessibility', authenticate, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'No autenticado' });
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuario no encontrado' });
    const data = userDoc.data();
    res.json({
      visualDifficulty: data.visualDifficulty || false,
      stats: data.stats || {},
      email: data.email,
      displayName: data.displayName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU7] Actualizar configuración de accesibilidad del usuario autenticado
router.put('/accessibility', authenticate, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'No autenticado' });
    const { visualDifficulty } = req.body;
    if (visualDifficulty !== undefined && typeof visualDifficulty !== 'boolean') {
      return res.status(400).json({ error: 'visualDifficulty debe ser booleano' });
    }
    const userRef = db.collection('users').doc(uid);
    await userRef.update({ visualDifficulty });
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();
    res.json({
      visualDifficulty: updatedData.visualDifficulty || false,
      email: updatedData.email,
      displayName: updatedData.displayName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// [HU7] Estadísticas de accesibilidad del usuario autenticado
router.get('/accessibility/stats', authenticate, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(401).json({ error: 'No autenticado' });
    const snapshot = await db.collection('voiceInteractions').where('userId', '==', uid).get();
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
    res.json({ totalInteractions: total, averageDuration: avgDuration });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

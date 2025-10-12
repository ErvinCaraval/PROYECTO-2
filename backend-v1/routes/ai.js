const express = require('express');
const AIController = require('../controllers/aiController');
const { generalUserLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
const aiController = new AIController();

// Generar preguntas con IA
router.post('/generate-questions', generalUserLimiter, (req, res) => {
  aiController.generateQuestions(req, res);
});

// Obtener temas disponibles
router.get('/topics', generalUserLimiter, (req, res) => {
  aiController.getTopics(req, res);
});

// Obtener niveles de dificultad
router.get('/difficulty-levels', generalUserLimiter, (req, res) => {
  aiController.getDifficultyLevels(req, res);
});

// Generar preguntas para un juego específico
router.post('/generate-game-questions', generalUserLimiter, (req, res) => {
  aiController.generateGameQuestions(req, res);
});

module.exports = router;


const axios = require('axios');
const crypto = require('crypto');
// Firestore DB for cross-game deduplication
let db;
try {
  db = require('../firebase').db;
} catch (e) {
  db = null;
}

class AIQuestionGenerator {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    this.openAiApiKey = process.env.OPENAI_API_KEY || '';
    this.groqURL = 'https://api.groq.com/openai/v1/chat/completions';
    this.openAiURL = 'https://api.openai.com/v1/chat/completions';
    // Model por defecto en Groq (rápido y gratuito con cuota)
    this.groqModel = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
    // Respaldo OpenAI si existiese
    this.openAiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  // Extrae JSON de respuestas que puedan venir con ``` o texto adicional
  extractJson(content) {
    if (!content) return null;
    // Elimina fences tipo ```json ... ```
    let cleaned = content.trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    // Si aún no es JSON puro, intenta localizar el primer objeto
    if (!(cleaned.startsWith('{') && cleaned.endsWith('}'))) {
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
      }
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      return null;
    }
  }

  // Generar preguntas usando IA (Groq por defecto)
  async generateQuestions(topic, difficulty = 'medium', count = 5) {
    try {
      const prompt = this.buildPrompt(topic, difficulty, count);
      let questions = [];

      if (!this.groqApiKey && !this.openAiApiKey) {
        throw new Error('No se encontró ninguna API key de IA. Por favor configura GROQ_API_KEY o OPENAI_API_KEY en tu archivo .env.');
      }

      // Preferir Groq si hay API key
      if (this.groqApiKey) {
        try {
          const response = await axios.post(this.groqURL, {
            model: this.groqModel,
            messages: [
              { role: 'system', content: 'Eres un experto en crear preguntas de trivia educativas y entretenidas. Responde siempre en formato JSON válido.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7
          }, {
            headers: {
              'Authorization': `Bearer ${this.groqApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          const content = response.data.choices?.[0]?.message?.content || '';
          const parsed = this.extractJson(content);
          if (parsed && parsed.questions) {
            questions = parsed.questions;
          }
        } catch (err) {
          throw new Error('Error al conectar con la API de Groq: ' + (err.response?.data?.error?.message || err.message));
        }
      } else if (this.openAiApiKey) {
        // Respaldo: OpenAI si está disponible
        try {
          const response = await axios.post(this.openAiURL, {
            model: this.openAiModel,
            messages: [
              { role: 'system', content: 'Eres un experto en crear preguntas de trivia educativas y entretenidas. Responde siempre en formato JSON válido.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7
          }, {
            headers: {
              'Authorization': `Bearer ${this.openAiApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          const content = response.data.choices?.[0]?.message?.content || '';
          const parsed = this.extractJson(content);
          if (parsed && parsed.questions) {
            questions = parsed.questions;
          }
        } catch (err) {
          throw new Error('Error al conectar con la API de OpenAI: ' + (err.response?.data?.error?.message || err.message));
        }
      }

      if (!questions || questions.length === 0) {
        throw new Error('La IA no devolvió preguntas válidas. Verifica tu API key y conexión.');
      }

      // Backwards compatibility: if AI returned simple questions with only text and no options,
      // return them as-is (this keeps unit tests and simple flows working).
      const looksLikeSimple = questions.every(q => q && (!q.options || (Array.isArray(q.options) && q.options.length === 0)) );
      if (looksLikeSimple) {
        // dedupe by text
        const seen = new Set();
        const out = [];
        for (const q of questions) {
          const t = (q.text || q.question || '').trim();
          if (!t) continue;
          const key = t.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          // Return legacy simple shape (only text) to preserve existing tests and callers
          out.push({ text: t });
          if (out.length >= count) break;
        }
        if (out.length < count) {
          throw new Error('La IA no generó suficientes preguntas únicas.');
        }
        return { questions: out.slice(0, count) };
      }

      // Sanitize and ensure exactly 4 options per question (A-D)
      const sanitizeQuestions = async (rawQuestions) => {
        const out = [];
        const seenTexts = new Set();

        for (const raw of rawQuestions) {
          if (!raw) continue;
          const text = (raw.text || raw.question || '').trim();
          if (!text) continue;
          const key = text.toLowerCase();
          if (seenTexts.has(key)) continue; // dedupe by text

          // Normalize options
          let opts = Array.isArray(raw.options) ? raw.options.map(o => (typeof o === 'string' ? o.trim() : '')).filter(Boolean) : [];

          // If the AI returned an object with labeled choices like {A:..., B:...}, flatten them
          if (opts.length === 0 && raw.options && typeof raw.options === 'object') {
            opts = Object.values(raw.options).map(o => (typeof o === 'string' ? o.trim() : '')).filter(Boolean);
          }

          // Remove duplicates while preserving order
          const seenOpt = new Set();
          opts = opts.filter(o => {
            const k = o.toLowerCase();
            if (seenOpt.has(k)) return false;
            seenOpt.add(k);
            return true;
          });

          // If there are fewer than 4 options, skip this question (prefer valid ones)
          if (opts.length < 4) continue;

          // If more than 4, try to ensure the correct answer remains and trim others
          let correctIndex = typeof raw.correctAnswerIndex === 'number' ? raw.correctAnswerIndex : undefined;
          // If correctAnswerIndex not provided but raw.correctAnswer or raw.answer exists, try to find it
          if ((correctIndex === undefined || correctIndex === null) && raw.correctAnswer) {
            const idx = opts.findIndex(o => o.toLowerCase() === String(raw.correctAnswer).trim().toLowerCase());
            if (idx !== -1) correctIndex = idx;
          }

          // If still undefined, try common keys
          if (correctIndex === undefined || correctIndex === null) {
            // assume first option is correct as fallback
            correctIndex = 0;
          }

          // Ensure correctIndex within bounds
          if (correctIndex < 0 || correctIndex >= opts.length) correctIndex = 0;

          // If more than 4 options, pick 3 distractors plus the correct answer
          if (opts.length > 4) {
            const correctValue = opts[correctIndex];
            // collect distractors (all except correct), then randomly pick 3
            const distractors = opts.filter((_, i) => i !== correctIndex);
            // shuffle distractors
            for (let i = distractors.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
            }
            const chosen = distractors.slice(0, 3);
            opts = [correctValue, ...chosen];
          }

          // Now opts length should be >=4 (we skipped <4) and <=4 here; if somehow >4 still, trim
          if (opts.length > 4) opts = opts.slice(0, 4);

          // Shuffle options while tracking correct index
          const correctValueFinal = opts[correctIndex] || opts[0];
          // Ensure correctValueFinal is present
          if (!opts.includes(correctValueFinal)) {
            opts[0] = correctValueFinal;
          }

          // Shuffle
          const shuffled = opts.slice();
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          const finalCorrectIndex = shuffled.findIndex(o => o === correctValueFinal);

          const questionObj = {
            id: raw.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text,
            options: shuffled,
            correctAnswerIndex: finalCorrectIndex >= 0 ? finalCorrectIndex : 0,
            category: raw.category || raw.topic || topic,
            difficulty: raw.difficulty || difficulty,
            explanation: raw.explanation || raw.explain || ''
          };

          // Cross-game dedupe: if DB available, skip questions already stored
          if (db) {
            try {
              const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
              const hash = crypto.createHash('sha256').update(normalized).digest('hex');
              const doc = await db.collection('ai_generated_questions').doc(hash).get();
              if (doc.exists) {
                // already used in previous games, skip
                continue;
              }
              // persist a lightweight record to avoid reuse
              await db.collection('ai_generated_questions').doc(hash).set({
                text: questionObj.text,
                createdAt: Date.now(),
                topic: questionObj.category
              }).catch(() => {});
            } catch (e) {
              // If DB check fails, don't break generation; just proceed
              console.warn('AI question DB check failed:', e.message || e);
            }
          }

          seenTexts.add(key);
          out.push(questionObj);
          if (out.length >= count) break; // stop early if we have enough
        }
        return out;
      };

      const sanitized = await sanitizeQuestions(questions);
      if (!sanitized || sanitized.length < count) {
        throw new Error('La IA no generó suficientes preguntas únicas y válidas con 4 opciones. Intenta de nuevo con otro prompt o reduce la cantidad.');
      }

      return { questions: sanitized.slice(0, count) };
    } catch (error) {
      throw error;
    }
  }

  // Generar preguntas usando una API gratuita alternativa
  async generateQuestionsFree(topic, difficulty = 'medium', count = 5) {
    try {
      throw new Error('No se pueden generar preguntas locales.');
    } catch (error) {
  // ...log eliminado...
        throw new Error('No se pueden generar preguntas con IA.');
    }
  }

 
  // Llenar template con datos dinámicos
  fillTemplate(template, topic, difficulty) {
    return {
      ...template,
      id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      category: topic,
      difficulty: difficulty,
      source: 'AI Generated'
    };
  }

  // Construir prompt para OpenAI
  buildPrompt(topic, difficulty, count) {
    return `Genera ${count} preguntas de trivia sobre el tema "${topic}" con dificultad ${difficulty}.

Formato requerido (JSON válido):
{
  "questions": [
    {
      "id": "unique_id",
      "text": "Pregunta aquí",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswerIndex": 0,
      "category": "${topic}",
      "difficulty": "${difficulty}",
      "explanation": "Explicación de la respuesta correcta"
    }
  ]
}

Requisitos:
- Preguntas interesantes y educativas
- 4 opciones de respuesta
- Explicación clara de la respuesta correcta
- Dificultad apropiada para el nivel ${difficulty}
- Tema: ${topic}

Responde solo con el JSON, sin texto adicional.`;
  }

  // Preguntas de respaldo si falla la IA
  getFallbackQuestions(topic, difficulty, count) {
    throw new Error('No se pueden generar preguntas de respaldo.');
  }

  // Obtener temas disponibles
  getAvailableTopics() {
    return [
      'Ciencia',
      'Historia',
      'Geografía',
      'Tecnología',
      'Deportes',
      'Arte',
      'Literatura',
      'Matemáticas',
      'Biología',
      'Química',
      'Física',
      'Astronomía',
      'Música',
      'Cine',
      'Videojuegos'
    ];
  }

  // Obtener niveles de dificultad
  getDifficultyLevels() {
    return [
      { value: 'easy', label: 'Fácil' },
      { value: 'medium', label: 'Medio' },
      { value: 'hard', label: 'Difícil' }
    ];
  }
}

module.exports = AIQuestionGenerator;



require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { db, auth } = require('./firebase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Swagger UI para documentación interactiva usando swagger.yaml
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const yaml = require('js-yaml');
const swaggerDocument = yaml.load(fs.readFileSync(__dirname + '/swagger/swagger.yaml', 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(cors());
app.use(express.json());

app.use('/api/users', require('./routes/users'));
app.use('/api/games', require('./routes/games'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/ai', require('./routes/ai'));

app.use('/api/voice-interactions', require('./routes/voiceInteractions'));
app.use('/api/voice-responses', require('./routes/voiceResponses'));

app.use('/api/admin', require('./routes/adminAccessibility'));

io.on('connection', (socket) => {
  // Listener para enviar la primera pregunta al socket que lo solicita
  socket.on('requestQuestion', async ({ gameId }) => {

    socket.join(gameId); // Unir a la room antes de enviar la pregunta
    await sendQuestion(io, gameId, 0);
  });


  // Create Game
  socket.on('createGame', async (options) => {
    try {
      // Log del token recibido
      // Validar el token de autenticación
      if (!options.token) {
        socket.emit('error', { error: 'Missing authentication token' });
        return;
      }
      let decodedToken;
      try {
        decodedToken = await auth.verifyIdToken(options.token);
      } catch (err) {
        socket.emit('error', { error: 'Invalid authentication token: ' + err.message });
        return;
      }
      if (decodedToken.uid !== options.hostId) {
        socket.emit('error', { error: 'Token UID does not match hostId' });
        return;
      }
      const gameCode = Math.floor(100000 + Math.random() * 900000).toString();
      // REGLA 1: Solo se aceptan preguntas recién generadas, del tema y cantidad exactos
      let questions = Array.isArray(options.questions) ? options.questions : [];
      if (!questions.length) {
        socket.emit('error', { error: 'No se recibieron preguntas nuevas para crear la partida.' });
        return;
      }
      // Validar que todas las preguntas sean del tema seleccionado y cantidad exacta
      if (options.topic) {
        const allMatchTopic = questions.every(q => (q.category || q.topic) === options.topic);
        if (!allMatchTopic) {
          socket.emit('error', { error: 'Todas las preguntas deben ser del tema seleccionado.' });
          return;
        }
      }
      if (options.count && questions.length !== options.count) {
        socket.emit('error', { error: 'La cantidad de preguntas no coincide con la solicitada.' });
        return;
      }
      // Normalizar formato y recortar a la cantidad exacta pedida
      let mappedQuestions = questions.map(q => {
        if (q.text && !q.question) {
          const { text, ...rest } = q;
          return { ...rest, question: text };
        }
        return q;
      });
      if (options.count && mappedQuestions.length > options.count) {
        mappedQuestions = mappedQuestions.slice(0, options.count);
      }
  
      const gameData = {
        hostId: options.hostId,
        isPublic: options.isPublic,
        status: 'waiting',
        players: [{ uid: options.hostId, displayName: options.displayName, score: 0, responseTimes: [] }],
        questions: mappedQuestions,
        currentQuestion: 0,
        topic: options.topic || '',
        difficulty: options.difficulty || 'medium',
        createdAt: Date.now(),
        questionStartTimes: {} // Para almacenar cuándo se envió cada pregunta
      };
      await db.collection('games').doc(gameCode).set(gameData);
      socket.join(gameCode);
  socket.emit('gameCreated', { gameId: gameCode, questions: mappedQuestions, ...gameData });
    } catch (error) {

      socket.emit('error', { error: error.message });
    }
  });

  // Join Game
  socket.on('joinGame', async ({ gameId, uid, displayName }) => {
    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }
      const game = gameDoc.data();
      if (game.status !== 'waiting') {
        socket.emit('error', { error: 'Game already started' });
        return;
      }
      const alreadyJoined = game.players.some(p => p.uid === uid);
      if (!alreadyJoined) {
        game.players.push({ uid, displayName, score: 0, responseTimes: [] });
        await gameRef.update({ players: game.players });
      }
      socket.join(gameId);
      io.to(gameId).emit('playerJoined', { players: game.players });
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  // Start Game
  socket.on('startGame', async ({ gameId }) => {
    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }
      const game = gameDoc.data();
      if (!game.questions || !Array.isArray(game.questions) || game.questions.length === 0) {
        socket.emit('error', { error: 'No hay preguntas asociadas a esta partida.' });
        return;
      }
      await gameRef.update({ status: 'in-progress' });
      io.to(gameId).emit('gameStarted', { questionsCount: game.questions.length });
      setTimeout(() => {
        sendQuestion(io, gameId, 0);
      }, 1000); // Espera 1 segundo antes de enviar la primera pregunta
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  // Submit Answer
  socket.on('submitAnswer', async ({ gameId, uid, answerIndex }) => {
    try {
      // Permitir recibir answerValue además de answerIndex
      let answerValue = undefined;
      if (typeof arguments[0] === 'object' && arguments[0] !== null && 'answerValue' in arguments[0]) {
        answerValue = arguments[0].answerValue;
      }
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }
      const game = gameDoc.data();
      const currentQ = game.questions[game.currentQuestion];
      if (!currentQ) {
        socket.emit('error', { error: 'No current question' });
        return;
      }
      if (!socket.data.answers) socket.data.answers = {};
      // Capturar el tiempo de respuesta
      const responseTime = Date.now();
      // Guardar ambos: índice, valor y tiempo de respuesta
      socket.data.answers[game.currentQuestion] = { answerIndex, answerValue, responseTime };
      socket.data.uid = uid;
      const sockets = await io.in(gameId).fetchSockets();
      const answers = {};
      sockets.forEach(s => {
        if (s.data.answers && s.data.answers[game.currentQuestion] !== undefined) {
          answers[s.data.uid] = s.data.answers[game.currentQuestion];
        }
      });
      // Solo avanzar si todos respondieron
      if (Object.keys(answers).length === game.players.length) {
        const correctValue = Array.isArray(currentQ.options) && typeof currentQ.correctAnswerIndex === 'number'
          ? currentQ.options[currentQ.correctAnswerIndex]
          : undefined;
        
        // Obtener el tiempo de inicio de la pregunta actual
        const questionStartTime = game.questionStartTimes && game.questionStartTimes[game.currentQuestion] 
          ? game.questionStartTimes[game.currentQuestion] 
          : Date.now();
        
        const updatedPlayers = game.players.map(player => {
          const ansObj = answers[player.uid];
          let score = player.score;
          let responseTimes = player.responseTimes || [];
          
          // Calcular el tiempo de respuesta para esta pregunta
          if (ansObj && ansObj.responseTime) {
            const responseTimeMs = ansObj.responseTime - questionStartTime;
            responseTimes.push(responseTimeMs);
          }
          
          // Validar por valor, y si no hay valor, por índice
          if (ansObj) {
            if (
              typeof ansObj.answerValue !== 'undefined' &&
              typeof correctValue !== 'undefined' &&
              ansObj.answerValue === correctValue
            ) {
              score += 1;
            } else if (
              typeof ansObj.answerIndex === 'number' &&
              typeof currentQ.correctAnswerIndex === 'number' &&
              ansObj.answerIndex === currentQ.correctAnswerIndex
            ) {
              score += 1;
            }
          }
          return { ...player, score, responseTimes };
        });
        await gameRef.update({ players: updatedPlayers });
        io.to(gameId).emit('answerResult', {
          correctAnswerIndex: currentQ.correctAnswerIndex,
          explanation: currentQ.explanation,
          players: updatedPlayers
        });
        const nextIndex = game.currentQuestion + 1;
        setTimeout(async () => {
          if (nextIndex < game.questions.length) {
            await gameRef.update({ currentQuestion: nextIndex });
            sendQuestion(io, gameId, nextIndex);
          } else {
            await gameRef.update({ status: 'finished' });
            io.to(gameId).emit('gameFinished', { players: updatedPlayers });

            // Guardar historial de partida para cada jugador
            const gameDocFinal = await gameRef.get();
            const finalGame = gameDocFinal.data();
            const now = new Date();
            const players = finalGame.players || [];
            const questionsCount = Array.isArray(finalGame.questions) ? finalGame.questions.length : 0;
            // Determinar el score más alto
            const maxScore = Math.max(...players.map(p => p.score));
            const playersWithMaxScore = players.filter(p => p.score === maxScore);
            
            // Función para calcular tiempo promedio de respuesta
            const calculateAverageResponseTime = (responseTimes) => {
              if (!responseTimes || responseTimes.length === 0) return Infinity;
              return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
            };
            
            // Determinar ganador considerando empates por tiempo
            let winnerUid = null;
            if (playersWithMaxScore.length === 1) {
              // Solo un jugador con score máximo
              winnerUid = playersWithMaxScore[0].uid;
            } else if (playersWithMaxScore.length > 1 && maxScore > 0) {
              // Múltiples jugadores con score máximo - desempate por tiempo promedio
              let fastestPlayer = playersWithMaxScore[0];
              let fastestTime = calculateAverageResponseTime(fastestPlayer.responseTimes);
              
              for (let i = 1; i < playersWithMaxScore.length; i++) {
                const currentTime = calculateAverageResponseTime(playersWithMaxScore[i].responseTimes);
                if (currentTime < fastestTime) {
                  fastestTime = currentTime;
                  fastestPlayer = playersWithMaxScore[i];
                }
              }
              winnerUid = fastestPlayer.uid;
            }
            
            for (const player of players) {
              const result = player.uid === winnerUid && maxScore > 0
                ? 'win'
                : 'lose';
              // Determinar si el jugador fue host
              const isHost = finalGame.hostId === player.uid;
              await db.collection('gameResults').add({
                uid: player.uid,
                gameId: gameId,
                date: now.toISOString(),
                score: player.score,
                result,
                players: players.map(p => ({ uid: p.uid, displayName: p.displayName, score: p.score })),
                questionsCount,
                topic: finalGame.topic || '',
                difficulty: finalGame.difficulty || '',
                isHost
              });

              // Actualizar estadísticas del usuario, crear doc si no existe
              const userRef = db.collection('users').doc(player.uid);
              await db.runTransaction(async (t) => {
                const userDoc = await t.get(userRef);
                let stats = { gamesPlayed: 0, wins: 0, correctAnswers: 0 };
                let baseUser = {};
                if (!userDoc.exists) {
                  // Si hay displayName/email en player, los guardamos
                  if (player.displayName) baseUser.displayName = player.displayName;
                  if (player.email) baseUser.email = player.email;
                  baseUser.stats = stats;
                  t.set(userRef, baseUser);

                } else {
                  stats = userDoc.data().stats || stats;
                  baseUser = userDoc.data();
                }
                const gamesPlayed = (stats.gamesPlayed || 0) + 1;
                const wins = (stats.wins || 0) + (result === 'win' ? 1 : 0);
                const correctAnswers = (stats.correctAnswers || 0) + (player.score || 0);
                t.set(userRef, { ...baseUser, stats: { gamesPlayed, wins, correctAnswers } }, { merge: true });

              });
            }
          }
        }, 3000);
      }
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  // [HU8] Submit Voice Answer - Nueva funcionalidad para respuestas de voz
  socket.on('submitVoiceAnswer', async ({ gameId, uid, voiceResponse, questionOptions }) => {
    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }
      const game = gameDoc.data();
      const currentQ = game.questions[game.currentQuestion];
      if (!currentQ) {
        socket.emit('error', { error: 'No current question' });
        return;
      }

      // Validar respuesta de voz usando el controlador
      const voiceController = require('./controllers/voiceController');
      const validation = matchVoiceResponse(voiceResponse, questionOptions || currentQ.options);
      
      if (!validation.isValid) {
        socket.emit('voiceAnswerError', { 
          error: 'No se pudo reconocer la respuesta de voz',
          suggestions: generateSuggestions(questionOptions || currentQ.options)
        });
        return;
      }

      // Registrar interacción de voz
      await db.collection('voiceInteractions').add({
        userId: uid,
        questionId: currentQ.id || `q_${game.currentQuestion}`,
        gameId: gameId,
        action: 'voice_answer',
        voiceText: voiceResponse,
        confidence: validation.confidence,
        timestamp: new Date(),
        metadata: {
          matchedOption: validation.matchedOption,
          isValid: validation.isValid,
          questionOptions: questionOptions || currentQ.options
        }
      });

      // Procesar la respuesta como una respuesta normal
      if (!socket.data.answers) socket.data.answers = {};
      const responseTime = Date.now();
      socket.data.answers[game.currentQuestion] = { 
        answerIndex: validation.answerIndex, 
        answerValue: validation.matchedOption, 
        responseTime,
        isVoiceAnswer: true,
        confidence: validation.confidence
      };
      socket.data.uid = uid;

      // Notificar a todos los jugadores que se recibió una respuesta de voz
      io.to(gameId).emit('voiceAnswerReceived', {
        uid,
        confidence: validation.confidence,
        matchedOption: validation.matchedOption
      });

      // Continuar con el flujo normal de procesamiento de respuestas
      const sockets = await io.in(gameId).fetchSockets();
      const answers = {};
      sockets.forEach(s => {
        if (s.data.answers && s.data.answers[game.currentQuestion] !== undefined) {
          answers[s.data.uid] = s.data.answers[game.currentQuestion];
        }
      });

      // Solo avanzar si todos respondieron
      if (Object.keys(answers).length === game.players.length) {
        const correctValue = Array.isArray(currentQ.options) && typeof currentQ.correctAnswerIndex === 'number'
          ? currentQ.options[currentQ.correctAnswerIndex]
          : undefined;
        
        const questionStartTime = game.questionStartTimes && game.questionStartTimes[game.currentQuestion] 
          ? game.questionStartTimes[game.currentQuestion] 
          : Date.now();
        
        const updatedPlayers = game.players.map(player => {
          const ansObj = answers[player.uid];
          let score = player.score;
          let responseTimes = player.responseTimes || [];
          
          if (ansObj && ansObj.responseTime) {
            const responseTimeMs = ansObj.responseTime - questionStartTime;
            responseTimes.push(responseTimeMs);
          }
          
          if (ansObj) {
            if (
              typeof ansObj.answerValue !== 'undefined' &&
              typeof correctValue !== 'undefined' &&
              ansObj.answerValue === correctValue
            ) {
              score += 1;
            } else if (
              typeof ansObj.answerIndex === 'number' &&
              typeof currentQ.correctAnswerIndex === 'number' &&
              ansObj.answerIndex === currentQ.correctAnswerIndex
            ) {
              score += 1;
            }
          }
          return { ...player, score, responseTimes };
        });
        
        await gameRef.update({ players: updatedPlayers });
        io.to(gameId).emit('answerResult', {
          correctAnswerIndex: currentQ.correctAnswerIndex,
          explanation: currentQ.explanation,
          players: updatedPlayers
        });
        
        const nextIndex = game.currentQuestion + 1;
        setTimeout(async () => {
          if (nextIndex < game.questions.length) {
            await gameRef.update({ currentQuestion: nextIndex });
            sendQuestion(io, gameId, nextIndex);
          } else {
            await gameRef.update({ status: 'finished' });
            io.to(gameId).emit('gameFinished', { players: updatedPlayers });
            // ... resto del código de finalización del juego
          }
        }, 3000);
      }
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  // [HU8] Toggle Voice Mode - Activar/desactivar modo de voz
  socket.on('toggleVoiceMode', async ({ gameId, uid, voiceModeEnabled }) => {
    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }

      // Actualizar el estado del modo de voz del jugador
      const game = gameDoc.data();
      const updatedPlayers = game.players.map(player => {
        if (player.uid === uid) {
          return { ...player, voiceModeEnabled: voiceModeEnabled };
        }
        return player;
      });

      await gameRef.update({ players: updatedPlayers });

      // Notificar a todos los jugadores sobre el cambio de modo de voz
      io.to(gameId).emit('voiceModeChanged', {
        uid,
        voiceModeEnabled,
        players: updatedPlayers
      });

      // Registrar la interacción de voz
      await db.collection('voiceInteractions').add({
        userId: uid,
        questionId: null,
        gameId: gameId,
        action: 'voice_mode_toggle',
        voiceText: null,
        confidence: null,
        timestamp: new Date(),
        metadata: {
          voiceModeEnabled,
          gameId
        }
      });

    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });

  // [HU8] Voice Mode Status - Obtener estado del modo de voz de todos los jugadores
  socket.on('getVoiceModeStatus', async ({ gameId }) => {
    try {
      const gameRef = db.collection('games').doc(gameId);
      const gameDoc = await gameRef.get();
      if (!gameDoc.exists) {
        socket.emit('error', { error: 'Game not found' });
        return;
      }

      const game = gameDoc.data();
      const voiceModeStatus = game.players.map(player => ({
        uid: player.uid,
        displayName: player.displayName,
        voiceModeEnabled: player.voiceModeEnabled || false
      }));

      socket.emit('voiceModeStatus', { players: voiceModeStatus });
    } catch (error) {
      socket.emit('error', { error: error.message });
    }
  });
});

async function sendQuestion(io, gameId, questionIndex) {
  const gameRef = db.collection('games').doc(gameId);
  const gameDoc = await gameRef.get();
  if (!gameDoc.exists) return;
  const game = gameDoc.data();
  if (questionIndex >= game.questions.length) {
    io.to(gameId).emit('gameFinished', { players: game.players });
    await gameRef.update({ status: 'finished' });
    return;
  }
  
  // Capturar el timestamp cuando se envía la pregunta
  const questionStartTime = Date.now();
  const questionStartTimes = game.questionStartTimes || {};
  questionStartTimes[questionIndex] = questionStartTime;
  await gameRef.update({ questionStartTimes });
  
  let question = game.questions[questionIndex];
  // Solo adaptar el campo 'question' si viene como 'text', pero JAMÁS modificar options ni correctAnswerIndex
  if (question) {
    if (!question.question && question.text) {
      const { text, ...rest } = question;
      question = { ...rest, question: text };
    } else if (!question.question && !question.text) {
      io.to(gameId).emit('newQuestion', { question: { question: 'Error: pregunta sin texto', options: [], correctAnswerIndex: null }, index: questionIndex });
      return;
    }
    // Enviar la pregunta tal como está guardada (sin modificar options ni correctAnswerIndex)
    io.to(gameId).emit('newQuestion', { question, index: questionIndex });
  } else {
    io.to(gameId).emit('newQuestion', { question: { question: 'Error: pregunta no encontrada', options: [], correctAnswerIndex: null }, index: questionIndex });
  }
}

// [HU8] Funciones auxiliares para el modo de voz
function matchVoiceResponse(voiceResponse, questionOptions) {
  const response = voiceResponse.toLowerCase().trim();
  const options = questionOptions.map((opt, index) => ({
    text: opt.toLowerCase().trim(),
    original: opt,
    index
  }));

  // 1. Coincidencia exacta
  const exactMatch = options.find(opt => opt.text === response);
  if (exactMatch) {
    return {
      isValid: true,
      matchedOption: exactMatch.original,
      answerIndex: exactMatch.index,
      confidence: 1.0
    };
  }

  // 2. Coincidencia por letra (A, B, C, D)
  const letterMatch = matchByLetter(response, options);
  if (letterMatch.isValid) {
    return letterMatch;
  }

  // 3. Coincidencia por posición (primera, segunda, etc.)
  const positionMatch = matchByPosition(response, options);
  if (positionMatch.isValid) {
    return positionMatch;
  }

  // 4. Coincidencia parcial por palabras clave
  const partialMatch = matchByKeywords(response, options);
  if (partialMatch.isValid) {
    return partialMatch;
  }

  // 5. No se encontró coincidencia
  return {
    isValid: false,
    matchedOption: null,
    answerIndex: null,
    confidence: 0.0
  };
}

// Coincidencia por letra (A, B, C, D)
function matchByLetter(response, options) {
  const letterPatterns = {
    'a': 0, 'primera': 0, 'uno': 0, '1': 0,
    'b': 1, 'segunda': 1, 'dos': 1, '2': 1,
    'c': 2, 'tercera': 2, 'tres': 2, '3': 2,
    'd': 3, 'cuarta': 3, 'cuatro': 3, '4': 3
  };

  for (const [pattern, index] of Object.entries(letterPatterns)) {
    if (response.includes(pattern) && index < options.length) {
      return {
        isValid: true,
        matchedOption: options[index].original,
        answerIndex: index,
        confidence: 0.9
      };
    }
  }

  return { isValid: false };
}

// Coincidencia por posición (primera opción, segunda opción, etc.)
function matchByPosition(response, options) {
  const positionWords = [
    'primera', 'segunda', 'tercera', 'cuarta',
    'quinta', 'sexta', 'séptima', 'octava'
  ];

  for (let i = 0; i < positionWords.length && i < options.length; i++) {
    if (response.includes(positionWords[i])) {
      return {
        isValid: true,
        matchedOption: options[i].original,
        answerIndex: i,
        confidence: 0.8
      };
    }
  }

  return { isValid: false };
}

// Coincidencia parcial por palabras clave
function matchByKeywords(response, options) {
  let bestMatch = { isValid: false, confidence: 0 };
  
  options.forEach((option, index) => {
    const words = option.text.split(' ');
    let matchCount = 0;
    
    words.forEach(word => {
      if (word.length > 3 && response.includes(word)) {
        matchCount++;
      }
    });
    
    const confidence = matchCount / words.length;
    if (confidence > 0.3 && confidence > bestMatch.confidence) {
      bestMatch = {
        isValid: true,
        matchedOption: option.original,
        answerIndex: index,
        confidence: Math.min(confidence, 0.7)
      };
    }
  });

  return bestMatch;
}

// Generar sugerencias para respuestas no reconocidas
function generateSuggestions(questionOptions) {
  const suggestions = [];
  
  // Sugerencias por letra
  questionOptions.forEach((option, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, D
    suggestions.push(`Diga "${letter}" para ${option.substring(0, 30)}...`);
  });
  
  // Sugerencias por posición
  const positionWords = ['primera', 'segunda', 'tercera', 'cuarta'];
  questionOptions.forEach((option, index) => {
    if (index < positionWords.length) {
      suggestions.push(`Diga "${positionWords[index]} opción"`);
    }
  });
  
  return suggestions;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor híbrido ejecutándose en puerto ${PORT}`);
  console.log(`📚 Documentación API disponible en http://localhost:${PORT}/api-docs`);
});

module.exports = { app };


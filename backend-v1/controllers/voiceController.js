const { db } = require('../firebase');
<<<<<<< HEAD
const assemblyAI = require('../services/assemblyAIService');
const { matchVoiceResponse, generateSuggestions } = require('../utils/voiceRecognition');

// [HU8] Validar respuesta de voz contra opciones de pregunta
exports.validateVoiceResponse = async (req, res) => {
  const { userId, questionId, voiceResponse, questionOptions, gameId } = req.body;
  
  try {
    // Validaciones básicas
    if (!userId || !questionId || !voiceResponse) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, questionId, voiceResponse' 
      });
    }

    if (!questionOptions || !Array.isArray(questionOptions)) {
      return res.status(400).json({ 
        error: 'questionOptions must be an array' 
      });
    }

    // Algoritmo de validación de respuestas de voz
=======

// [HU8] Validar respuesta de voz
exports.validateVoiceResponse = async (req, res) => {
  try {
    const { userId, questionId, voiceResponse, questionOptions } = req.body;
    
    // Validaciones básicas
    if (!userId || !questionId || !voiceResponse || !questionOptions) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, questionId, voiceResponse, questionOptions' 
      });
    }

    if (!Array.isArray(questionOptions) || questionOptions.length === 0) {
      return res.status(400).json({ 
        error: 'questionOptions must be a non-empty array' 
      });
    }

    // Procesar respuesta de voz
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    const validation = matchVoiceResponse(voiceResponse, questionOptions);
    
    // Registrar interacción de voz
    await db.collection('voiceInteractions').add({
      userId,
      questionId,
<<<<<<< HEAD
      gameId: gameId || null,
=======
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      action: 'voice_answer',
      voiceText: voiceResponse,
      confidence: validation.confidence,
      timestamp: new Date(),
<<<<<<< HEAD
      metadata: {
        matchedOption: validation.matchedOption,
        isValid: validation.isValid,
        questionOptions: questionOptions
=======
      duration: 0, // Se puede calcular si es necesario
      metadata: {
        matchedOption: validation.matchedOption,
        answerIndex: validation.answerIndex,
        isValid: validation.isValid
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      }
    });
    
    res.json({ 
      valid: validation.isValid, 
      matchedOption: validation.matchedOption,
<<<<<<< HEAD
      confidence: validation.confidence,
      answerIndex: validation.answerIndex
=======
      answerIndex: validation.answerIndex,
      confidence: validation.confidence
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    });
  } catch (error) {
    console.error('Error validating voice response:', error);
    res.status(500).json({ error: error.message });
  }
};

<<<<<<< HEAD
// [HU8] Procesar respuesta de voz y convertir a formato de juego
exports.processVoiceResponse = async (req, res) => {
  const { userId, questionId, voiceResponse, questionOptions, gameId } = req.body;
  
  try {
    // Validaciones básicas
    if (!userId || !questionId || !voiceResponse) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, questionId, voiceResponse' 
      });
    }

    if (!questionOptions || !Array.isArray(questionOptions)) {
      return res.status(400).json({ 
        error: 'questionOptions must be an array' 
      });
    }

    // Algoritmo de validación de respuestas de voz
=======
// [HU8] Procesar respuesta de voz
exports.processVoiceResponse = async (req, res) => {
  try {
    const { userId, questionId, voiceResponse, questionOptions } = req.body;
    
    // Validaciones básicas
    if (!userId || !questionId || !voiceResponse || !questionOptions) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, questionId, voiceResponse, questionOptions' 
      });
    }

    // Procesar respuesta de voz
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    const validation = matchVoiceResponse(voiceResponse, questionOptions);
    
    // Registrar interacción de voz
    await db.collection('voiceInteractions').add({
      userId,
      questionId,
<<<<<<< HEAD
      gameId: gameId || null,
=======
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      action: 'voice_answer',
      voiceText: voiceResponse,
      confidence: validation.confidence,
      timestamp: new Date(),
<<<<<<< HEAD
      metadata: {
        matchedOption: validation.matchedOption,
        isValid: validation.isValid,
        questionOptions: questionOptions
      }
    });
    
    // Si la respuesta es válida, devolver el índice de la opción
    if (validation.isValid) {
      res.json({
        success: true,
        answerIndex: validation.answerIndex,
        answerValue: validation.matchedOption,
        confidence: validation.confidence
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'No se pudo reconocer la respuesta de voz',
        suggestions: generateSuggestions(questionOptions)
      });
    }
=======
      duration: 0,
      metadata: {
        matchedOption: validation.matchedOption,
        answerIndex: validation.answerIndex,
        isValid: validation.isValid,
        processedAt: new Date()
      }
    });
    
    res.json({ 
      success: true,
      result: validation
    });
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
  } catch (error) {
    console.error('Error processing voice response:', error);
    res.status(500).json({ error: error.message });
  }
};

<<<<<<< HEAD
// [HU8] Obtener estadísticas de reconocimiento de voz para un usuario
exports.getVoiceRecognitionStats = async (req, res) => {
  const { userId } = req.params;
  
  try {
=======
// [HU8] Obtener estadísticas de reconocimiento de voz
exports.getVoiceRecognitionStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

<<<<<<< HEAD
=======
    // Obtener todas las interacciones de voz del usuario
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    const snapshot = await db.collection('voiceInteractions')
      .where('userId', '==', userId)
      .where('action', '==', 'voice_answer')
      .get();

    let totalAttempts = 0;
    let successfulRecognitions = 0;
    let totalConfidence = 0;
<<<<<<< HEAD
    const recentInteractions = [];
=======
    let averageConfidence = 0;
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e

    snapshot.forEach(doc => {
      const data = doc.data();
      totalAttempts++;
      
      if (data.metadata && data.metadata.isValid) {
        successfulRecognitions++;
      }
      
<<<<<<< HEAD
      if (data.confidence) {
        totalConfidence += data.confidence;
      }

      // Últimas 10 interacciones
      if (recentInteractions.length < 10) {
        recentInteractions.push({
          id: doc.id,
          questionId: data.questionId,
          voiceText: data.voiceText,
          confidence: data.confidence,
          isValid: data.metadata?.isValid || false,
          timestamp: data.timestamp
        });
      }
    });

    const accuracy = totalAttempts > 0 ? (successfulRecognitions / totalAttempts) * 100 : 0;
    const averageConfidence = totalAttempts > 0 ? totalConfidence / totalAttempts : 0;
=======
      if (data.confidence && typeof data.confidence === 'number') {
        totalConfidence += data.confidence;
      }
    });

    if (totalAttempts > 0) {
      averageConfidence = totalConfidence / totalAttempts;
    }
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e

    res.json({
      totalAttempts,
      successfulRecognitions,
<<<<<<< HEAD
      accuracy: Math.round(accuracy * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      recentInteractions: recentInteractions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
=======
      successRate: totalAttempts > 0 ? (successfulRecognitions / totalAttempts) * 100 : 0,
      averageConfidence: Math.round(averageConfidence * 100) / 100
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
    });
  } catch (error) {
    console.error('Error getting voice recognition stats:', error);
    res.status(500).json({ error: error.message });
  }
};

<<<<<<< HEAD

// [HU8] Procesar audio con AssemblyAI
exports.processAudioWithAssemblyAI = async (req, res) => {
  const { userId, questionId, audioUrl, questionOptions, gameId } = req.body;
  
  try {
    // Validaciones básicas
    if (!userId || !questionId || !audioUrl) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, questionId, audioUrl' 
      });
    }

    if (!questionOptions || !Array.isArray(questionOptions)) {
      return res.status(400).json({ 
        error: 'questionOptions must be an array' 
      });
    }

    // Procesar audio con AssemblyAI
    const result = await assemblyAI.processVoiceAnswer(audioUrl, questionOptions);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        suggestions: result.suggestions
      });
    }

    // Registrar interacción de voz
    await db.collection('voiceInteractions').add({
      userId,
      questionId,
      gameId: gameId || null,
      action: 'voice_answer_assemblyai',
      voiceText: result.text,
      confidence: result.confidence,
      timestamp: new Date(),
      metadata: {
        matchedOption: result.validation.matchedOption,
        isValid: result.validation.isValid,
        questionOptions: questionOptions,
        assemblyAIUsed: true,
        audioUrl: audioUrl
      }
    });
    
    res.json({ 
      success: result.validation.isValid,
      text: result.text,
      confidence: result.confidence,
      matchedOption: result.validation.matchedOption,
      answerIndex: result.validation.answerIndex,
      suggestions: result.suggestions
    });
  } catch (error) {
    console.error('Error processing audio with AssemblyAI:', error);
    res.status(500).json({ error: error.message });
  }
};

// [HU8] Verificar estado de AssemblyAI
exports.checkAssemblyAIStatus = async (req, res) => {
  try {
    const status = await assemblyAI.checkAPIStatus();
    res.json(status);
  } catch (error) {
    console.error('Error checking AssemblyAI status:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

module.exports = exports;
=======
// [HU8] Algoritmo de coincidencia de respuestas de voz
function matchVoiceResponse(voiceText, options) {
  if (!voiceText || typeof voiceText !== 'string' || !Array.isArray(options)) {
    return {
      isValid: false,
      matchedOption: null,
      answerIndex: null,
      confidence: 0.0
    };
  }

  const normalizedVoice = voiceText.toLowerCase().trim();
  
  // Buscar coincidencias directas con las opciones
  for (let i = 0; i < options.length; i++) {
    const option = options[i];
    if (!option || typeof option !== 'string') continue;
    
    const normalizedOption = option.toLowerCase().trim();
    
    // Coincidencia exacta
    if (normalizedVoice === normalizedOption) {
      return {
        isValid: true,
        matchedOption: option,
        answerIndex: i,
        confidence: 1.0
      };
    }
    
    // Coincidencia parcial (contiene la opción)
    if (normalizedVoice.includes(normalizedOption) || normalizedOption.includes(normalizedVoice)) {
      return {
        isValid: true,
        matchedOption: option,
        answerIndex: i,
        confidence: 0.8
      };
    }
  }
  
  // Buscar coincidencias por letras (A, B, C, D)
  const letterMatch = normalizedVoice.match(/\b([a-d])\b/);
  if (letterMatch) {
    const letter = letterMatch[1];
    const index = letter.charCodeAt(0) - 'a'.charCodeAt(0);
    
    if (index >= 0 && index < options.length) {
      return {
        isValid: true,
        matchedOption: options[index],
        answerIndex: index,
        confidence: 0.9
      };
    }
  }
  
  // Buscar coincidencias por posición (primera, segunda, etc.)
  const positionMatch = normalizedVoice.match(/\b(primera|segunda|tercera|cuarta|primero|segundo|tercero|cuarto|uno|dos|tres|cuatro)\b/);
  if (positionMatch) {
    const position = positionMatch[1];
    let index = -1;
    
    switch (position) {
      case 'primera':
      case 'primero':
      case 'uno':
        index = 0;
        break;
      case 'segunda':
      case 'segundo':
      case 'dos':
        index = 1;
        break;
      case 'tercera':
      case 'tercero':
      case 'tres':
        index = 2;
        break;
      case 'cuarta':
      case 'cuarto':
      case 'cuatro':
        index = 3;
        break;
    }
    
    if (index >= 0 && index < options.length) {
      return {
        isValid: true,
        matchedOption: options[index],
        answerIndex: index,
        confidence: 0.85
      };
    }
  }
  
  // Buscar coincidencias por números (1, 2, 3, 4)
  const numberMatch = normalizedVoice.match(/\b([1-4])\b/);
  if (numberMatch) {
    const number = parseInt(numberMatch[1]);
    const index = number - 1;
    
    if (index >= 0 && index < options.length) {
      return {
        isValid: true,
        matchedOption: options[index],
        answerIndex: index,
        confidence: 0.9
      };
    }
  }
  
  // No se encontró coincidencia
  return {
    isValid: false,
    matchedOption: null,
    answerIndex: null,
    confidence: 0.0
  };
}

// Exportar función para pruebas
module.exports.matchVoiceResponse = matchVoiceResponse;
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e

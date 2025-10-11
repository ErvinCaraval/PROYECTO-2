const { db } = require('../firebase');
const assemblyAI = require('../services/assemblyAIService');

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
    const validation = matchVoiceResponse(voiceResponse, questionOptions);
    
    // Registrar interacción de voz
    await db.collection('voiceInteractions').add({
      userId,
      questionId,
      gameId: gameId || null,
      action: 'voice_answer',
      voiceText: voiceResponse,
      confidence: validation.confidence,
      timestamp: new Date(),
      metadata: {
        matchedOption: validation.matchedOption,
        isValid: validation.isValid,
        questionOptions: questionOptions
      }
    });
    
    res.json({ 
      valid: validation.isValid, 
      matchedOption: validation.matchedOption,
      confidence: validation.confidence,
      answerIndex: validation.answerIndex
    });
  } catch (error) {
    console.error('Error validating voice response:', error);
    res.status(500).json({ error: error.message });
  }
};

// [HU8] Procesar respuesta de voz y convertir a formato de juego
exports.processVoiceResponse = async (req, res) => {
  const { userId, questionId, voiceResponse, questionOptions, gameId } = req.body;
  
  try {
    const validation = await this.validateVoiceResponse(req, res);
    
    if (validation.status === 200) {
      const responseData = validation.data;
      
      // Si la respuesta es válida, devolver el índice de la opción
      if (responseData.valid) {
        res.json({
          success: true,
          answerIndex: responseData.answerIndex,
          answerValue: responseData.matchedOption,
          confidence: responseData.confidence
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No se pudo reconocer la respuesta de voz',
          suggestions: generateSuggestions(questionOptions)
        });
      }
    }
  } catch (error) {
    console.error('Error processing voice response:', error);
    res.status(500).json({ error: error.message });
  }
};

// [HU8] Obtener estadísticas de reconocimiento de voz para un usuario
exports.getVoiceRecognitionStats = async (req, res) => {
  const { userId } = req.params;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const snapshot = await db.collection('voiceInteractions')
      .where('userId', '==', userId)
      .where('action', '==', 'voice_answer')
      .get();

    let totalAttempts = 0;
    let successfulRecognitions = 0;
    let totalConfidence = 0;
    const recentInteractions = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      totalAttempts++;
      
      if (data.metadata && data.metadata.isValid) {
        successfulRecognitions++;
      }
      
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

    res.json({
      totalAttempts,
      successfulRecognitions,
      accuracy: Math.round(accuracy * 100) / 100,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      recentInteractions: recentInteractions.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      )
    });
  } catch (error) {
    console.error('Error getting voice recognition stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Función auxiliar para hacer coincidir respuestas de voz con opciones
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
const axios = require('axios');

class AssemblyAIService {
  constructor() {
    this.apiKey = '456664d7a27245c78350da6ebff598a5';
    this.baseURL = 'https://api.assemblyai.com/v2';
    this.headers = {
      'authorization': this.apiKey,
      'content-type': 'application/json'
    };
  }

  /**
   * [HU8] Transcribir audio a texto usando AssemblyAI
   * @param {string} audioUrl - URL del archivo de audio
   * @param {Object} options - Opciones de transcripción
   * @returns {Promise<Object>} - Resultado de la transcripción
   */
  async transcribeAudio(audioUrl, options = {}) {
    try {
      const defaultOptions = {
        audio_url: audioUrl,
        language_code: 'es', // Español por defecto
        punctuate: true,
        format_text: true,
        speaker_labels: false,
        auto_highlights: false,
        sentiment_analysis: false,
        entity_detection: false,
        ...options
      };

      const response = await axios.post(
        `${this.baseURL}/transcript`,
        defaultOptions,
        { headers: this.headers }
      );

      return {
        success: true,
        transcriptId: response.data.id,
        status: response.data.status,
        data: response.data
      };
    } catch (error) {
      console.error('Error transcribing audio:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * [HU8] Obtener resultado de transcripción por ID
   * @param {string} transcriptId - ID de la transcripción
   * @returns {Promise<Object>} - Resultado de la transcripción
   */
  async getTranscript(transcriptId) {
    try {
      const response = await axios.get(
        `${this.baseURL}/transcript/${transcriptId}`,
        { headers: this.headers }
      );

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error getting transcript:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * [HU8] Transcribir audio y esperar resultado completo
   * @param {string} audioUrl - URL del archivo de audio
   * @param {Object} options - Opciones de transcripción
   * @param {number} maxWaitTime - Tiempo máximo de espera en ms (default: 30000)
   * @returns {Promise<Object>} - Resultado completo de la transcripción
   */
  async transcribeAndWait(audioUrl, options = {}, maxWaitTime = 30000) {
    try {
      // Iniciar transcripción
      const transcriptResult = await this.transcribeAudio(audioUrl, options);
      
      if (!transcriptResult.success) {
        return transcriptResult;
      }

      const transcriptId = transcriptResult.transcriptId;
      const startTime = Date.now();

      // Polling hasta que esté completo
      while (Date.now() - startTime < maxWaitTime) {
        const result = await this.getTranscript(transcriptId);
        
        if (!result.success) {
          return result;
        }

        const { status, text, confidence, words } = result.data;

        if (status === 'completed') {
          return {
            success: true,
            text: text,
            confidence: confidence,
            words: words,
            duration: result.data.audio_duration,
            language: result.data.language_code,
            data: result.data
          };
        } else if (status === 'error') {
          return {
            success: false,
            error: 'Transcription failed'
          };
        }

        // Esperar 1 segundo antes del siguiente poll
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return {
        success: false,
        error: 'Transcription timeout'
      };
    } catch (error) {
      console.error('Error in transcribeAndWait:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * [HU8] Procesar respuesta de voz para el juego
   * @param {string} audioUrl - URL del archivo de audio
   * @param {Array} questionOptions - Opciones de la pregunta
   * @returns {Promise<Object>} - Resultado procesado para el juego
   */
  async processVoiceAnswer(audioUrl, questionOptions) {
    try {
      const result = await this.transcribeAndWait(audioUrl, {
        language_code: 'es',
        punctuate: true,
        format_text: true
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          suggestions: this.generateSuggestions(questionOptions)
        };
      }

      // Usar el algoritmo de coincidencia del juego
      const { matchVoiceResponse } = require('../hybridServer');
      const validation = matchVoiceResponse(result.text, questionOptions);

      return {
        success: validation.isValid,
        text: result.text,
        confidence: result.confidence,
        validation: validation,
        suggestions: validation.isValid ? [] : this.generateSuggestions(questionOptions)
      };
    } catch (error) {
      console.error('Error processing voice answer:', error);
      return {
        success: false,
        error: error.message,
        suggestions: this.generateSuggestions(questionOptions)
      };
    }
  }

  /**
   * [HU8] Generar sugerencias para respuestas no reconocidas
   * @param {Array} questionOptions - Opciones de la pregunta
   * @returns {Array} - Lista de sugerencias
   */
  generateSuggestions(questionOptions) {
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

  /**
   * [HU8] Verificar estado de la API
   * @returns {Promise<Object>} - Estado de la API
   */
  async checkAPIStatus() {
    try {
      const response = await axios.get(
        `${this.baseURL}/transcript`,
        { 
          headers: this.headers,
          params: { limit: 1 }
        }
      );

      return {
        success: true,
        status: 'API is working',
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new AssemblyAIService();
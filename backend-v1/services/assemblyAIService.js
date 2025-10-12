const axios = require('axios');

class AssemblyAIService {
  constructor() {
<<<<<<< HEAD
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
=======
    this.apiKey = process.env.ASSEMBLYAI_API_KEY;
    this.baseURL = 'https://api.assemblyai.com/v2';
    
    if (!this.apiKey) {
      console.warn('ASSEMBLYAI_API_KEY not found in environment variables');
    }
  }

  // [HU8] Text-to-Speech usando AssemblyAI
  async textToSpeech(text, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('AssemblyAI API key not configured');
      }

      const response = await axios.post(`${this.baseURL}/text-to-speech`, {
        text: text,
        voice: options.voice || 'es-ES-EnriqueNeural',
        speed: options.speed || 1.0,
        format: options.format || 'mp3'
      }, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        audioUrl: response.data.audio_url,
        duration: response.data.duration,
        format: response.data.format
      };
    } catch (error) {
      console.error('AssemblyAI TTS Error:', error.response?.data || error.message);
      throw new Error(`TTS Error: ${error.response?.data?.error || error.message}`);
    }
  }

  // [HU8] Speech-to-Text usando AssemblyAI
  async speechToText(audioUrl, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('AssemblyAI API key not configured');
      }

      // Subir audio para transcripción
      const uploadResponse = await axios.post(`${this.baseURL}/upload`, {
        audio_url: audioUrl
      }, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const uploadId = uploadResponse.data.upload_url;

      // Iniciar transcripción
      const transcriptResponse = await axios.post(`${this.baseURL}/transcript`, {
        audio_url: uploadId,
        language_code: options.language || 'es',
        punctuate: options.punctuate !== false,
        format_text: options.formatText !== false,
        speaker_labels: options.speakerLabels || false
      }, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const transcriptId = transcriptResponse.data.id;

      // Polling para obtener resultado
      let attempts = 0;
      const maxAttempts = 30; // 30 segundos máximo
      
      while (attempts < maxAttempts) {
        const statusResponse = await axios.get(`${this.baseURL}/transcript/${transcriptId}`, {
          headers: {
            'Authorization': this.apiKey
          }
        });

        const status = statusResponse.data.status;
        
        if (status === 'completed') {
          return {
            success: true,
            text: statusResponse.data.text,
            confidence: statusResponse.data.confidence,
            words: statusResponse.data.words,
            duration: statusResponse.data.audio_duration
          };
        } else if (status === 'error') {
          throw new Error(`Transcription failed: ${statusResponse.data.error}`);
        }

        // Esperar 1 segundo antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      throw new Error('Transcription timeout');
    } catch (error) {
      console.error('AssemblyAI STT Error:', error.response?.data || error.message);
      throw new Error(`STT Error: ${error.response?.data?.error || error.message}`);
    }
  }

  // [HU8] Procesar audio directamente (base64)
  async processAudio(audioBase64, options = {}) {
    try {
      if (!this.apiKey) {
        throw new Error('AssemblyAI API key not configured');
      }

      // Convertir base64 a buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');

      // Subir audio
      const uploadResponse = await axios.post(`${this.baseURL}/upload`, audioBuffer, {
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/octet-stream'
        }
      });

      const uploadUrl = uploadResponse.data.upload_url;

      // Procesar con speechToText
      return await this.speechToText(uploadUrl, options);
    } catch (error) {
      console.error('AssemblyAI Audio Processing Error:', error.response?.data || error.message);
      throw new Error(`Audio Processing Error: ${error.response?.data?.error || error.message}`);
    }
  }

  // [HU8] Verificar si el servicio está disponible
  isAvailable() {
    return !!this.apiKey;
  }

  // [HU8] Obtener voces disponibles
  async getAvailableVoices() {
    try {
      if (!this.apiKey) {
        return { success: false, error: 'API key not configured' };
      }

      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'Authorization': this.apiKey
        }
      });

      return {
        success: true,
        voices: response.data.voices || []
      };
    } catch (error) {
      console.error('AssemblyAI Voices Error:', error.response?.data || error.message);
>>>>>>> cursor/revisar-readme-y-verificar-funcionalidades-2a5e
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new AssemblyAIService();
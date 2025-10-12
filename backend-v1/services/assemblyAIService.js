const axios = require('axios');

class AssemblyAIService {
  constructor() {
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
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new AssemblyAIService();
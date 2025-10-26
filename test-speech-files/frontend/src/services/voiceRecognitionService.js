import { fetchWithRetry } from './api';

class AssemblyAIVoiceRecognitionService {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    this.stream = null;
  }

  isAvailable() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }

  isListening() {
    return this.isRecording;
  }

  async start() {
    if (!this.isAvailable()) {
      throw new Error('La grabación de audio no está soportada en este navegador.');
    }

    if (this.isRecording) {
      console.warn('AssemblyAI: La grabación ya está en progreso.');
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstart = () => {
        this.isRecording = true;
        console.log('AssemblyAI: Grabación iniciada.');
      };

      this.mediaRecorder.start();
    } catch (error) {
      console.error('AssemblyAI: Error al iniciar la grabación:', error);
      throw new Error('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
    }
  }

  stop() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        return reject('No hay ninguna grabación en progreso.');
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        console.log('AssemblyAI: Grabación detenida.');

        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Audio = reader.result.split(',')[1];
          
          try {
            console.log('AssemblyAI: Enviando audio al backend para transcripción...');
            const response = await fetchWithRetry(`${this.apiBase}/api/voice-interactions/process-audio`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ audioBase64: base64Audio, mimeType: 'audio/webm' })
            });
            console.log('Respuesta del backend:', response);

            if (response.success) {
              console.log('AssemblyAI: Transcripción recibida:', response.text);
              resolve({ 
                transcript: response.text || '',
                audioBase64: base64Audio,
                audioMimeType: 'audio/webm',
                assemblyAIResult: {
                  success: true,
                  text: response.text,
                  confidence: response.confidence,
                  language: response.language
                }
              });
            } else {
              console.error('AssemblyAI: Error en la transcripción:', response.error);
              reject(new Error(response.error || 'Error en el servidor al transcribir el audio.'));
            }
          } catch (error) {
            console.error('AssemblyAI: Error al enviar el audio al backend:', error);
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error('Error al leer el archivo de audio.'));
        };

        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.stop();
      this.stream.getTracks().forEach(track => track.stop());
    });
  }

  cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }
}

export default new AssemblyAIVoiceRecognitionService();
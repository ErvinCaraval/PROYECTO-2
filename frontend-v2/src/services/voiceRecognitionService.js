// Voice Recognition Service - Speech-to-Text functionality
class VoiceRecognitionService {
  constructor() {
    this.isWebSpeechRecognitionAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    this.recognition = null;
    this.isListening = false;
    this.settings = {
      language: 'es-ES',
      continuous: false,
      interimResults: false,
      maxAlternatives: 1
    };
    
    // Lazy initialization to avoid constructing outside of a user gesture
    // Some browsers are picky about initialization timing
  }

  initializeRecognition() {
    if (!this.isWebSpeechRecognitionAvailable) {
      console.warn('Web Speech Recognition API not available');
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
    } catch (error) {
      console.error('Failed to initialize SpeechRecognition:', error);
      this.recognition = null;
    }
  }

  ensureInitialized() {
    if (!this.recognition) {
      this.initializeRecognition();
    }
    return this.recognition != null;
  }

  async recognizeAnswer(questionOptions = []) {
    if (!this.isWebSpeechRecognitionAvailable) {
      throw new Error('Reconocimiento de voz no disponible en este navegador');
    }

    // Must be secure context for mic permissions on most browsers
    const isSecure = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecure) {
      throw new Error('Se requiere sitio seguro (https) para usar el micrófono');
    }

    if (this.isListening) {
      throw new Error('Recognition already in progress');
    }

    // Lazily (re)create recognizer
    if (!this.ensureInitialized()) {
      throw new Error('No se pudo inicializar el reconocimiento de voz');
    }

    return new Promise((resolve, reject) => {
      this.isListening = true;

      this.recognition.onstart = () => {
        console.log('Voice recognition started');
      };

      this.recognition.onresult = (event) => {
        try {
          const transcript = event.results[0][0].transcript.toLowerCase().trim();
          const confidence = event.results[0][0].confidence;
          console.log('Recognized:', transcript, 'Confidence:', confidence);

          // Palabras clave para detener
          const stopWords = ['parar', 'detener', 'cancelar', 'stop', 'terminar'];
          if (stopWords.some(word => transcript.includes(word))) {
            this.stopRecognition();
            resolve({ transcript, confidence, matchedOption: null, matchedIndex: -1, isValid: false, stopped: true });
            return;
          }

          // Match the transcript with question options
          const matchedResult = this.matchAnswer(transcript, questionOptions);

          // Si solo hay una opción y la reconoce, selecciona automáticamente
          if (questionOptions.length === 1 && matchedResult.isValid) {
            this.stopRecognition();
            resolve({ transcript, confidence, matchedOption: matchedResult.option, matchedIndex: matchedResult.index, isValid: true, autoSelected: true });
            return;
          }

          // Si reconoce una respuesta válida, detener reconocimiento
          if (matchedResult.isValid) {
            this.stopRecognition();
            resolve({ transcript, confidence, matchedOption: matchedResult.option, matchedIndex: matchedResult.index, isValid: true });
            return;
          }

          resolve({ transcript, confidence, matchedOption: matchedResult.option, matchedIndex: matchedResult.index, isValid: false });
        } catch (error) {
          reject(error);
        }
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.error('Recognition error:', event.error);
        
        let errorMessage = 'Error en el reconocimiento de voz';
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No se detectó voz. Intenta hablar más fuerte.';
            break;
          case 'audio-capture':
            errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
            break;
          case 'not-allowed':
            errorMessage = 'Permisos de micrófono denegados. Permite el acceso al micrófono.';
            break;
          case 'network':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'aborted':
            errorMessage = 'Reconocimiento cancelado.';
            break;
          default:
            errorMessage = `Error de reconocimiento: ${event.error}`;
        }
        
        reject(new Error(errorMessage));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        console.log('Voice recognition ended');
      };

      // Start recognition
      try {
        // Prompt for mic permission proactively when possible
        if (navigator?.mediaDevices?.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              stream.getTracks().forEach(t => t.stop());
              this.recognition.start();
            })
            .catch(() => {
              this.isListening = false;
              reject(new Error('Permiso de micrófono denegado o no disponible'));
            });
        } else {
          this.recognition.start();
        }
      } catch (error) {
        this.isListening = false;
        reject(new Error('No se pudo iniciar el reconocimiento de voz'));
      }
    });
  }

  matchAnswer(transcript, questionOptions) {
    if (!questionOptions || questionOptions.length === 0) {
      return { option: transcript, index: -1, isValid: false };
    }

    // Direct letter matches: "a", "b", "c", "d"
    const letterMatch = transcript.match(/^([a-d])$/);
    if (letterMatch) {
      const letter = letterMatch[1].toUpperCase();
      const index = letter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (index >= 0 && index < questionOptions.length) {
        return {
          option: questionOptions[index],
          index: index,
          isValid: true
        };
      }
    }

    // Position matches: "primera", "segunda", "tercera", "cuarta"
    const positionPatterns = [
      /primera|primero|uno|1/,
      /segunda|segundo|dos|2/,
      /tercera|tercero|tres|3/,
      /cuarta|cuarto|cuatro|4/
    ];

    for (let i = 0; i < positionPatterns.length && i < questionOptions.length; i++) {
      if (positionPatterns[i].test(transcript)) {
        return {
          option: questionOptions[i],
          index: i,
          isValid: true
        };
      }
    }

    // Partial text matches
    for (let i = 0; i < questionOptions.length; i++) {
      const option = questionOptions[i].toLowerCase();
      const words = option.split(' ');
      
      // Check if transcript contains key words from the option
      const matchingWords = words.filter(word => 
        word.length > 3 && transcript.includes(word)
      );
      
      if (matchingWords.length >= Math.min(2, words.length / 2)) {
        return {
          option: questionOptions[i],
          index: i,
          isValid: true
        };
      }
    }

    // No match found
    return {
      option: transcript,
      index: -1,
      isValid: false
    };
  }

  stopRecognition() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      this.recognition.continuous = this.settings.continuous;
      this.recognition.interimResults = this.settings.interimResults;
      this.recognition.maxAlternatives = this.settings.maxAlternatives;
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  isAvailable() {
    // Must have API and be in a secure context for mic
    const isSecure = (typeof window !== 'undefined') && (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    return this.isWebSpeechRecognitionAvailable && isSecure;
  }

  getStatus() {
    return {
      isAvailable: this.isWebSpeechRecognitionAvailable,
      isListening: this.isListening,
      language: this.settings.language,
      settings: this.settings
    };
  }

  // Helper method to validate microphone permissions
  async checkMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error('Microphone permission error:', error);
      return false;
    }
  }

  // Helper method to get available languages
  getAvailableLanguages() {
    // This is a simplified list - in a real implementation, you might want to
    // get this from the browser's supported languages
    return [
      { code: 'es-ES', name: 'Español (España)' },
      { code: 'es-MX', name: 'Español (México)' },
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'fr-FR', name: 'Français' },
      { code: 'de-DE', name: 'Deutsch' },
      { code: 'it-IT', name: 'Italiano' },
      { code: 'pt-BR', name: 'Português (Brasil)' }
    ];
  }
}

// Create singleton instance
const voiceRecognitionService = new VoiceRecognitionService();

export default voiceRecognitionService;

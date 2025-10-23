// Voice Service - Text-to-Speech functionality
class VoiceService {
  constructor() {
    this.isWebSpeechAvailable = 'speechSynthesis' in window;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.settings = {
      rate: 1.0,
      volume: 1.0,
      pitch: 1.0,
      voiceName: null, // Solo el nombre de la voz
      language: 'es-ES'
    };
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Load available voices
    this.loadVoices();
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('voiceSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('Error loading voice settings:', error);
    }
  }

  saveSettings() {
    try {
  localStorage.setItem('voiceSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Error saving voice settings:', error);
    }
  }

  loadVoices() {
    if (!this.isWebSpeechAvailable) return;
    
    // Load voices when they become available
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      this.availableVoices = voices;
      // Buscar la voz específica de Google Español de Estados Unidos (es-US)
      const googleEsUsVoice = voices.find(
        (voice) =>
          (voice.name === 'Google Español de Estados Unidos' || voice.name === 'Google US Spanish' || (voice.name.includes('Google') && voice.lang === 'es-US'))
      );
      if (googleEsUsVoice && !this.settings.voiceName) {
        this.settings.voiceName = googleEsUsVoice.name;
        this.saveSettings();
        return;
      }
      // Si no está, buscar cualquier voz en español
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') || voice.lang.includes('ES')
      );
      if (spanishVoice && !this.settings.voiceName) {
        this.settings.voiceName = spanishVoice.name;
        this.saveSettings();
      }
    };

    // Load voices immediately if available
    loadVoices();
    
    // Also load when voices change
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speak(text, options = {}) {
    if (!this.isWebSpeechAvailable) {
      console.warn('Web Speech API not available');
      return Promise.reject(new Error('Web Speech API not available'));
    }

    // Si el mensaje es feedback de respuesta, esperar a que termine el anterior antes de hablar
    const isFeedback = options && options.action === 'answer_result';
    const speakPromise = () => new Promise((resolve, reject) => {
      // Stop any current speech SOLO si no es feedback, o si no hay nada hablando
      if (!isFeedback || !this.isSpeaking) {
        this.stop();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      // Apply settings
      utterance.rate = options.rate || this.settings.rate;
      utterance.volume = options.volume || this.settings.volume;
      utterance.pitch = options.pitch || this.settings.pitch;
      utterance.lang = options.language || this.settings.language;

      // Set voice if available
      let voiceToUse = null;
      const voices = this.getAvailableVoices();
      if (options.voiceName) {
        voiceToUse = voices.find(v => v.name === options.voiceName);
      } else if (this.settings.voiceName) {
        voiceToUse = voices.find(v => v.name === this.settings.voiceName);
      }
      if (voiceToUse) {
        utterance.voice = voiceToUse;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.currentUtterance = utterance;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      speechSynthesis.speak(utterance);
    });

    if (isFeedback && this.isSpeaking) {
      // Esperar a que termine la locución actual antes de hablar feedback
      return new Promise((resolve, reject) => {
        const wait = () => {
          if (!this.isSpeaking) {
            speakPromise().then(resolve).catch(reject);
          } else {
            setTimeout(wait, 100);
          }
        };
        wait();
      });
    } else {
      return speakPromise();
    }
  }

  stop() {
    if (this.isWebSpeechAvailable && speechSynthesis.speaking) {
      speechSynthesis.cancel();
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  pause() {
    if (this.isWebSpeechAvailable && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  }

  resume() {
    if (this.isWebSpeechAvailable && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  updateSettings(newSettings) {
    // Si viene un objeto de voz, solo guardar el nombre
    const settingsToSave = { ...newSettings };
    if (settingsToSave.voice && settingsToSave.voice.name) {
      settingsToSave.voiceName = settingsToSave.voice.name;
      delete settingsToSave.voice;
    }
    this.settings = { ...this.settings, ...settingsToSave };
    this.saveSettings();
  }

  getSettings() {
  return { ...this.settings };
  }

  getAvailableVoices() {
    return this.availableVoices || [];
  }

  isAvailable() {
    return this.isWebSpeechAvailable;
  }

  getStatus() {
    return {
      isAvailable: this.isWebSpeechAvailable,
      isSpeaking: this.isSpeaking,
      isPaused: this.isWebSpeechAvailable ? speechSynthesis.paused : false,
      settings: this.getSettings(),
      availableVoices: this.getAvailableVoices().length
    };
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;

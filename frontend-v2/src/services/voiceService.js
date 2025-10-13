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
      voice: null,
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
      
      // Try to find a Spanish voice
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') || voice.lang.includes('ES')
      );
      
      if (spanishVoice && !this.settings.voice) {
        this.settings.voice = spanishVoice;
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

    return new Promise((resolve, reject) => {
      // Stop any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      utterance.rate = options.rate || this.settings.rate;
      utterance.volume = options.volume || this.settings.volume;
      utterance.pitch = options.pitch || this.settings.pitch;
      utterance.lang = options.language || this.settings.language;
      
      // Set voice if available
      if (this.settings.voice) {
        utterance.voice = this.settings.voice;
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
    this.settings = { ...this.settings, ...newSettings };
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

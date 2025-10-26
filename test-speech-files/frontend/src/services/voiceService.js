// Voice Service - Azure Text-to-Speech functionality
class VoiceService {
  constructor() {
    this.isWebSpeechAvailable = true; // Siempre disponible ya que usamos Azure
    this.audioElement = null;
    this.isSpeaking = false;
    this.settings = {
      rate: 1.0,
      volume: 1.0,
      pitch: 1.0,
      voiceName: null,
      language: 'es-ES'
    };
    
    // Configurar la URL base del backend
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://proyecto-2-2.onrender.com'
      : 'http://localhost:5000';
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Initialize audio element
    this.initAudioElement();
    
    // Load available voices
    setTimeout(() => {
      this.loadVoices();
    }, 1000);
  }

  async getAuthToken() {
    try {
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
    } catch (error) {
      console.error('Error getting Firebase token:', error);
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token available");
    }
    return token;
  }

  async getAuthHeaders() {
    const token = await this.getAuthToken();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  }

  async checkBackendConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      console.log('Backend connection status:', data);
      if (!data.services.includes('tts')) {
        console.warn('TTS service not available in backend');
      }
    } catch (error) {
      console.error('Failed to connect to backend:', error);
    }
  }

  initAudioElement() {
    this.audioElement = new Audio();
    
    this.audioElement.onplay = () => {
      console.log('Audio playback started');
      this.isSpeaking = true;
    };
    
    this.audioElement.onended = () => {
      console.log('Audio playback completed');
      this.isSpeaking = false;
    };
    
    this.audioElement.onerror = (e) => {
      this.isSpeaking = false;
      const error = e.target.error;
      console.error('Audio playback error:', {
        code: error.code,
        message: error.message,
        name: error.name,
        details: {
          currentSrc: this.audioElement.currentSrc,
          readyState: this.audioElement.readyState,
          networkState: this.audioElement.networkState
        }
      });
    };
  }

  async speak(text, options = {}) {
    if (!text) return;
    
    if (this.isSpeaking) {
      await this.stop();
    }

    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/tts`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          text,
          voice: this.settings.voiceName,
          language: this.settings.language,
          ...options
        })
      });

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.audioElement.src = audioUrl;
      await this.audioElement.play();

    } catch (error) {
      console.error('Error in speak:', error);
      throw error;
    }
  }

  async stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.isSpeaking = false;
    }
  }

  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('voiceSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  }

  async loadVoices() {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}/api/tts/voices`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }

      const voices = await response.json();
      this.availableVoices = voices;
      
      // Set default voice if none selected
      if (!this.settings.voiceName && voices.length > 0) {
        this.settings.voiceName = voices[0].name;
        this.saveSettings();
      }

    } catch (error) {
      console.error('Error loading voices:', error);
      this.availableVoices = [];
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('voiceSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving voice settings:', error);
    }
  }
}

export default new VoiceService();
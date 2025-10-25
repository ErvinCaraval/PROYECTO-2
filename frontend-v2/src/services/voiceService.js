import { auth } from './firebase';
import AudioLock from '../utils/audioLock';

// Voice Service - Text-to-Speech functionality
class VoiceService {
  constructor() {
    // We'll use Azure TTS via backend by default
    this.useAzure = true;
    this.currentAudio = null;
    this.currentAudioUrl = null;
    this.isSpeaking = false;
    this.audioLock = new AudioLock(); // Lock para control de reproducción
    this.availableVoices = [];
    this.voicesPromise = null;
    
    this.settings = {
      rate: 1.0,
      volume: 1.0,
      pitch: 1.0,
      voiceName: 'es-ES-ElviraNeural',
      language: 'es-ES',
      gender: 'Female',
      lastVoiceMale: 'es-ES-AlvaroNeural',
      lastVoiceFemale: 'es-ES-ElviraNeural'
    };
    
    // Dedupe control: evitar reproducir el mismo texto varias veces en un corto periodo
    this.lastSpokenText = null;
    this.lastSpokenAt = 0;
    this.dedupeWindowMs = 1000; // 1 segundo
    
    // Load settings from localStorage
    this.loadSettings();
    
    // Initialize voices loading
    this.initializeVoices();
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

  initializeVoices() {
    // Solo inicializar la promesa si no existe
    if (!this.voicesPromise) {
      this.voicesPromise = this._fetchVoices().catch(error => {
        console.error('Error initializing voices:', error);
        this.voicesPromise = null;
        return [];
      });
    }
    return this.voicesPromise;
  }

  async loadVoices() {
    try {
      const voices = await this.initializeVoices();
      this.availableVoices = voices;
      return voices;
    } catch (error) {
      console.error('Error loading voices:', error);
      return [];
    }
  }

  async _fetchVoices() {
    try {
      // Load voices from backend Azure endpoint
      const rawBase = import.meta.env.VITE_API_URL || '';
      const base = rawBase ? rawBase.replace(/\/$/, '') : '';
      // Prefer <base>/api/azure/voices but try <base>/azure/voices as fallback if server uses no /api prefix
      const primaryPath = base.endsWith('/api') ? `${base}/azure/voices` : (base ? `${base}/api/azure/voices` : '/api/azure/voices');
      const fallbackPath = base ? `${base}/azure/voices` : '/azure/voices';
      
      const result = await this._tryFetchVoices(primaryPath, fallbackPath);
      if (result.ok && result.data.voices) {
        this.availableVoices = result.data.voices;
        
        // Si no hay voz guardada o es de Google, usar Elvira por defecto
        if (!this.settings.voiceName || this.settings.voiceName.toLowerCase().includes('google')) {
          this.settings.voiceName = 'es-ES-ElviraNeural';
          this.saveSettings();
        }
        
        return this.availableVoices;
      } else {
        console.warn('Failed to load voices:', result.error || result.body || 'unknown error');
        return [];
      }
    } catch (error) {
      console.error('Error in _fetchVoices:', error);
      return [];
    }
  }

  async _tryFetchVoices(primaryPath, fallbackPath) {
    const fetchVoices = async (url) => {
      try {
        const headers = {
          'Content-Type': 'application/json',
        };
        // Get token from Firebase Auth if available
        const tokenResult = await auth.currentUser?.getIdToken();
        if (tokenResult) {
          headers.Authorization = `Bearer ${tokenResult}`;
        }
        
        const resp = await fetch(url, { 
          method: 'GET', 
          headers, 
          credentials: 'include' 
        });
        
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          return { 
            ok: false, 
            status: resp.status, 
            url: url, 
            body: text 
          };
        }
        
        const data = await resp.json();
        return { ok: true, data };
      } catch (err) {
        return { 
          ok: false, 
          error: err,
          url: url 
        };
      }
    };

    // Intentar primero la ruta principal
    let result = await fetchVoices(primaryPath);
    
    // Si falla con 404, intentar la ruta de fallback
    if (!result.ok && result.status === 404) {
      result = await fetchVoices(fallbackPath);
    }
    
    return result;
  }

  async speak(text, options = {}) {
    // Prevent immediate duplicates: if same text was just spoken and playback is (or was) active, ignore
    try {
      const now = Date.now();
      if (this.lastSpokenText === String(text) && (now - (this.lastSpokenAt || 0) < this.dedupeWindowMs) && (this.isSpeaking || this.currentAudio)) {
        // Ignore duplicate quick re-triggers (e.g., double-click or mouseover+click)
        return Promise.resolve();
      }
      // Adquirir el lock para reproducción exclusiva
      await this.audioLock.acquire();
      
        // Asegurarse de detener cualquier reproducción anterior
        try {
          if (!options.keepPlaying && this.currentAudio) {
            await this.stop();
          }
        } catch (stopError) {
          console.warn('Error stopping previous audio:', stopError);
      }
      
      // Si el mensaje es feedback de respuesta y hay algo reproduciéndose, esperar
      const isFeedback = options && options.action === 'answer_result';
      
      if (isFeedback && this.isSpeaking) {
        await new Promise(resolve => {
          const checkSpeaking = () => {
            if (!this.isSpeaking) {
              resolve();
            } else {
              setTimeout(checkSpeaking, 100);
            }
          };
          checkSpeaking();
        });
      }

      // Asegurarse de que cualquier audio anterior se haya detenido
      await this.stop();

      // Determinar la voz a usar
      let selectedVoice = this.settings.voiceName;
      
      if (options.voiceName) {
        selectedVoice = options.voiceName;
        // Actualizar última voz según género
        if (selectedVoice.includes('Alvaro')) {
          this.settings.lastVoiceMale = selectedVoice;
        } else if (selectedVoice.includes('Elvira')) {
          this.settings.lastVoiceFemale = selectedVoice;
        }
      }
      
      // Call backend Azure TTS endpoint con la configuración correcta
      const payload = {
        text,
        voiceName: selectedVoice,
        language: this.settings.language,
        format: 'audio-16khz-128kbitrate-mono-mp3'
      };

      try {
        const rawBase = import.meta.env.VITE_API_URL || '';
        const base = rawBase ? rawBase.replace(/\/$/, '') : '';
        const primaryPath = base.endsWith('/api') ? `${base}/azure/tts` : (base ? `${base}/api/azure/tts` : '/api/azure/tts');
        const fallbackPath = base ? `${base}/azure/tts` : '/azure/tts';

        const tryFetchTts = async (u) => {
          try {
            const headers = {
              'Content-Type': 'application/json'
            };
            // Get token from Firebase Auth
            const tokenResult = await auth.currentUser?.getIdToken();
            if (tokenResult) {
              headers.Authorization = `Bearer ${tokenResult}`;
            }
            const resp = await fetch(u, { method: 'POST', headers, body: JSON.stringify(payload) });
            if (!resp.ok) {
              const text = await resp.text().catch(() => '');
              return { ok: false, status: resp.status, url: resp.url, body: text };
            }
            const buffer = await resp.arrayBuffer();
            const contentType = resp.headers.get('Content-Type') || 'audio/mpeg';
            return { ok: true, buffer, contentType };
          } catch (err) {
            return { ok: false, error: err };
          }
        };

        let respResult = await tryFetchTts(primaryPath);
        if (!respResult.ok && respResult.status === 404) {
          respResult = await tryFetchTts(fallbackPath);
        }
        if (!respResult.ok) {
          if (respResult.error) console.warn('Azure TTS network error:', respResult.error);
          else console.warn('Azure TTS failed, status:', respResult.status, 'url:', respResult.url, 'body:', respResult.body);

          // Fallback: if Azure call fails, try Web Speech if available
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            return new Promise((resolve, reject) => {
              try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = options.rate || this.settings.rate;
                utterance.volume = options.volume || this.settings.volume;
                utterance.pitch = options.pitch || this.settings.pitch;
                utterance.lang = this.settings.language || options.language;
                utterance.onstart = () => { this.isSpeaking = true; this.lastSpokenText = String(text); this.lastSpokenAt = Date.now(); };
                utterance.onend = () => { this.isSpeaking = false; resolve(); };
                utterance.onerror = (e) => { this.isSpeaking = false; reject(new Error('Web Speech fallback error')); };
                speechSynthesis.speak(utterance);
              } catch (err) {
                reject(err);
              }
            });
          }

          throw new Error('Azure TTS failed: ' + (respResult.body || respResult.error || 'unknown'));
  }

  const arrayBuffer = respResult.buffer;
  const contentType = respResult.contentType;
  const blob = new Blob([arrayBuffer], { type: contentType });
  const urlObj = URL.createObjectURL(blob);

  this.currentAudioUrl = urlObj;

        // Crear un nuevo Audio y configurar sus propiedades
        return new Promise((resolve, reject) => {
          const audio = new Audio(urlObj);
          audio.volume = options.volume || this.settings.volume;
          audio.playbackRate = options.rate || this.settings.rate;

          audio.onplay = () => {
            this.isSpeaking = true;
            this.lastSpokenText = String(text);
            this.lastSpokenAt = Date.now();
          };

          audio.onended = () => {
            this.isSpeaking = false;
            if (this.currentAudio === audio) this.currentAudio = null;
            try { URL.revokeObjectURL(urlObj); } catch (e) { console.warn('Error revoking URL:', e); }
            this.audioLock.release();
            resolve();
          };

          audio.onerror = (e) => {
            this.isSpeaking = false;
            if (this.currentAudio === audio) this.currentAudio = null;
            try { URL.revokeObjectURL(urlObj); } catch (e) { console.warn('Error revoking URL:', e); }
            this.audioLock.release();
            reject(new Error('Audio playback error'));
          };

          this.currentAudio = audio;

          // Start playback
          audio.play().catch(err => {
            this.audioLock.release();
            reject(err);
          });
        });
      } catch (err) {
        this.audioLock.release();
        throw err;
      }
    } catch (error) {
      // Asegurarse de liberar el lock en caso de error
      this.audioLock.release();
      throw error;
    }
  }

  async stop() {
    // Stop Azure audio playback if exists
    try {
      if (this.currentAudio) {
        try { 
          // Detener inmediatamente la reproducción
          this.currentAudio.pause(); 
          this.currentAudio.currentTime = 0;
          // Remover eventos para prevenir callbacks
          this.currentAudio.onplay = null;
          this.currentAudio.onended = null;
          this.currentAudio.onerror = null;
        } catch (e) {
          console.warn('Error stopping audio:', e);
        }
        this.currentAudio = null;
      }
      if (this.currentAudioUrl) {
        try { 
          URL.revokeObjectURL(this.currentAudioUrl);
        } catch (e) {
          console.warn('Error revoking URL:', e);
        }
        this.currentAudioUrl = null;
      }
      // Also cancel any Web Speech synthesis if available
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (speechSynthesis.speaking || speechSynthesis.pending) {
          speechSynthesis.cancel();
        }
      }
    } finally {
      this.isSpeaking = false;
      // Liberar el lock
      if (this.audioLock) {
        this.audioLock.release();
      }
    }
    // Esperar un momento para asegurar que todo se ha detenido
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  pause() {
    if (this.currentAudio && !this.currentAudio.paused) {
      try { this.currentAudio.pause(); } catch (e) {}
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.speaking) {
      speechSynthesis.pause();
    }
  }

  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      try { this.currentAudio.play(); } catch (e) {}
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }

  updateSettings(newSettings) {
    const settingsToSave = { ...newSettings };
    
    // Si hay una voz seleccionada directamente
    if (settingsToSave.voice && settingsToSave.voice.name) {
      const voiceName = settingsToSave.voice.name;
      settingsToSave.voiceName = voiceName;
      
      // Determinar el género basado en la voz seleccionada
      if (voiceName.toLowerCase().includes('male') || voiceName.includes('Alvaro')) {
        settingsToSave.gender = 'Male';
        this.settings.lastVoiceMale = voiceName;
      } else if (voiceName.toLowerCase().includes('female') || voiceName.includes('Elvira')) {
        settingsToSave.gender = 'Female';
        this.settings.lastVoiceFemale = voiceName;
      }
      
      delete settingsToSave.voice;
    } 
    // Si se cambia el género manualmente
    else if (settingsToSave.gender) {
      const isChangingToMale = settingsToSave.gender === 'Male';
      // Asegurarse de que tenemos una voz válida guardada para el género
      const lastVoiceForGender = isChangingToMale ? 
        this.settings.lastVoiceMale : this.settings.lastVoiceFemale;
      
      // Solo actualizar la voz si hay una guardada válida para ese género
      if (lastVoiceForGender) {
        settingsToSave.voiceName = lastVoiceForGender;
      } else {
        // Si no hay voz guardada, usar las voces por defecto
        settingsToSave.voiceName = isChangingToMale ? 
          'es-ES-AlvaroNeural' : 'es-ES-ElviraNeural';
      }
    }
    
    this.settings = { ...this.settings, ...settingsToSave };

    this.saveSettings();
  }

  getSettings() {
  return { ...this.settings };
  }

  async getAvailableVoices() {
    try {
      // Si ya tenemos voces y son válidas, retornarlas
      if (this.availableVoices && this.availableVoices.length > 0) {
        return this.availableVoices;
      }
      
      // Si no hay voces, intentar cargarlas
      const voices = await this.loadVoices();
      
      // Si después de cargar seguimos sin voces, usar voces por defecto
      if (!voices || voices.length === 0) {
        const defaultVoices = [
          { 
            Name: 'es-ES-ElviraNeural',
            Locale: 'es-ES',
            Gender: 'Female',
            isDefault: true
          },
          {
            Name: 'es-ES-AlvaroNeural',
            Locale: 'es-ES',
            Gender: 'Male',
            isDefault: true
          }
        ];
        this.availableVoices = defaultVoices;
        return defaultVoices;
      }
      
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return this.availableVoices || [];
    }
  }

  isAvailable() {
    // Available if Azure backend is intended or Web Speech API exists
    if (this.useAzure) return true;
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  async getStatus() {
    const voices = await this.getAvailableVoices();
    return {
      isAvailable: this.isAvailable(),
      isSpeaking: this.isSpeaking,
      // For Azure playback we track isSpeaking; for Web Speech report paused state if available
      isPaused: (typeof window !== 'undefined' && 'speechSynthesis' in window) ? speechSynthesis.paused : false,
      settings: this.getSettings(),
      availableVoices: Array.isArray(voices) ? voices.length : 0
    };
  }
}

// Create singleton instance
const voiceService = new VoiceService();

export default voiceService;

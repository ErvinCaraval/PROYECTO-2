import React, { useState, useEffect } from 'react';
import { useVoice } from '../VoiceContext';
import Button from './ui/Button';
import Alert from './ui/Alert';
import { Card, CardBody, CardHeader } from './ui/Card';

export default function VoiceSettings() {
  const { 
    isVoiceModeEnabled, 
    getVoiceSettings, 
    updateVoiceSettings, 
    getVoiceStatus,
    isVoiceAvailable,
    speak 
  } = useVoice();
  
  const [settings, setSettings] = useState({
    rate: 1.0,
    volume: 1.0,
    pitch: 1.0,
    voice: null,
    language: 'es-ES'
  });
  
  const [availableVoices, setAvailableVoices] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadSettings();
    loadStatus();
    
    // Load voices when they become available
    const loadVoices = () => {
      if (typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices) {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices || []);
      }
    };
    
    // Load voices immediately
    loadVoices();
    
    // Also load when voices change
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = () => {
    const currentSettings = getVoiceSettings();
    setSettings(currentSettings);
  };

  const loadStatus = () => {
    const currentStatus = getVoiceStatus();
    setStatus(currentStatus);
    
    // Get voices from speechSynthesis API directly
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.getVoices) {
      const voices = speechSynthesis.getVoices();
      setAvailableVoices(voices || []);
    } else {
      setAvailableVoices([]);
    }
  };

  const handleSettingChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateVoiceSettings(newSettings);
  };

  const handleVoiceChange = (voiceName) => {
    const selectedVoice = availableVoices.find(voice => voice.name === voiceName);
    if (selectedVoice) {
      handleSettingChange('voice', selectedVoice);
    }
  };

  const testVoice = async () => {
    if (!isVoiceModeEnabled) {
      setMessage('Activa el modo de voz primero');
      return;
    }

    setLoading(true);
    setMessage('');
    
    try {
      await speak('Esta es una prueba de voz. Puedes ajustar la velocidad, volumen y tono según tus preferencias.');
      setMessage('Prueba de voz completada');
    } catch (error) {
      setMessage('Error en la prueba de voz: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings = {
      rate: 1.0,
      volume: 1.0,
      pitch: 1.0,
      voice: null,
      language: 'es-ES'
    };
    setSettings(defaultSettings);
    updateVoiceSettings(defaultSettings);
    setMessage('Configuración restaurada a valores por defecto');
  };

  if (!isVoiceAvailable) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Configuración de Voz</h3>
        </CardHeader>
        <CardBody>
          <Alert intent="warning">
            La funcionalidad de voz no está disponible en tu navegador. 
            Asegúrate de usar un navegador compatible como Chrome, Firefox o Safari.
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">Configuración de Voz</h3>
          <p className="text-white/70">
            Personaliza la voz, velocidad y volumen para una mejor experiencia auditiva.
          </p>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Voz
            </label>
            <select
              value={settings.voice?.name || ''}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Voz por defecto</option>
              {availableVoices.map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Rate (Speed) */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Velocidad: {settings.rate}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.rate}
              onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
            </div>
          </div>

          {/* Volume */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Volumen: {Math.round(settings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Tono: {settings.pitch}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Bajo</span>
              <span>Normal</span>
              <span>Alto</span>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Idioma
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="es-ES">Español (España)</option>
              <option value="es-MX">Español (México)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </div>

          {/* Status Info */}
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="text-sm font-medium text-white/80 mb-2">Estado del Sistema</h4>
            <div className="text-xs text-white/60 space-y-1">
              <div>Disponible: {status.isAvailable ? '✅ Sí' : '❌ No'}</div>
              <div>Reproduciendo: {status.isSpeaking ? '🔊 Sí' : '🔇 No'}</div>
              <div>Voces disponibles: {status.availableVoices || 0}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={testVoice}
              disabled={loading || !isVoiceModeEnabled}
              variant="primary"
            >
              {loading ? 'Probando...' : '🔊 Probar Voz'}
            </Button>
            
            <Button
              onClick={resetToDefaults}
              variant="secondary"
            >
              🔄 Restaurar
            </Button>
          </div>

          {message && (
            <Alert intent={message.includes('Error') ? 'error' : 'success'}>
              {message}
            </Alert>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

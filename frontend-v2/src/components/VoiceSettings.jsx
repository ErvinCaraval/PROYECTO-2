import React, { useState, useEffect } from 'react';
import { useVoice } from '../VoiceContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import { Card, CardBody, CardHeader } from './ui/Card';

export default function VoiceSettings() {
  const { 
    isVoiceModeEnabled, 
    updateVoiceSettings, 
    getVoiceSettings,
    getAvailableVoices,
    isVoiceAvailable,
    speak 
  } = useVoice();
  
  const [settings, setSettings] = useState(getVoiceSettings());
  const [availableVoices, setAvailableVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(settings.language || 'es-ES');
  const [selectedGender, setSelectedGender] = useState('Female');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Lista de idiomas disponibles
  const languages = [
    { code: 'es-ES', name: 'Español (España)' },
    { code: 'es-MX', name: 'Español (México)' },
    { code: 'en-US', name: 'Inglés (Estados Unidos)' }
  ];

  // Lista de géneros disponibles
  const genders = [
    { value: 'Female', label: 'Voz Femenina' },
    { value: 'Male', label: 'Voz Masculina' }
  ];

  useEffect(() => {
    const loadAndFilterVoices = async () => {
      try {
        setLoading(true);
        // Obtener las voces disponibles de forma asíncrona
        const voices = await getAvailableVoices();
        console.log('Voces disponibles:', voices);
        
        if (!voices || voices.length === 0) {
          throw new Error('No se encontraron voces disponibles');
        }
        
        setAvailableVoices(voices);

        // Obtener configuración actual
        const currentSettings = getVoiceSettings();
        setSettings(currentSettings);
        
        // Establecer género y lenguaje según la configuración
        const gender = currentSettings.gender || 'Female';
        const language = currentSettings.language || 'es-ES';
        
        setSelectedGender(gender);
        setSelectedLanguage(language);
        
        // Filtrar voces según la configuración actual
        const filtered = filterVoicesBySettings(language, gender, voices);
        setFilteredVoices(filtered);
        
        // Si no hay voz seleccionada o la voz seleccionada no está en las voces filtradas,
        // seleccionar la primera voz disponible del género actual
        if (!currentSettings.voiceName || !filtered.some(v => (v.Name || v.name) === currentSettings.voiceName)) {
          const defaultVoice = filtered[0];
          if (defaultVoice) {
            handleSettingChange('voiceName', defaultVoice.Name || defaultVoice.name);
          }
        }
      } catch (error) {
        console.error('Error al cargar voces:', error);
        setMessage('Error al cargar las voces disponibles');
      } finally {
        setLoading(false);
      }
    };

    loadAndFilterVoices();
  }, []);

  const filterVoicesBySettings = (languageCode, gender, voices = []) => {
    console.log('Filtrando voces:', { languageCode, gender });
    console.log('Total voces disponibles:', voices.length);
    
    return voices.filter(voice => {
      const voiceName = (voice.Name || voice.name || '').toLowerCase();
      const voiceLocale = (voice.Locale || voice.lang || '').toLowerCase();
      const voiceGender = voice.Gender || voice.gender;
      
      // Determinar género por nombre o metadata
      // Añadir heurísticas simples para detectar género cuando no viene en la metadata
      const lowerName = voiceName;
      const maleHints = ['male', 'alvaro', 'antonio', 'carlos', 'diego', 'luis', 'miguel', 'javier'];
      const femaleHints = ['female', 'elvira', 'maria', 'sofia', 'ana', 'lucia', 'luna', 'alicia'];

      const nameSuggestsMale = maleHints.some(h => lowerName.includes(h));
      const nameSuggestsFemale = femaleHints.some(h => lowerName.includes(h));

      const effectiveGender = voiceGender || 
        (nameSuggestsMale ? 'Male' : 
         nameSuggestsFemale ? 'Female' : null);
      
      const matchesLanguage = voiceLocale.startsWith(languageCode.toLowerCase());
      const matchesGender = effectiveGender === gender;
      
      console.log(`Voz: ${voice.Name || voice.name}`, {
        locale: voiceLocale,
        gender: effectiveGender,
        matchesLanguage,
        matchesGender
      });
      
      return matchesLanguage && matchesGender;
    });
  };

  const handleSettingChange = (key, value) => {
    console.log('Cambiando configuración:', { key, value });
    const newSettings = { ...settings, [key]: value };
    
    // Si se cambia el género o idioma, actualizar también la voz
    if (key === 'gender') {
      setSelectedGender(value);
      const filtered = filterVoicesBySettings(settings.language || selectedLanguage, value, availableVoices);
      setFilteredVoices(filtered);
      // seleccionar primera voz disponible del género
      if (filtered.length > 0) {
        newSettings.voiceName = filtered[0].Name || filtered[0].name;
      }
    } else if (key === 'language') {
      setSelectedLanguage(value);
      const filtered = filterVoicesBySettings(value, settings.gender || selectedGender, availableVoices);
      setFilteredVoices(filtered);
      if (filtered.length > 0) {
        newSettings.voiceName = filtered[0].Name || filtered[0].name;
      }
    }
    
    setSettings(newSettings);
    updateVoiceSettings(newSettings);
  };

  const testVoice = async () => {
    if (!isVoiceModeEnabled) {
      setMessage('Activa el modo de voz primero');
      return;
    }

    setLoading(true);
    try {
      await speak('Esta es una prueba de voz. ¿Me escuchas bien?');
      setMessage('Prueba de voz completada');
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
    setLoading(false);
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
        </CardHeader>
        <CardBody className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Idioma
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                const newLanguage = e.target.value;
                setSelectedLanguage(newLanguage);
                const filtered = filterVoicesBySettings(newLanguage, selectedGender, availableVoices);
                setFilteredVoices(filtered);
                
                // Seleccionar la primera voz disponible para el nuevo idioma y género
                if (filtered.length > 0) {
                  handleSettingChange('voiceName', filtered[0].Name || filtered[0].name);
                  handleSettingChange('language', newLanguage);
                }
              }}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Género de la Voz
            </label>
            <select
              value={selectedGender}
              onChange={(e) => {
                const newGender = e.target.value;
                setSelectedGender(newGender);
                const filtered = filterVoicesBySettings(selectedLanguage, newGender, availableVoices);
                setFilteredVoices(filtered);
                
                // Seleccionar la primera voz disponible para el nuevo género
                if (filtered.length > 0) {
                  handleSettingChange('voiceName', filtered[0].Name || filtered[0].name);
                  handleSettingChange('gender', newGender);
                }
              }}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              {genders.map((gender) => (
                <option key={gender.value} value={gender.value}>
                  {gender.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-white/80">
              Voz
            </label>
            <select
              value={settings.voiceName || ''}
              onChange={(e) => {
                const selectedVoice = filteredVoices.find(v => 
                  (v.Name || v.name) === e.target.value
                );
                handleSettingChange('voiceName', e.target.value);
                
                // Actualizar el género si la voz seleccionada tiene un género específico
                if (selectedVoice) {
                  const voiceName = (selectedVoice.Name || selectedVoice.name || '').toLowerCase();
                  if (voiceName.includes('male') || selectedVoice.Gender === 'Male') {
                    setSelectedGender('Male');
                    handleSettingChange('gender', 'Male');
                  } else if (voiceName.includes('female') || selectedVoice.Gender === 'Female') {
                    setSelectedGender('Female');
                    handleSettingChange('gender', 'Female');
                  }
                }
              }}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            >
              <option value="">Selecciona una voz</option>
              {filteredVoices.map((voice, index) => (
                <option key={index} value={voice.Name || voice.name}>
                  {voice.Name || voice.name}
                </option>
              ))}
            </select>
          </div>

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
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

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
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={testVoice}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Probando...' : 'Probar Voz'}
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

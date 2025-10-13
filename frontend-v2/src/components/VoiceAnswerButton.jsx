import React, { useState, useEffect } from 'react';
import { useVoice } from '../VoiceContext';
import Button from './ui/Button';
import voiceRecognitionService from '../services/voiceRecognitionService';

const VoiceAnswerButton = ({ options, onAnswer, disabled = false }) => {
  const { isVoiceModeEnabled } = useVoice();
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const [lastRecognized, setLastRecognized] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const startListening = async () => {
    if (!isVoiceModeEnabled || disabled) return;

    setIsListening(true);
    setRecognitionError('');
    setLastRecognized('');
    setSuccessMessage('');

    try {
      // Usar las opciones para mejorar el reconocimiento
      const result = await voiceRecognitionService.recognizeAnswer(options);

      if (result.stopped) {
        setIsListening(false);
        setRecognitionError('Reconocimiento detenido por el usuario.');
        return;
      }

      setLastRecognized(result.transcript);

      if (result.isValid && result.matchedIndex !== -1) {
        setSuccessMessage('✅ Respuesta reconocida: ' + options[result.matchedIndex]);
        onAnswer(result.matchedIndex);
      } else {
        setRecognitionError('No pude entender tu respuesta. Por favor, di una de las opciones disponibles.');
      }
    } catch (error) {
      console.error('Voice recognition error:', error);
      setRecognitionError(error?.message || 'Error en el reconocimiento de voz. Intenta de nuevo.');
    } finally {
      setIsListening(false);
    }
  };

  const findMatchingOption = (spokenText, options) => {
    const text = spokenText.toLowerCase().trim();
    
    // Try to match with option text
    for (let i = 0; i < options.length; i++) {
      const optionText = options[i].toLowerCase();
      
      // Direct match
      if (text.includes(optionText) || optionText.includes(text)) {
        return i;
      }
      
      // Match with option letters (A, B, C, D)
      const optionLetter = String.fromCharCode(65 + i); // A, B, C, D
      if (text.includes(optionLetter.toLowerCase()) || text.includes(optionLetter)) {
        return i;
      }
      
      // Match with numbers (1, 2, 3, 4)
      if (text.includes((i + 1).toString())) {
        return i;
      }
    }
    
    // Try to match with common words
    const commonMatches = {
      'primera': 0,
      'segunda': 1,
      'tercera': 2,
      'cuarta': 3,
      'uno': 0,
      'dos': 1,
      'tres': 2,
      'cuatro': 3
    };
    
    for (const [word, index] of Object.entries(commonMatches)) {
      if (text.includes(word) && index < options.length) {
        return index;
      }
    }
    
    return -1;
  };

  const stopListening = () => {
    voiceRecognitionService.stopRecognition();
    setIsListening(false);
  };

  if (!isVoiceModeEnabled) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={isListening ? stopListening : startListening}
        disabled={disabled}
        variant={isListening ? "secondary" : "primary"}
        className={`w-full ${isListening ? 'animate-pulse' : ''}`}
      >
        {isListening ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              🎤 Escuchando...
            </div>
          </>
        ) : (
          <>
            🎤 Responder con Voz
          </>
        )}
      </Button>
      {successMessage && (
        <div className="text-sm text-green-500 bg-green-500/10 border border-green-500/30 rounded p-2 text-center font-semibold animate-fade-in">
          {successMessage}
        </div>
      )}
      {recognitionError && (
        <div className="text-sm text-red-400 bg-red-500/20 p-2 rounded text-center font-semibold">
          {recognitionError}
        </div>
      )}
    </div>
  );
};

export default VoiceAnswerButton;

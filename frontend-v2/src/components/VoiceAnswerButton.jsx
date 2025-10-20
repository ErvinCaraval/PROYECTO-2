import React, { useState, useRef } from 'react';
import { useVoice } from '../VoiceContext';
import Button from './ui/Button';
import voiceRecognitionService from '../services/voiceRecognitionService';
import voiceInteractionsService from '../services/voiceInteractionsService';

const VoiceAnswerButton = ({ options, onAnswer, disabled = false }) => {
  const { isVoiceModeEnabled } = useVoice();
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const [lastRecognized, setLastRecognized] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Utilidad para convertir Blob a base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startListening = async () => {
    if (!isVoiceModeEnabled || disabled) return;

    setIsListening(true);
    setRecognitionError('');
    setLastRecognized('');
    setSuccessMessage('');

    // --- INICIO GRABACIÓN AUDIO ---
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();
    } catch (err) {
      setRecognitionError('No se pudo acceder al micrófono.');
      setIsListening(false);
      return;
    }
    // --- INICIO RECONOCIMIENTO TEXTO ---
    try {
      const result = await voiceRecognitionService.recognizeAnswer(options);

      // Parar grabación
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise((resolve) => {
          mediaRecorderRef.current.onstop = resolve;
          mediaRecorderRef.current.stop();
        });
      }
      stream.getTracks().forEach((t) => t.stop());

      // Unir audio y convertir a base64 (intentar 'audio/wav' para AssemblyAI)
      let audioBlob;
      try {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        // Si el navegador no soporta 'audio/wav', fallback a 'audio/webm'
        if (audioBlob.size === 0) {
          audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        }
      } catch (e) {
        audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      }
      const audioBase64 = await blobToBase64(audioBlob);
      const audioMimeType = audioBlob.type || 'audio/webm';

      setLastRecognized(result.transcript);

      // Enviar el audio al backend para que AssemblyAI determine la respuesta final
      const assemblyResult = await voiceInteractionsService.processAudioWithAssemblyAI(audioBase64, options, audioMimeType);

      if (assemblyResult && assemblyResult.success && assemblyResult.validation && assemblyResult.validation.isValid && typeof assemblyResult.validation.answerIndex === 'number') {
        const idx = assemblyResult.validation.answerIndex;
        setSuccessMessage('✅ Respuesta reconocida (AssemblyAI): ' + options[idx]);
        onAnswer(idx, audioBase64, assemblyResult, audioMimeType);
      } else if (result.isValid && result.matchedIndex !== -1) {
        // Fallback: si AssemblyAI falla, usar coincidencia local
        setSuccessMessage('✅ Respuesta reconocida: ' + options[result.matchedIndex]);
        onAnswer(result.matchedIndex, audioBase64, assemblyResult, audioMimeType);
      } else {
        const suggestions = assemblyResult && assemblyResult.suggestions ? ` Sugerencias: ${assemblyResult.suggestions.join(', ')}` : '';
        setRecognitionError('No pude entender tu respuesta.' + suggestions);
      }
    } catch (error) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      console.error('Voice recognition error:', error);
      setRecognitionError(error?.message || 'Error en el reconocimiento de voz. Intenta de nuevo.');
    } finally {
      setIsListening(false);
    }
  };

  // findMatchingOption removed (not used)

  const stopListening = () => {
    voiceRecognitionService.stopRecognition();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
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
      {lastRecognized && (
        <div className="text-xs text-white/70">Último reconocido: {lastRecognized}</div>
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

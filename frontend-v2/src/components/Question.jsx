import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { motion } from 'framer-motion';
import { useVoice } from '../VoiceContext';
import Button from './ui/Button';
import VoiceAnswerButton from './VoiceAnswerButton';
// voiceRecognitionService is no longer used here; VoiceAnswerButton handles recognition

export default function Question({ text, question, options, onSelect, selected, showResult = false, correctIndex = null }) {
  const title = typeof text === 'string' && text.length > 0 ? text : question;
  const { isVoiceModeEnabled, speak, stopSpeaking, isVoiceAvailable, voiceInteractionsService } = useVoice();
  // Obtener el usuario autenticado (fallback a window.__USER__ si existiera)
  const { user: authUser } = useAuth();
  const user = authUser || ((typeof window !== 'undefined' && window.__USER__) || null);
  const questionId = (question && (question.id || question.questionId)) || 'general';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasReadQuestion, setHasReadQuestion] = useState(false);
  const [autoReadError, setAutoReadError] = useState('');
  const [recognitionError, setRecognitionError] = useState('');


  // Reiniciar hasReadQuestion cada vez que cambie la pregunta o el índice
  useEffect(() => {
    setHasReadQuestion(false);
  }, [title, options]);

  // Auto-read question when it appears and voice mode is enabled
  useEffect(() => {
    if (isVoiceModeEnabled && title && Array.isArray(options) && options.length > 0 && !hasReadQuestion && !showResult) {
      readQuestion().catch(() => {
        setAutoReadError('No se pudo leer la pregunta automáticamente. Usa el botón para escuchar.');
      });
    }
  }, [isVoiceModeEnabled, title, options, hasReadQuestion, showResult]);

  const readQuestion = async () => {
    if (!isVoiceModeEnabled || !title) return;
    setIsSpeaking(true);
    setHasReadQuestion(true);
    setAutoReadError('');
    try {
      let toSpeak = `Pregunta: ${title}`;
      if (Array.isArray(options) && options.length > 0) {
        options.forEach((option, i) => {
          toSpeak += `. Opción ${String.fromCharCode(65 + i)}: ${option}`;
        });
      }
      await speak(toSpeak);
    } catch (error) {
      setAutoReadError('No se pudo leer la pregunta automáticamente. Usa el botón para escuchar.');
      console.error('Error reading question:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  const readOption = async (index) => {
    if (!isVoiceModeEnabled || !options[index]) return;
    
    try {
      await speak(`Opción ${String.fromCharCode(65 + index)}: ${options[index]}`);
    } catch (error) {
      console.error('Error reading option:', error);
    }
  };

  // La lógica de reconocimiento de voz se delega al componente VoiceAnswerButton para evitar duplicación
  const getOptionClasses = (idx) => {
    if (showResult) {
      if (idx === correctIndex) return 'border-emerald-400/60 bg-emerald-500/10';
      if (selected === idx && idx !== correctIndex) return 'border-red-400/60 bg-red-500/10';
      return 'border-white/15 bg-white/5';
    }
    return selected === idx
      ? 'border-bb-primary bg-white/10'
      : 'border-white/20 bg-white/5 hover:bg-white/10';
  };
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div className="w-full max-w-xl mx-auto bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 mb-6 flex flex-col items-center">
        <h2 className="text-xl md:text-2xl font-bold leading-snug break-words text-center mb-2">{title}</h2>
        {/* Voice Controls: botón siempre visible en modo voz */}
        {isVoiceModeEnabled && (
          <div className="w-full flex flex-col items-center gap-2 mt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={readQuestion}
              title="Leer pregunta y opciones"
              className="px-3 py-2 text-base"
              disabled={isSpeaking}
            >
              🔊 Leer pregunta y opciones
            </Button>
            {autoReadError && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 text-center font-semibold">
                {autoReadError}
              </div>
            )}
            {!isVoiceAvailable && (
              <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2 text-center font-semibold">
                La síntesis de voz no está disponible en tu navegador.
              </div>
            )}
            {isVoiceAvailable && !showResult && (
              <VoiceAnswerButton 
                options={options}
                onAnswer={async (idx, audioBase64, assemblyResult, audioMimeType) => {
                  // Primero registra la interacción para asegurar que quede en historial
                  if (voiceInteractionsService && user && questionId) {
                    await voiceInteractionsService.logVoiceAnswer(
                      user.uid,
                      questionId,
                      options[idx],
                      undefined, // confidence (no disponible aquí)
                      options[idx],
                      idx,
                      undefined, // duration (no disponible aquí)
                      audioBase64, // nuevo argumento opcional
                      assemblyResult, // marca que AssemblyAI se usó si success
                      audioMimeType
                    );
                  }
                  stopSpeaking();
                  setRecognitionError('');
                  onSelect(idx);
                }}
                disabled={selected !== null}
              />
            )}
          </div>
        )}
      </div>
      <motion.div
        role="group"
        aria-label="Opciones de respuesta"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-2xl mx-auto"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
      >
        {options.map((opt, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelect(idx)}
            disabled={selected !== null}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: selected === null ? 1.01 : 1 }}
            whileTap={{ scale: selected === null ? 0.99 : 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            className={`col-span-1 text-left w-full rounded-xl border px-4 py-3 text-sm md:text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-primary break-words ${getOptionClasses(idx)}`}
            aria-pressed={selected === idx}
            onFocus={() => {
              if (isVoiceModeEnabled && !isSpeaking) {
                readOption(idx);
              }
            }}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-sm font-semibold">{String.fromCharCode(65 + idx)}</span>
            <span className="align-middle">{opt}</span>
          </motion.button>
        ))}
      </motion.div>
      {/* Recognition Error */}
      {recognitionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4 max-w-xl mx-auto">
          <p className="text-sm text-red-400">{recognitionError}</p>
        </div>
      )}
    </div>
  );
}
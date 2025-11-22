import React, { useState, useRef, useEffect } from 'react';
import { useVoice } from '../VoiceContext';
import { useAuth } from '../AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import Spinner from './ui/Spinner';

const OCRQuestionCapture = ({ topics, onQuestionExtracted, onCancel }) => {
  const { isVoiceModeEnabled, speak } = useVoice();
  const { user } = useAuth();
  const [mode, setMode] = useState(null); // 'upload' only
  const [selectedTopic, setSelectedTopic] = useState(topics[0] || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [processedQuestion, setProcessedQuestion] = useState(null);
  const [manualQuestion, setManualQuestion] = useState({ pregunta: '', opciones: { a: '', b: '', c: '', d: '' } });
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(0); // Track which option is correct
  const [savedQuestions, setSavedQuestions] = useState([]); // Track saved questions
  const fileInputRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL;

  /**
   * Handle file selection from input
   */
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Por favor selecciona una imagen (PNG, JPG, JPEG)');
      return;
    }

    // Validate file size (max 10MB for OCR)
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 10MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Announce to voice
    if (isVoiceModeEnabled) {
      speak(`Imagen seleccionada: ${file.name}. Presiona procesar para extraer la pregunta.`, { force: true });
    }
  };



  /**
   * Process image using OCR
   */
  const processImage = async () => {
    if (!imageFile) {
      setError('Por favor selecciona o captura una imagen');
      return;
    }

    if (!apiBase) {
      setError('Error de configuración: URL del API no definida');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target.result;

        try {
          const response = await fetch(`${apiBase}/ocr/process-image`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageBase64: base64Image,
              mimeType: imageFile.type || 'image/jpeg',
              language: 'es'
            })
          });

          const data = await response.json();

          if (data.success) {
            // Check if OCR detection was successful or partial
            const hasQuestion = data.pregunta && !data.pregunta.includes('no detectada');
            const detectedOptions = Object.values(data.opciones || {}).filter(opt => opt && !opt.includes('no detectada'));
            
            if (!hasQuestion || detectedOptions.length === 0) {
              // Partial detection - show warning but allow manual completion
              setProcessedQuestion({
                pregunta: data.pregunta || '',
                opciones: data.opciones || { a: '', b: '', c: '', d: '' }
              });
              setSuccessMessage('⚠️ Detección parcial. Por favor completa los campos vacíos manualmente.');
              
              if (isVoiceModeEnabled) {
                speak('Extracción parcial. Por favor completa la pregunta y las opciones manualmente.', { force: true });
              }
            } else {
              // Full or mostly successful detection
              setProcessedQuestion({
                pregunta: data.pregunta,
                opciones: data.opciones
              });
              setSuccessMessage('✅ Pregunta extraída correctamente');

              if (isVoiceModeEnabled) {
                speak(`Pregunta detectada: ${data.pregunta}`, { force: true });
              }
            }
          } else {
            setError(data.error || 'Error procesando la imagen');
          }
        } catch (err) {
          setError(`Error al procesar la imagen: ${err.message}`);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsDataURL(imageFile);
    } catch (err) {
      setError(`Error: ${err.message}`);
      setLoading(false);
    }
  };

  /**
   * Confirm and submit the extracted question
   */
  const confirmQuestion = async () => {
    // Validation: check if we have a pregunta and at least 2 options
    const pregunta = processedQuestion.pregunta?.trim();
    const opciones = processedQuestion.opciones;
    const optionsArray = [
      opciones.a?.trim() || '',
      opciones.b?.trim() || '',
      opciones.c?.trim() || '',
      opciones.d?.trim() || ''
    ].filter(o => o);
    
    const hasAtLeastTwoOptions = optionsArray.length >= 2;

    if (!pregunta) {
      setError('Por favor escribe la pregunta');
      return;
    }

    if (!hasAtLeastTwoOptions) {
      setError('Por favor completa al menos 2 opciones de respuesta');
      return;
    }

    if (!selectedTopic) {
      setError('Por favor selecciona un tema');
      return;
    }

    // Validate that correctAnswerIndex is within bounds
    if (correctAnswerIndex < 0 || correctAnswerIndex >= optionsArray.length) {
      setError('Por favor selecciona cuál opción es correcta');
      return;
    }

    setLoading(true);
    setError('');

    // Create question payload
    const questionPayload = {
      text: pregunta,
      options: optionsArray,
      correctAnswerIndex: correctAnswerIndex,
      category: selectedTopic,
      explanation: ''
    };

    try {
      if (onQuestionExtracted) {
        // Wait for the callback to complete
        await onQuestionExtracted(questionPayload);
        
        // Show success message
        setSuccessMessage('✅ Pregunta guardada exitosamente');
        
        // Add to local saved questions list
        setSavedQuestions([...savedQuestions, questionPayload]);
        
        // Reset form after a short delay to show the success message
        // Mantener modal abierto para agregar más preguntas
        setTimeout(() => {
          setImageFile(null);
          setImagePreview(null);
          setProcessedQuestion(null);
          setMode(null);
          setCorrectAnswerIndex(0);
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(`Error al guardar la pregunta: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset form
   */
  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setProcessedQuestion(null);
    setMode(null);
    setCorrectAnswerIndex(0);
    stopCamera();
    setError('');
    setSuccessMessage('');
  };

  if (isVoiceModeEnabled && !mode && !imageFile) {
    useEffect(() => {
      speak('Formulario de captura de pregunta. Selecciona una imagen o toma una foto.', { force: true });
    }, []);
  }

  return (
    <div className="grid gap-4 p-4">
      {isVoiceModeEnabled && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={async () => {
              await speak('Captura de pregunta. Puedes subir una imagen o tomar una foto desde la cámara. La aplicación extraerá automáticamente el texto y las opciones.', {
                force: true
              });
            }}
            aria-label="Explicar la página"
          >
            🛈 Explicar página
          </Button>
        </div>
      )}

      {error && <Alert intent="error">{error}</Alert>}
      {successMessage && <Alert intent="success">{successMessage}</Alert>}
      
      {/* Show counter of saved questions */}
      {savedQuestions.length > 0 && (
        <div className="p-3 bg-gradient-to-r from-bb-primary/20 to-bb-primary/10 rounded-lg border border-bb-primary/40 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            ✅ {savedQuestions.length} pregunta{savedQuestions.length !== 1 ? 's' : ''} guardada{savedQuestions.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs"
          >
            Finalizar
          </Button>
        </div>
      )}

      {/* Mode selection */}
      {!mode && !imageFile && !processedQuestion && (
        <div className="grid gap-3">
          <h3 className="text-lg font-bold">Crear pregunta</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setMode('upload')}
              size="lg"
              onFocus={() => isVoiceModeEnabled && speak('Subir imagen', { force: true })}
              onMouseEnter={() => isVoiceModeEnabled && speak('Subir imagen', { force: true })}
            >
              📱 Subir imagen
            </Button>
          </div>
        </div>
      )}

      {/* Upload mode */}
      {mode === 'upload' && !processedQuestion && (
        <div className="grid gap-3">
          <h3 className="text-lg font-bold">Subir imagen</h3>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileSelect}
            className="block w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white"
          />
        </div>
      )}

      {/* Image preview and processing */}
      {imageFile && !processedQuestion && (
        <div className="grid gap-3">
          <h3 className="text-lg font-bold">Vista previa</h3>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-96 rounded-xl object-contain border-2 border-white/10"
            />
          )}
          <div className="flex gap-3">
            <Button
              onClick={processImage}
              disabled={loading}
              size="lg"
              onFocus={() => isVoiceModeEnabled && speak('Procesar imagen', { force: true })}
              onMouseEnter={() => isVoiceModeEnabled && speak('Procesar imagen', { force: true })}
            >
              {loading ? <Spinner size="sm" /> : '⚡ Procesar'}
            </Button>
            <Button
              variant="secondary"
              onClick={resetForm}
              disabled={loading}
              onFocus={() => isVoiceModeEnabled && speak('Seleccionar otra imagen', { force: true })}
              onMouseEnter={() => isVoiceModeEnabled && speak('Seleccionar otra imagen', { force: true })}
            >
              Cambiar imagen
            </Button>
          </div>
        </div>
      )}

      {/* Processed question display and confirmation */}
      {processedQuestion && (
        <div className="grid gap-4 p-4 bg-white/5 rounded-xl border-2 border-bb-primary/30">
          <h3 className="text-lg font-bold">Pregunta extraída</h3>

          {!processedQuestion.pregunta || processedQuestion.pregunta.includes('Pregunta no detectada') ? (
            <div className="p-3 bg-orange-500/10 border border-orange-400/30 rounded-lg">
              <p className="text-sm text-orange-300">⚠️ <strong>Importante:</strong> OCR no detectó la pregunta correctamente. Por favor completa los campos manualmente.</p>
            </div>
          ) : null}

          <div className="grid gap-2">
            <label className="text-sm text-white/80">Tema</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="block w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-md focus:border-bb-primary focus:ring-2 focus:ring-bb-primary/30 focus:outline-none"
            >
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm text-white/80">Pregunta *</label>
            <textarea
              defaultValue={processedQuestion.pregunta || ''}
              placeholder="Escribe la pregunta aquí..."
              className="p-3 rounded-xl bg-white/5 border border-white/10 text-white break-words focus:outline-none focus:ring-2 focus:ring-bb-primary/30 focus:border-bb-primary resize-none"
              rows="3"
              onChange={(e) => {
                setProcessedQuestion(prev => ({
                  ...prev,
                  pregunta: e.target.value
                }));
              }}
            />
          </div>

          <div className="grid gap-3">
            <label className="text-sm text-white/80">Opciones de respuesta *</label>
            <p className="text-xs text-white/60">Al menos 2 opciones son requeridas</p>
            <div className="grid gap-2">
              {['a', 'b', 'c', 'd'].map((key, idx) => {
                const optionText = processedQuestion.opciones[key];
                const isEmpty = !optionText || optionText.trim() === '' || optionText.includes('no detectada');
                return (
                  <div key={key} className="flex items-start gap-2">
                    <span className="font-bold text-bb-primary min-w-[2rem]">{key.toUpperCase()})</span>
                    <input
                      type="text"
                      defaultValue={optionText && !optionText.includes('no detectada') ? optionText : ''}
                      placeholder={`Opción ${key.toUpperCase()} (opcional)`}
                      className={`p-2 rounded-lg bg-white/5 border text-white flex-1 break-words focus:outline-none focus:ring-2 ${
                        isEmpty 
                          ? 'border-orange-400/50 focus:ring-orange-400/30' 
                          : 'border-white/10 focus:ring-bb-primary/30 focus:border-bb-primary'
                      }`}
                      onChange={(e) => {
                        setProcessedQuestion(prev => ({
                          ...prev,
                          opciones: {
                            ...prev.opciones,
                            [key]: e.target.value
                          }
                        }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-orange-300">⚠️ Los campos en naranja no fueron detectados. Edítalos manualmente.</p>
          </div>

          <div className="grid gap-3 p-3 bg-bb-primary/10 rounded-lg border border-bb-primary/30">
            <label className="text-sm font-semibold text-white">¿Cuál es la respuesta correcta? *</label>
            <div className="grid gap-2">
              {['a', 'b', 'c', 'd'].map((key, idx) => {
                const optionText = processedQuestion.opciones[key];
                const isEmptyOrInvalid = !optionText || optionText.trim() === '' || optionText.includes('no detectada');
                
                // Filter to only show valid options
                if (isEmptyOrInvalid) return null;
                
                return (
                  <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctAnswerIndex === idx}
                      onChange={() => setCorrectAnswerIndex(idx)}
                      disabled={loading || isEmptyOrInvalid}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <span className="text-sm">
                      <strong>{key.toUpperCase()})</strong> {optionText}
                    </span>
                    {correctAnswerIndex === idx && (
                      <span className="ml-auto text-bb-primary font-bold">✓ Correcta</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-white/60">
            ℹ️ Puedes editar la pregunta manualmente. Es importante que completes todos los campos correctamente.
          </p>

          {/* Show saved questions counter and add another option - VISIBLE BEFORE CONFIRMING */}
          {savedQuestions.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-bb-primary/20 to-bb-primary/10 rounded-lg border border-bb-primary/40">
              <p className="text-sm font-semibold text-white mb-2">
                ✅ {savedQuestions.length} pregunta{savedQuestions.length !== 1 ? 's' : ''} guardada{savedQuestions.length !== 1 ? 's' : ''} - Puedes guardar esta y agregar más
              </p>
              <div className="flex gap-2">
                <span className="text-xs text-bb-primary/80">💡 Confirma y luego agrega otra</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Button
                onClick={confirmQuestion}
                size="lg"
                disabled={loading}
                onFocus={() => isVoiceModeEnabled && speak('Confirmar y guardar', { force: true })}
                onMouseEnter={() => isVoiceModeEnabled && speak('Confirmar y guardar', { force: true })}
              >
                {loading ? '⏳ Guardando…' : '✓ Confirmar'}
              </Button>
              <Button
                variant="secondary"
                onClick={resetForm}
                disabled={loading}
                onFocus={() => isVoiceModeEnabled && speak('Capturar otra imagen', { force: true })}
                onMouseEnter={() => isVoiceModeEnabled && speak('Capturar otra imagen', { force: true })}
              >
                📷 Otra imagen
              </Button>
              <Button
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                onFocus={() => isVoiceModeEnabled && speak('Atrás', { force: true })}
                onMouseEnter={() => isVoiceModeEnabled && speak('Atrás', { force: true })}
              >
                Atrás
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRQuestionCapture;

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

const ManualQuestionForm = ({ topics, onQuestionCreated, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    selectedTopic: topics[0] || ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleOptionChange = (idx, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === idx ? value : opt)
    }));
  };

  const validateForm = useCallback(() => {
    if (!formData.question.trim()) {
      return 'La pregunta es requerida';
    }
    if (formData.options.some(opt => !opt.trim())) {
      return 'Todas las opciones son requeridas';
    }
    return '';
  }, [formData]);

  useEffect(() => {
    const validationError = validateForm();
    setError(validationError);
  }, [formData, user, validateForm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      // Build payload and hand off to parent for saving. Parent will perform the network request.
      const payload = {
        text: formData.question,
        options: formData.options,
        correctAnswerIndex: formData.correctIndex,
        category: formData.selectedTopic,
        explanation: ''
      };

      setSuccessMessage('Guardando...');
      if (onQuestionCreated) {
        const result = await Promise.resolve(onQuestionCreated(payload));
        // If parent returns the saved question, show its text in the success message
        const savedText = result && result.text ? result.text : payload.text;
        setSuccessMessage(`Pregunta creada: "${savedText}"`);
      } else {
        setSuccessMessage('¡Pregunta preparada!');
      }
    } catch (err) {
      console.error('Error al preparar la pregunta:', err);
      setError(err.message || 'Error al guardar la pregunta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <h3 className="text-xl font-bold">Escribe tu pregunta</h3>

      {error && <Alert intent="error">{error}</Alert>}
      {successMessage && <Alert intent="success">{successMessage}</Alert>}

      <div className="grid gap-2">
        <label className="text-sm text-white/80" htmlFor="topic-select">Tema</label>
        <select
          id="topic-select"
          value={formData.selectedTopic}
          onChange={e => setFormData(prev => ({ ...prev, selectedTopic: e.target.value }))}
          disabled={loading}
          className="block w-full rounded-xl border-2 border-white/10 bg-white/5 px-4 py-3 text-white backdrop-blur-md focus:border-bb-primary focus:ring-2 focus:ring-bb-primary/30 focus:outline-none"
        >
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm text-white/80" htmlFor="question-input">Pregunta</label>
        <Input
          id="question-input"
          type="text"
          value={formData.question}
          onChange={e => setFormData(prev => ({ ...prev, question: e.target.value }))}
          disabled={loading}
          required
        />
      </div>

      <div className="grid gap-3">
        <label className="text-sm text-white/80">Opciones</label>
        <div className="grid gap-3">
          {formData.options.map((opt, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <Input
                type="text"
                value={opt}
                onChange={e => handleOptionChange(idx, e.target.value)}
                disabled={loading}
                required
                placeholder={`Opción ${idx + 1}`}
                className="flex-1"
              />
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="correctOption"
                  checked={formData.correctIndex === idx}
                  onChange={() => setFormData(prev => ({ ...prev, correctIndex: idx }))}
                  disabled={loading}
                  className="h-4 w-4"
                />
                <span>Correcta</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Atrás</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </form>
  );
};

export default ManualQuestionForm;

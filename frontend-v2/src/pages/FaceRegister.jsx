import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import FaceCaptureCamera from '../components/FaceCaptureCamera';
import { optimizeImage, getImageSize } from '../utils/imageOptimizer';

export default function FaceRegister() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasRegistration, setHasRegistration] = useState(false);

  const handleCapture = async (base64String) => {
    try {
      // Optimizar imagen antes de guardarla
      const optimized = await optimizeImage(base64String, 300, 300, 0.6);
      const originalSize = getImageSize(base64String);
      const optimizedSize = getImageSize(optimized);
      console.log(`Imagen optimizada: ${originalSize}KB → ${optimizedSize}KB (${Math.round((1 - optimizedSize/originalSize) * 100)}% reducción)`);
      setCapturedImage(optimized);
      setPreview(optimized);
    } catch (error) {
      console.error('Error optimizando imagen, usando original:', error);
      setCapturedImage(base64String);
      setPreview(base64String);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setPreview(null);
    setError('');
    setSuccess('');
  };

  const registerFace = async () => {
    if (!capturedImage) {
      setError('Por favor, captura una foto primero');
      return;
    }

    if (!user) {
      setError('Debes estar autenticado para registrar tu cara. Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Obtener token de Firebase
      const token = await user.getIdToken();

      // Obtener URL base de la API
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // Enviar imagen al backend
      const response = await fetch(`${apiBase}/api/face/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: capturedImage,
          token: token
        })
      });

      // Verificar que la respuesta sea JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Respuesta no es JSON:', text.substring(0, 200));
        throw new Error(`El servidor devolvió un error. Verifica que el backend esté corriendo en ${apiBase}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro facial');
      }

      if (data.success) {
        setSuccess('¡Registro facial completado exitosamente!');
        
        // Redirigir a completar perfil o dashboard después de 2 segundos
        setTimeout(() => {
          // Verificar si el usuario tiene displayName, si no, ir a complete-profile
          if (!user?.displayName) {
            navigate('/complete-profile');
          } else {
            navigate('/dashboard');
          }
        }, 2000);
      } else {
        throw new Error(data.error || 'Error en el registro');
      }
    } catch (err) {
      setError(err.message || 'Error al registrar la cara. Por favor, intenta de nuevo.');
      console.error('Error en registro facial:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user already has a facial registration
  useEffect(() => {
    const check = async () => {
      if (!user) return setHasRegistration(false);
      try {
        const token = await user.getIdToken();
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/face/exists`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setHasRegistration(!!data.exists);
      } catch (err) {
        console.error('Error checking face registration:', err);
      }
    };
    check();
  }, [user]);

  const deleteFaceRegistration = async () => {
    if (!user) {
      setError('Debes estar autenticado para eliminar tu registro facial');
      return;
    }
    if (!confirm('¿Estás seguro de eliminar tu registro facial? Esta acción no se puede deshacer.')) return;

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/face/${user.uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error eliminando registro facial');
      setSuccess('Registro facial eliminado correctamente');
      setHasRegistration(false);
      setPreview(null);
      setCapturedImage(null);
    } catch (err) {
      setError(err.message || 'Error eliminando registro facial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">📸 Registro Facial</h1>
          <p className="text-white/70 mt-2">
            {user ? 
              'Captura una foto de tu rostro para habilitar el login facial' :
              'Paso 2: Captura una foto de tu rostro para completar tu registro'
            }
          </p>
          {!user && (
            <p className="text-white/50 text-sm mt-1">
              Ya creaste tu cuenta, ahora completa tu registro con reconocimiento facial
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
          {error && <Alert intent="error" className="mb-4">{error}</Alert>}
          {success && <Alert intent="success" className="mb-4">{success}</Alert>}

          {!preview ? (
            <FaceCaptureCamera
              onCapture={handleCapture}
              onCancel={() => navigate('/dashboard')}
              disabled={loading}
              buttonText="📷 Capturar Foto"
              showCancel={true}
            />
          ) : (
            <div className="space-y-4">
              {/* Preview de la foto capturada */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={preview}
                  alt="Foto capturada"
                  className="w-full h-auto max-h-[480px] mx-auto"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={retakePhoto}
                  variant="outline"
                  disabled={loading}
                  size="lg"
                >
                  🔄 Tomar Otra Foto
                </Button>
                <Button
                  onClick={registerFace}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Registrando...' : '✅ Registrar Cara'}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
              >
                ← Volver al Dashboard
              </Button>

              {hasRegistration && (
                <Button
                  onClick={deleteFaceRegistration}
                  variant="destructive"
                  size="sm"
                  disabled={loading}
                >
                  🗑️ Eliminar registro facial
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

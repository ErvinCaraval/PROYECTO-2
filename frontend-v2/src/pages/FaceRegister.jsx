import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Button from '../components/ui/Button';
import Alert from '../components/ui/Alert';
import { optimizeImage, getImageSize } from '../utils/imageOptimizer';

export default function FaceRegister() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Inicializar cámara al montar el componente
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
      console.error('Error accediendo a la cámara:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Error capturando la foto');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir canvas a Blob y luego a Base64 (calidad reducida para optimizar)
    canvas.toBlob(async (blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64String = reader.result;
          try {
            // Optimizar imagen antes de guardarla (reduce tamaño significativamente)
            // Usar 300x300 y calidad 0.6 para reducir aún más el tamaño y tiempo de procesamiento
            const optimized = await optimizeImage(base64String, 300, 300, 0.6);
            const originalSize = getImageSize(base64String);
            const optimizedSize = getImageSize(optimized);
            console.log(`Imagen optimizada: ${originalSize}KB → ${optimizedSize}KB (${Math.round((1 - optimizedSize/originalSize) * 100)}% reducción)`);
            setCapturedImage(optimized);
            setPreview(optimized);
          } catch (error) {
            console.error('Error optimizando imagen, usando original:', error);
            // Si falla la optimización, usar la original
            setCapturedImage(base64String);
            setPreview(base64String);
          }
        };
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
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
        stopCamera();
        
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
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto max-h-[480px]"
                />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <p className="text-white">Iniciando cámara...</p>
                  </div>
                )}
              </div>

              {/* Canvas oculto para captura */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Botones de control */}
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={capturePhoto}
                  disabled={!stream || loading}
                  size="lg"
                >
                  📷 Capturar Foto
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="outline"
                  disabled={!stream}
                  size="lg"
                >
                  ⏹️ Detener Cámara
                </Button>
              </div>

              <div className="text-center text-sm text-white/60">
                <p>💡 Asegúrate de tener buena iluminación</p>
                <p>💡 Mira directamente a la cámara</p>
                <p>💡 Mantén tu rostro centrado</p>
              </div>
            </div>
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
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              size="sm"
            >
              ← Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


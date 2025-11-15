import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { useVoice } from '../VoiceContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isVoiceModeEnabled, speak } = useVoice();

  // Voice announce helper
  const announce = (text) => {
    if (isVoiceModeEnabled) {
      speak(text, { action: 'text_read', questionId: 'login', metadata: { origin: 'login' } });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-h-screen px-4 py-10 grid place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold">⚡ BrainBlitz</h1>
          <h2 className="mt-2 text-xl font-bold">¡Bienvenido de nuevo!</h2>
          <p className="text-white/70">Inicia sesión para continuar tu aventura de trivia</p>
          {isVoiceModeEnabled && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={async () => {
                const parts = []
                parts.push('Estás en la página de inicio de sesión.')
                parts.push('Ingresa tu correo electrónico y contraseña para acceder a tu cuenta.')
                parts.push('Si no tienes cuenta, puedes registrarte con el enlace de abajo.')
                parts.push('Si olvidaste tu contraseña, puedes recuperarla.')
                speak(parts.join(' '), { action: 'page_guide', questionId: 'login', force: true })
              }}
              aria-label="Explicar la página"
            >
              🛈 Explicar página
            </Button>
          )}
        </div>

        <form onSubmit={handleLogin} className="grid gap-4">
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="email">Correo electrónico</label>
            <Input 
              id="email" 
              type="email" 
              placeholder="tú@correo.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              disabled={loading}
              onFocus={() => announce('Campo de correo electrónico')}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="password">Contraseña</label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              disabled={loading}
              onFocus={() => announce('Campo de contraseña')}
            />
          </div>

          {error && <Alert intent="error">{error}</Alert>}

          <Button 
            type="submit" 
            size="lg" 
            disabled={loading}
            onFocus={() => announce('Botón para iniciar sesión')}
            onMouseEnter={() => announce('Botón para iniciar sesión')}
          >
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="mt-6 space-y-1 text-center text-sm">
          <p>
            ¿No tienes cuenta? <Link 
              className="underline" 
              to="/register"
              onFocus={() => announce('Enlace para registrarse')}
              onMouseEnter={() => announce('Enlace para registrarse')}
            >
              Regístrate aquí
            </Link>
          </p>
          <p>
            <Link 
              className="underline" 
              to="/reset"
              onFocus={() => announce('Enlace para recuperar contraseña')}
              onMouseEnter={() => announce('Enlace para recuperar contraseña')}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p>
            <Link 
              className="underline" 
              to="/face-login"
              onFocus={() => announce('Enlace para login facial')}
              onMouseEnter={() => announce('Enlace para login facial')}
            >
              🔐 Iniciar sesión con reconocimiento facial
            </Link>
          </p>
          <p className="text-white/60 text-xs mt-2">
            💡 ¿No tienes registro facial? Regístrate primero y automáticamente te pediremos registrar tu cara
          </p>
        </div>
      </div>
    </div>
  );
}
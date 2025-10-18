import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visualDifficulty, setVisualDifficulty] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Register with backend API (which handles Firebase Auth internally)
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName: email.split('@')[0], // Use email prefix as default display name
          visualDifficulty
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error registering with backend');
      }

      // Backend registration successful, now sign in with Firebase Auth
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/complete-profile');
      } catch (firebaseError) {
        // If Firebase Auth fails, the user might already exist, try to sign in instead
        if (firebaseError.code === 'auth/email-already-in-use') {
          // User already exists, try to sign in
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/complete-profile');
        } else {
          throw firebaseError;
        }
      }
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
          <h2 className="mt-2 text-xl font-bold">¡Únete a la diversión!</h2>
          <p className="text-white/70">Crea tu cuenta y comienza a jugar</p>
        </div>

        <form onSubmit={handleRegister} className="grid gap-4">
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="email">Correo electrónico</label>
            <Input id="email" type="email" placeholder="tú@correo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="password">Contraseña</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          </div>

          <div className="flex items-start gap-3">
            <input
              id="visualDifficulty"
              type="checkbox"
              checked={visualDifficulty}
              onChange={e => setVisualDifficulty(e.target.checked)}
              disabled={loading}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
              aria-describedby="visualDifficulty-description"
            />
            <div className="flex-1">
              <label htmlFor="visualDifficulty" className="block text-sm text-white/80 cursor-pointer">
                Tengo dificultades visuales
              </label>
              <p id="visualDifficulty-description" className="text-xs text-white/60 mt-1">
                Esta opción activará automáticamente el modo de voz para una mejor experiencia de accesibilidad
              </p>
            </div>
          </div>

          {error && <Alert intent="error">{error}</Alert>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p>
            ¿Ya tienes cuenta? <Link className="underline" to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
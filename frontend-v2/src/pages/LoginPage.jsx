import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        </div>

        <form onSubmit={handleLogin} className="grid gap-4">
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="email">Correo electrónico</label>
            <Input id="email" type="email" placeholder="tú@correo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div>
            <label className="block mb-1 text-sm text-white/80" htmlFor="password">Contraseña</label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
          </div>

          {error && <Alert intent="error">{error}</Alert>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </Button>
        </form>

        <div className="mt-6 space-y-1 text-center text-sm">
          <p>
            ¿No tienes cuenta? <Link className="underline" to="/register">Regístrate aquí</Link>
          </p>
          <p>
            <Link className="underline" to="/reset">¿Olvidaste tu contraseña?</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
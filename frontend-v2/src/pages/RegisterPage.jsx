import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // The Firebase SDK signs the user in automatically after successful signup.
      // Guardar visualDifficulty en Firestore si está marcado
      if (visualDifficulty && userCredential.user) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: email,
          visualDifficulty: true,
          stats: { gamesPlayed: 0, wins: 0, correctAnswers: 0 }
        }, { merge: true });
      }
      // Redirigir directamente a registro facial después de crear la cuenta
      navigate('/face-register');
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

          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
            <input
              id="visualDifficulty"
              type="checkbox"
              checked={visualDifficulty}
              onChange={e => setVisualDifficulty(e.target.checked)}
              disabled={loading}
              className="h-4 w-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="visualDifficulty" className="text-sm text-white/80 cursor-pointer">
              Tengo dificultades visuales
            </label>
          </div>

          {error && <Alert intent="error">{error}</Alert>}

          <Button type="submit" size="lg" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm space-y-2">
          <p>
            ¿Ya tienes cuenta? <Link className="underline" to="/login">Inicia sesión aquí</Link>
          </p>
          <p className="text-white/60 text-xs">
            💡 Después de crear tu cuenta, automáticamente te pediremos registrar tu cara para habilitar el login facial
          </p>
        </div>
      </div>
    </div>
  );
}
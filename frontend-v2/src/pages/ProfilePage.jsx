import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Alert from '../components/ui/Alert';

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState('');
  const [apiRaw, setApiRaw] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      let statsData = null;
      try {
  const apiBase = import.meta.env.VITE_API_URL;
        // Obtener el token de Firebase
        const token = user && (await user.getIdToken());
        const statsRes = await fetch(`${apiBase}/api/users/me/stats?uid=${user.uid}`,
          {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          }
        );
        if (statsRes.ok) {
          statsData = await statsRes.json();
          setApiRaw(statsData);
        } else {
          setApiError(`Error HTTP: ${statsRes.status}`);
        }
      } catch (err) {
        setApiError('Error de conexión: ' + err.message);
      }
      setStats(statsData?.stats || null);
      setLoading(false);
    }
    fetchProfile();
  }, [user]);

  if (loading) return (
    <div className="px-4 py-10 min-h-screen container">
      <Card>
        <CardBody>
          <div className="loading-spinner" aria-busy="true">Cargando perfil...</div>
        </CardBody>
      </Card>
    </div>
  );
  return (
    <div className="container min-h-screen px-4 py-8 pt-24">
      <Card className="mx-auto max-w-3xl">
        <CardHeader className="flex items-center gap-4">
          <img
            src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid || 'user'}`}
            alt="avatar"
            className="bg-white/10 rounded-full w-16 h-16"
            loading="lazy"
            decoding="async"
          />
          <div>
            <h2 className="font-bold text-2xl">{user?.displayName || user?.email}</h2>
            <span className="text-white/70 text-sm">UID: ******</span>
          </div>
        </CardHeader>
        <CardBody>
          <h3 className="mb-3 font-semibold text-xl">Estadísticas</h3>
          {apiError && <Alert intent="error" className="mb-3">{apiError}</Alert>}
          {stats ? (
            <div className="gap-4 grid grid-cols-1 sm:grid-cols-3">
              <div className="bg-white/5 px-4 py-3 border border-white/10 rounded-xl">
                <div className="text-white/70 text-sm">Partidas jugadas</div>
                <div className="font-bold text-2xl">{stats.gamesPlayed}</div>
              </div>
              <div className="bg-white/5 px-4 py-3 border border-white/10 rounded-xl">
                <div className="text-white/70 text-sm">Victorias</div>
                <div className="font-bold text-2xl">{stats.wins}</div>
              </div>
              <div className="bg-white/5 px-4 py-3 border border-white/10 rounded-xl">
                <div className="text-white/70 text-sm">Respuestas correctas</div>
                <div className="font-bold text-2xl">{stats.correctAnswers}</div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-white/70">No hay estadísticas.</p>
              {apiRaw && (
                <details className="mt-2">
                  <summary className="underline cursor-pointer">Respuesta de la API</summary>
                  <pre className="bg-black/40 mt-2 p-3 rounded-xl overflow-auto text-xs">{JSON.stringify(apiRaw, null, 2)}</pre>
                </details>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
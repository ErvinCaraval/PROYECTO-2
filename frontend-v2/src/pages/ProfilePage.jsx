import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useVoice } from '../VoiceContext';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import VoiceSettings from '../components/VoiceSettings';
import VoiceHistory from '../components/VoiceHistory';
import AudioTutorial from '../components/AudioTutorial';
// Removed diagnostic from profile per request

function ProfilePage() {
  const { user } = useAuth();
  const { userHasVisualDifficulty, isVoiceModeEnabled, toggleVoiceMode } = useVoice();
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState('');
  const [apiRaw, setApiRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

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
  const tabs = [
    { id: 'profile', label: 'Perfil', icon: '👤' },
    { id: 'voice-settings', label: 'Configuración de Voz', icon: '🎤' },
    { id: 'voice-history', label: 'Historial de Voz', icon: '📊' },
    { id: 'tutorial', label: 'Tutorial', icon: '📚' }
  ];

  return (
    <div className="container min-h-screen px-4 py-8 pt-24">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* User Profile Header */}
        <Card>
          <CardHeader className="flex items-center gap-6 p-6">
            <img
              src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user?.uid || 'user'}`}
              alt="avatar"
              className="bg-white/10 rounded-full w-16 h-16 flex-shrink-0"
              loading="lazy"
              decoding="async"
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-2xl mb-3">{user?.displayName || user?.email}</h2>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-white/70 text-sm">UID: ******</span>
                {userHasVisualDifficulty && (
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                    ♿ Accesibilidad habilitada
                  </span>
                )}
                <button
                  onClick={toggleVoiceMode}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${isVoiceModeEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400 hover:bg-green-500/20 hover:text-green-400'}`}
                  aria-pressed={isVoiceModeEnabled}
                  type="button"
                >
                  {isVoiceModeEnabled ? '🎤 Modo de voz activo' : '🎤 Activar modo de voz'}
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/70 hover:text-white/90'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <h3 className="text-xl font-semibold">Estadísticas del Juego</h3>
            </CardHeader>
            <CardBody>
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
        )}

        {activeTab === 'voice-settings' && <VoiceSettings />}
        {activeTab === 'voice-history' && <VoiceHistory />}
        {activeTab === 'tutorial' && (
          <AudioTutorial 
            onComplete={() => setActiveTab('profile')}
            onSkip={() => setActiveTab('profile')}
          />
        )}
        {/* Diagnostic tab removed */}
      </div>
    </div>
  );
}

export default ProfilePage;
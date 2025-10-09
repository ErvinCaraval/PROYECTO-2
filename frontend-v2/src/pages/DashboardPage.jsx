import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import Section from '../components/ui/Section';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Skeleton, { SkeletonText } from '../components/ui/Skeleton';
import LoadingOverlay from '../components/ui/LoadingOverlay';
const AIQuestionGenerator = React.lazy(() => import('../components/AIQuestionGenerator'));

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [gameCode, setGameCode] = useState('');
  const [publicGames, setPublicGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPublicGames();
  }, []);

  const fetchPublicGames = async () => {
    try {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiBase}/api/games`);
      const data = await response.json();
      const gamesArray = Array.isArray(data) ? data : [];
      setPublicGames(gamesArray);
    } catch (error) {
      console.error('Error fetching games:', error);
      setPublicGames([]);
    }
  };

  const connectSocket = async () => {
    const socket = await getSocket();
    if (socket.connected) return socket;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const connectionTimeout = isMobile ? 15000 : 8000; // Timeout más largo para móviles
    
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        socket.off('connect', onConnect);
        socket.off('connect_error', onError);
        reject(new Error('Timeout de conexión'));
      }, connectionTimeout);
      
      const onConnect = () => {
        clearTimeout(timeoutId);
        socket.off('connect_error', onError);
        resolve();
      };
      const onError = (err) => {
        clearTimeout(timeoutId);
        socket.off('connect', onConnect);
        reject(err);
      };
      socket.once('connect', onConnect);
      socket.once('connect_error', onError);
      socket.connect();
    });
    return socket;
  };

  const handleCreateGame = async () => {
    if (!selectedTopic) {
      setErrorMessage('Por favor selecciona un tema antes de crear la partida.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    if (!generatedQuestions.length) {
      setErrorMessage('Primero genera preguntas con IA antes de crear la partida.');
      setShowAIGenerator(true);
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    // Forzar que todas las preguntas tengan el category igual al tema seleccionado
    const fixedQuestions = generatedQuestions.map(q => ({ ...q, category: selectedTopic }));
    setLoading(true);
    let timeoutId;
    try {
      const socket = await connectSocket();
      // Limpiar posibles listeners previos
      socket.off('gameCreated');
      socket.off('error');
      
      // Temporizador de seguridad - más largo para dispositivos móviles
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const timeoutDuration = isMobile ? 20000 : 10000; // 20s para móviles, 10s para desktop
      
      timeoutId = setTimeout(() => {
        setLoading(false);
        setErrorMessage('Tiempo de espera al crear la partida. Verifica tu conexión e inténtalo de nuevo.');
        setTimeout(() => setErrorMessage(''), 5000);
      }, timeoutDuration);
    // Obtener el token de autenticación del usuario
    let token = null;
    if (user && user.getIdToken) {
      token = await user.getIdToken();
    }
      socket.emit('createGame', {
      hostId: user.uid,
      displayName: user.displayName || user.email,
      isPublic: true,
      token,
      topic: selectedTopic,
      questions: fixedQuestions,
      count: fixedQuestions.length
      });
      socket.once('gameCreated', ({ gameId, questions }) => {
        clearTimeout(timeoutId);
        setLoading(false);
        setSuccessMessage(`¡Tu partida fue creada con ${questions?.length || 0} preguntas! Invita a tus amigos y disfruta. 🚀`);
        setTimeout(() => setSuccessMessage(''), 5000);
        
        // Asegurar que el socket esté conectado antes de navegar
        if (socket.connected) {
          setTimeout(() => navigate(`/lobby/${gameId}`), 800);
        } else {
          // Si no está conectado, reconectar y luego navegar
          socket.connect();
          socket.once('connect', () => {
            setTimeout(() => navigate(`/lobby/${gameId}`), 500);
          });
        }
      });
      socket.once('error', ({ error }) => {
        clearTimeout(timeoutId);
        setLoading(false);
        setErrorMessage('Ocurrió un error al crear la partida: ' + error);
        setTimeout(() => setErrorMessage(''), 5000);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      setLoading(false);
      setErrorMessage('No se pudo conectar con el servidor. Intenta de nuevo.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleJoinGame = () => {
    if (!gameCode.trim()) {
      setErrorMessage('Por favor ingresa un código de partida.');
      setTimeout(() => setErrorMessage(''), 4000);
      return;
    }
    navigate(`/lobby/${gameCode}`);
  };

  const handleJoinPublicGame = (gameId) => {
  setSuccessMessage('¡Te uniste a la partida! Cargando sala...');
  setTimeout(() => setSuccessMessage(''), 4000);
  setTimeout(() => navigate(`/lobby/${gameId}`), 1200);
  };

  const handleQuestionsGenerated = (questions) => {
    setGeneratedQuestions(questions);
    if (questions && questions.length > 0 && questions[0].category) {
      setSelectedTopic(questions[0].category);
    }
    setSuccessMessage(`¡Listo! Se generaron ${questions.length} preguntas para el tema "${questions[0]?.category || ''}". 🎉`);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleDeleteGame = async (gameId) => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = await user.getIdToken(); // Obtener el token JWT del usuario

      const response = await fetch(`${apiBase}/api/games/${gameId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('No se pudo eliminar la partida.');
      }

      setPublicGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
      setSuccessMessage('¡Partida eliminada con éxito!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error(error);
      setErrorMessage('Hubo un problema al intentar eliminar la partida. Por favor, inténtalo de nuevo.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="min-h-screen">
      {loading && <LoadingOverlay text="Creando partida…" mobileOnly />}
      {(successMessage || errorMessage) && (
        <div aria-live="polite" className="top-6 z-[2000] fixed inset-x-0 flex justify-center px-4">
          <Alert intent={errorMessage ? 'error' : 'success'} className="shadow-xl">
            {errorMessage || successMessage}
          </Alert>
        </div>
      )}

      <header className="top-0 z-40 sticky bg-white/5 backdrop-blur-md border-white/10 border-b w-full py-2 mb-16">
        <div className="flex md:flex-row flex-col md:justify-between md:items-center gap-4 px-4 py-5 container">
          <h2 className="font-bold text-2xl md:text-3xl tracking-tight">
            ¡Bienvenido, {user?.displayName || user?.email}!
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate('/profile')} aria-label="Ir a tu perfil">
              Perfil
            </Button>
            <Button variant="outline" onClick={logout} aria-label="Cerrar sesión">
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-8 md:py-10 container pt-8">
        <div className="gap-6 md:gap-8 grid grid-cols-1 md:grid-cols-2">
          <Section
            title="🎮 Crear nueva partida"
            subtitle="Inicia una partida y invita a tus amigos"
          >
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleCreateGame}
                disabled={loading}
                title="Primero genera preguntas con IA para que tu partida tenga contenido."
                size="lg"
              >
                {loading ? 'Creando…' : 'Crear partida'}
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowAIGenerator(true)}
                title="Genera preguntas personalizadas antes de crear tu partida."
              >
                🤖 Generar preguntas
              </Button>
              <div className="bg-indigo-500/10 px-4 py-3 border border-indigo-400/20 rounded-xl text-white/85 text-sm">
                <strong className="text-indigo-300">💡 Ayuda:</strong> Antes de crear una partida, puedes generar preguntas automáticamente o agregar preguntas manuales personalizadas. Así tu juego tendrá contenido único, reciente y adaptado a tus necesidades.
              </div>
            </div>
          </Section>

          <Section title="🔗 Unirse a partida" subtitle="Ingresa un código de 6 caracteres para unirte">
            <form
              className="flex sm:flex-row flex-col items-stretch gap-3"
              onSubmit={(e) => { e.preventDefault(); handleJoinGame(); }}
              aria-labelledby="join-section-title"
            >
              <label htmlFor="gameCode" className="sr-only">Código de partida</label>
              <Input
                id="gameCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Código (6)"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value)}
                maxLength={6}
                className="font-semibold text-center tracking-widest"
              />
              <Button type="submit" variant="secondary">
                Unirse
              </Button>
            </form>
          </Section>
        </div>

        <Section title="🌐 Partidas públicas" subtitle="Únete a partidas abiertas para todos" className="mt-8">
          {!Array.isArray(publicGames) ? null : publicGames.length === 0 ? (
            <div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex justify-between items-center pb-3">
                    <Skeleton className="w-40 h-5" />
                    <Skeleton className="rounded-full w-16 h-6" />
                  </CardHeader>
                  <CardBody className="flex justify-between items-center gap-4">
                    <SkeletonText lines={2} />
                    <Skeleton className="rounded-xl w-24 h-10" />
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div className="gap-4 sm:gap-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}>
              <AnimatePresence>
                {publicGames.map((game, idx) => (
                  <motion.div key={game.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
                    <Card className="group hover:shadow-glow transition hover:-translate-y-0.5">
                      <CardHeader className="flex justify-between items-center pb-3">
                        <h4 className="font-semibold text-xl">Partida #{game.id}</h4>
                        <Badge variant={idx % 2 ? 'violet' : 'emerald'}>{game.topic || 'Pública'}</Badge>
                      </CardHeader>
                      <CardBody className="flex sm:flex-row flex-col justify-between items-center gap-4">
                        <div className="text-white/80 text-sm">
                          <p>Jugadores: {game.players?.length || 0}</p>
                          <p>Anfitrión: {game.players?.[0]?.displayName || 'Desconocido'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleJoinPublicGame(game.id)} aria-label={`Unirse a la partida ${game.id}`}>
                            Unirse
                          </Button>
                          <Button
  onClick={() => handleDeleteGame(game.id)}
  variant="danger"
  aria-label={`Eliminar la partida ${game.id}`}
>
  Eliminar
</Button>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </Section>
      </main>

      {showAIGenerator && (
        <Suspense fallback={<div className="px-4 py-6 container"><div className="loading-spinner" aria-live="polite" aria-busy="true">Cargando…</div></div>}>
          <AIQuestionGenerator
            onQuestionsGenerated={(qs) => {
              handleQuestionsGenerated(qs);
              setShowAIGenerator(false);
            }}
            onClose={() => setShowAIGenerator(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
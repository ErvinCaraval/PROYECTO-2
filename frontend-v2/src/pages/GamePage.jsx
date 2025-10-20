import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useVoice } from '../VoiceContext';
import { getSocket } from '../services/socket';
import Question from '../components/Question';
import Timer from '../components/Timer';
import Ranking from '../components/Ranking';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import Alert from '../components/ui/Alert';

export default function GamePage() {
  const [questionTimeout, setQuestionTimeout] = useState(false);
  const { gameId } = useParams();
  const { user } = useAuth();
  const { isVoiceModeEnabled, speak } = useVoice();

  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selected, setSelected] = useState(null);
  const [players, setPlayers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);

  const navigate = useNavigate();

  // 🔁 Refs reactivas para valores usados en callbacks
  const totalQuestionsRef = useRef(totalQuestions);
  const selectedRef = useRef(selected);
  const questionRef = useRef(question);

  useEffect(() => { totalQuestionsRef.current = totalQuestions; }, [totalQuestions]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { questionRef.current = question; }, [question]);

  // 🔌 Configuración principal del socket
  useEffect(() => {
    if (!user || !gameId) return;

    let timeoutId;
    (async () => {
      const socket = await getSocket();

      if (!socket.connected) {
        console.log('[GamePage] Conectando socket...');
        socket.connect();
      }

      // Solicita la primera pregunta
      socket.emit('requestQuestion', { gameId });
      console.log('[GamePage] Solicitud de primera pregunta:', { gameId });

      timeoutId = setTimeout(() => {
        if (!questionRef.current) setQuestionTimeout(true);
      }, 5000);

      // --- Eventos del servidor ---
      socket.on('connect', () => {
        console.log('[GamePage] Socket conectado:', socket.id);
      });

      socket.on('newQuestion', ({ question, index, timeout }) => {
        console.log('[GamePage] newQuestion recibido:', question);

        const options = Array.isArray(question.options) ? question.options : [];
        setQuestion({ ...question, options });
        setQuestionIndex(index);
        setSelected(null);
        setShowResult(false);

        const questionTimeout = typeof timeout === 'number'
          ? timeout
          : (isVoiceModeEnabled ? 120 : 10);

        setTimeLeft(questionTimeout);
        setTimerKey(prev => prev + 1);

        // 🗣️ Voz
        if (isVoiceModeEnabled && question.text && options.length > 0) {
          const tq = totalQuestionsRef.current || '?';
          let toSpeak = `Pregunta ${index + 1} de ${tq}. ${question.text}`;
          options.forEach((opt, i) => {
            toSpeak += `. Opción ${String.fromCharCode(65 + i)}: ${opt}`;
          });
          speak(toSpeak, {
            action: 'new_question_full',
            questionId: question.id || `question_${index}`,
            metadata: { questionIndex: index, totalQuestions: tq, gameId }
          });
        }
      });

      socket.on('answerResult', ({ correctAnswerIndex, explanation, players }) => {
        console.log('[GamePage] answerResult recibido:', { correctAnswerIndex, explanation });
        setShowResult(true);
        setResult({ correctAnswerIndex, explanation });
        setPlayers(players);

        const userSelected = selectedRef.current;
        if (isVoiceModeEnabled && userSelected !== null && typeof correctAnswerIndex === 'number') {
          const isCorrect = userSelected === correctAnswerIndex;
          speak(isCorrect ? '¡Respuesta correcta!' : 'Respuesta incorrecta.', {
            action: 'answer_result',
            questionId: questionRef.current?.id || `question_${questionIndex}`,
            metadata: {
              isCorrect,
              selectedIndex: userSelected,
              correctIndex: correctAnswerIndex,
              explanation
            }
          });
        }
      });

      socket.on('gameFinished', ({ players }) => {
        console.log('[GamePage] gameFinished recibido:', players);
        if (isVoiceModeEnabled) {
          const userPlayer = players.find(p => p.uid === user.uid);
          const position = players.findIndex(p => p.uid === user.uid) + 1;
          speak(`¡Juego terminado! Obtuviste el puesto ${position} de ${players.length} jugadores.`, {
            action: 'game_finished',
            questionId: 'game',
            metadata: {
              position,
              totalPlayers: players.length,
              score: userPlayer?.score || 0
            }
          });
        }
        navigate(`/summary/${gameId}`, { state: { players } });
      });

      socket.on('gameStarted', ({ questionsCount }) => {
        console.log('[GamePage] gameStarted recibido:', questionsCount);
        setTotalQuestions(questionsCount);
        if (isVoiceModeEnabled) {
          speak(`¡Juego iniciado! Tendrás ${questionsCount} preguntas para responder.`, {
            action: 'game_started',
            questionId: 'game',
            metadata: { questionsCount, gameId }
          });
        }
        socket.emit('requestQuestion', { gameId });
      });
    })();

    return () => {
      clearTimeout(timeoutId);
      (async () => {
        const socket = await getSocket();
        socket.off('connect');
        socket.off('newQuestion');
        socket.off('answerResult');
        socket.off('gameFinished');
        socket.off('gameStarted');
      })();
    };
  }, [user, gameId, navigate, isVoiceModeEnabled, speak]);

  // ⏱️ Lógica del temporizador
  const handleSelect = useCallback((idx) => {
    if (selected !== null) return;
    setSelected(idx);
    const answerValue = questionRef.current?.options?.[idx];
    (async () => {
      const socket = await getSocket();
      socket.emit('submitAnswer', { gameId, uid: user.uid, answerIndex: idx, answerValue });
    })();
  }, [gameId, user, selected]);

  const handleTimerEnd = useCallback(() => {
    if (selected === null) {
      (async () => {
        const socket = await getSocket();
        socket.emit('submitAnswer', { gameId, uid: user.uid, answerIndex: null, answerValue: null });
      })();
    }
  }, [gameId, user, selected]);

  const handleTimerWarning = useCallback((remaining) => {
    if (isVoiceModeEnabled && remaining <= 3 && remaining > 0) {
      speak(`¡Atención! Te quedan ${remaining} segundos para responder.`, {
        action: 'timer_warning',
        questionId: questionRef.current?.id || `question_${questionIndex}`,
        metadata: { timeLeft: remaining }
      });
    }
  }, [isVoiceModeEnabled, speak, questionIndex]);

  const getPlayerRank = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const playerIndex = sortedPlayers.findIndex(p => p.uid === user.uid);
    return playerIndex >= 0 ? playerIndex + 1 : '-';
  };

  return (
    <div className="container min-h-screen px-4 py-4 md:py-6 grid gap-4 md:gap-6 lg:grid-cols-[2fr_1fr]">
      <header className="flex items-start md:items-end justify-between gap-3 md:gap-4 lg:col-span-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">🎯 Juego de Preguntas</h2>
          <div className="mt-2 flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm text-white/80">
              Pregunta {questionIndex + 1} de {totalQuestions || '?'}
            </span>
            <div className="h-2 w-32 md:w-48 rounded-full bg-white/10">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-bb-primary to-bb-accent"
                style={{ width: `${((questionIndex + 1) / (totalQuestions || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-lg md:text-xl font-bold">#{getPlayerRank()}</div>
          <div className="text-[10px] md:text-xs text-white/70">Tu posición</div>
          {isVoiceModeEnabled && (
            <button
              className="mt-2 px-3 py-2 rounded-md text-xs md:text-sm bg-white/10 hover:bg-white/20 border border-white/20"
              onClick={() => {
                const parts = [
                  'Estás en la página del juego de preguntas.',
                  `Progreso: pregunta ${questionIndex + 1} de ${totalQuestions || 'desconocido'}.`,
                  'A la izquierda está la pregunta y las opciones. Usa clic o teclado para responder.',
                  'A la derecha verás el temporizador.',
                  'Más abajo aparecerá si tu respuesta fue correcta y la explicación.',
                  'A la derecha de la página está el ranking con la puntuación de los jugadores.'
                ];
                speak(parts.join(' '), { action: 'page_guide', questionId: 'game', metadata: { gameId } });
              }}
            >
              🛈 Explicar página
            </button>
          )}
        </div>
      </header>

      <main className="space-y-4">
        {question ? (
          <Card className="transition hover:shadow-glow">
            <CardBody className="space-y-4 pt-4">
              <div className="flex items-start justify-between gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <Question
                    text={question.text}
                    options={question.options}
                    onSelect={handleSelect}
                    selected={selected}
                    showResult={showResult}
                    correctIndex={result?.correctAnswerIndex ?? null}
                  />
                </div>
                <div className="shrink-0 pt-1">
                  <Timer
                    key={timerKey}
                    seconds={selected === null ? timeLeft : 0}
                    onEnd={handleTimerEnd}
                    onTick={(remaining) => {
                      setTimeLeft(remaining);
                      handleTimerWarning(remaining);
                    }}
                  />
                </div>
              </div>

              {showResult && result && (
                <Alert intent="info">
                  <div className="font-semibold mb-1">✅ ¡Respuesta revelada!</div>
                  <div><strong>Correcta:</strong> {question.options[result.correctAnswerIndex]}</div>
                  {result.explanation && (
                    <div className="mt-2 text-white/90"><strong>Explicación:</strong> {result.explanation}</div>
                  )}
                </Alert>
              )}
            </CardBody>
          </Card>
        ) : !questionTimeout ? (
          <div className="flex items-center gap-3 text-white/80">
            <div className="loading-spinner" />
            <p>Esperando la siguiente pregunta...</p>
          </div>
        ) : (
          <Alert intent="error">
            No se encontraron preguntas para este tema. Verifica que hayas generado preguntas y que el tema coincida exactamente.
          </Alert>
        )}
      </main>

      <aside>
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-xl md:text-2xl font-semibold">Ranking</h3>
          </CardHeader>
          <CardBody>
            <Ranking players={players} />
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}

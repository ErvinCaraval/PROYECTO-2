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
  const { isVoiceModeEnabled, speak, voiceInteractionsService } = useVoice();
  const [question, setQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selected, setSelected] = useState(null);
  // Referencia reactiva para selected
  const selectedRef = useRef(selected);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  const [players, setPlayers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [, setTimeLeft] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const socket = await getSocket();
      // Solicitar la primera pregunta al conectar
      if (user && gameId) {
        socket.emit('requestQuestion', { gameId });
        console.log('[GamePage] Emitiendo requestQuestion:', { gameId });
      }

      // Si no llega pregunta en 5 segundos, mostrar error
    })();
    // Si no llega pregunta en 5 segundos, mostrar error
    setTimeout(() => {
      if (!question) setQuestionTimeout(true);
    }, 5000);

    if (!user) return;
    const setup = async () => {
      const socket = await getSocket();
      if (!socket.connected) {
        console.log('[GamePage] Intentando conectar socket...');
        socket.connect();
      }
    // Listeners nombrados para evitar duplicados
    function onConnect() {
      console.log('[GamePage] Socket conectado:', socket.id);
    }
    function onNewQuestion({ question, index, timeout }) {
      console.log('[GamePage] Evento newQuestion recibido:', question);
      // Asegurarse de que las opciones no se barajen ni modifiquen
      // y que el índice de la respuesta correcta corresponda al array recibido
      if (!Array.isArray(question.options)) {
        question.options = [];
      }
      setQuestion({
        ...question,
        options: [...question.options], // Copia directa, sin barajar
      });
      setQuestionIndex(index);
      setSelected(null);
      setShowResult(false);
      // Usar el timeout recibido del backend, o fallback según modo de voz
      const questionTimeout = typeof timeout === 'number' ? timeout : (isVoiceModeEnabled ? 120 : 10);
      setTimeLeft(questionTimeout);
      setTimerKey(prev => prev + 1);

      // Voice mode integration - announce new question
      if (isVoiceModeEnabled && user) {
        speak(`Pregunta ${index + 1} de ${totalQuestions}. ${question.text}`, {
          action: 'new_question',
          questionId: question.id || `question_${index}`,
          metadata: {
            questionIndex: index,
            totalQuestions,
            gameId
          }
        });
      }
    }
    function onAnswerResult({ correctAnswerIndex, explanation, players }) {
      console.log('[GamePage] Evento answerResult recibido:', { correctAnswerIndex, explanation, players });
      setShowResult(true);
      setResult({ correctAnswerIndex, explanation });
      setPlayers(players);
      // Voice mode integration - announce result
      if (isVoiceModeEnabled && user) {
        // Usar el valor más reciente de selected
        const userSelected = selectedRef.current;
        const isCorrect = userSelected === correctAnswerIndex;
        const resultMessage = isCorrect 
          ? '¡Respuesta correcta!' 
          : `Respuesta incorrecta. La respuesta correcta era: ${question?.options[correctAnswerIndex]}`;
        speak(resultMessage, {
          action: 'answer_result',
          questionId: question?.id || `question_${questionIndex}`,
          metadata: {
            isCorrect,
            selectedIndex: userSelected,
            correctIndex: correctAnswerIndex,
            explanation
          }
        });
      }
    }
    function onGameFinished({ players }) {
      console.log('[GamePage] Evento gameFinished recibido:', players);
      
      // Voice mode integration - announce game finished
      if (isVoiceModeEnabled && user) {
        const userPlayer = players.find(p => p.uid === user.uid);
        const position = players.findIndex(p => p.uid === user.uid) + 1;
        const totalPlayers = players.length;
        
        speak(`¡Juego terminado! Obtuviste el puesto ${position} de ${totalPlayers} jugadores.`, {
          action: 'game_finished',
          questionId: 'game',
          metadata: {
            position,
            totalPlayers,
            score: userPlayer?.score || 0
          }
        });
      }
      
      navigate(`/summary/${gameId}`, { state: { players } });
    }
    function onGameStarted({ questionsCount }) {
      console.log('[GamePage] Evento gameStarted recibido:', questionsCount);
      setTotalQuestions(questionsCount);
      
      // Voice mode integration - announce game started
      if (isVoiceModeEnabled && user) {
        speak(`¡Juego iniciado! Tendrás ${questionsCount} preguntas para responder.`, {
          action: 'game_started',
          questionId: 'game',
          metadata: {
            questionsCount,
            gameId
          }
        });
      }
    }

      socket.on('connect', onConnect);
      socket.on('newQuestion', onNewQuestion);
      socket.on('answerResult', onAnswerResult);
      socket.on('gameFinished', onGameFinished);
      socket.on('gameStarted', onGameStarted);
    };
    setup();

    return () => {
      (async () => {
        const socket = await getSocket();
        // remove all listeners for these events (handlers were defined inside setup)
        socket.off('connect');
        socket.off('newQuestion');
        socket.off('answerResult');
        socket.off('gameFinished');
        socket.off('gameStarted');
      })();
    };
  }, [user, gameId, navigate]);

  const questionRef = useRef(question);
  questionRef.current = question;

  const handleSelect = useCallback((idx) => {
    if (selected !== null) return; // Prevent multiple selections
    setSelected(idx);
    // Enviar también el valor de la opción seleccionada
    const answerValue = questionRef.current && Array.isArray(questionRef.current.options) ? questionRef.current.options[idx] : undefined;
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

  // Voice mode timer warning
  const handleTimerWarning = useCallback((timeLeft) => {
    if (isVoiceModeEnabled && user && timeLeft <= 3 && timeLeft > 0) {
      speak(`¡Atención! Te quedan ${timeLeft} segundos para responder.`, {
        action: 'timer_warning',
        questionId: question?.id || `question_${questionIndex}`,
        metadata: { timeLeft }
      });
    }
  }, [isVoiceModeEnabled, user, question, questionIndex, speak]);

  // const getOptionColor = (index) => {
  //   if (!showResult) {
  //     return selected === index ? 'selected' : '';
  //   }
  //   
  //   if (index === result.correctAnswerIndex) {
  //     return 'correct';
  //   }
  //   
  //   if (selected === index && index !== result.correctAnswerIndex) {
  //     return 'incorrect';
  //   }
  //   
  //   return '';
  // };

  const getPlayerRank = () => {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const playerIndex = sortedPlayers.findIndex(p => p.uid === user.uid);
    return playerIndex + 1;
  };

  return (
    <div className="container min-h-screen px-4 py-4 md:py-6 grid gap-4 md:gap-6 lg:grid-cols-[2fr_1fr]">
      <header className="flex items-start md:items-end justify-between gap-3 md:gap-4 lg:col-span-2">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold">🎯 Juego de Preguntas</h2>
          <div className="mt-2 flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm text-white/80 whitespace-nowrap">Pregunta {questionIndex + 1} de {totalQuestions || '?'}</span>
            <div className="h-2 w-32 md:w-48 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-bb-primary to-bb-accent" style={{ width: `${((questionIndex + 1) / (totalQuestions || 1)) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-lg md:text-xl font-bold">#{getPlayerRank()}</div>
          <div className="text-[10px] md:text-xs text-white/70">Tu posición</div>
        </div>
      </header>

      <main className="space-y-4">
        {question && (
          <Card className="transition hover:shadow-glow">
            <CardBody className="space-y-4 pt-4">
              <div className="flex items-start justify-between gap-3 md:gap-4">
                <div className="min-w-0 flex-1">
                  <Question
                    text={question.text}
                    question={question.question}
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
                    seconds={selected === null ? (typeof timeLeft === 'number' ? timeLeft : (isVoiceModeEnabled ? 120 : 10)) : 0}
                    onEnd={handleTimerEnd}
                    onTick={(timeLeft) => {
                      setTimeLeft(timeLeft);
                      handleTimerWarning(timeLeft);
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
        )}

        {!question && !questionTimeout && (
          <div className="flex items-center gap-3 text-white/80">
            <div className="loading-spinner" />
            <p>Esperando la siguiente pregunta...</p>
          </div>
        )}
        {!question && questionTimeout && (
          <Alert intent="error">No se encontraron preguntas para este tema. Verifica que hayas generado preguntas y que el tema coincida exactamente.</Alert>
        )}
      </main>

      <aside>
        <Card>
          <CardHeader className="pb-2"><h3 className="text-xl md:text-2xl font-semibold">Ranking</h3></CardHeader>
          <CardBody>
            <Ranking players={players} />
          </CardBody>
        </Card>
      </aside>
    </div>
  );
}
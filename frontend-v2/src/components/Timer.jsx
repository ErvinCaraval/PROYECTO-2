import React, { useEffect, useState, useRef, useCallback } from 'react';

export default function Timer({ seconds = 20, onEnd, onTick }) {
  const [time, setTime] = useState(seconds);
  const intervalRef = useRef();
  const onEndRef = useRef(onEnd);
  const onTickRef = useRef(onTick);

  // Mantener referencias actualizadas
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Resetear el timer cuando cambian los segundos
  useEffect(() => {
    setTime(seconds);
    
    // Limpiar interval anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Solo iniciar el timer si los segundos son mayores a 0
    if (seconds > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => {
          const newTime = prevTime - 1;
          
          if (newTime <= 0) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            if (onEndRef.current) {
              onEndRef.current();
            }
          }
          return newTime;
        });
      }, 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [seconds]); // Solo depender de seconds

  // Notificar cambios de tiempo
  useEffect(() => {
    if (onTickRef.current) {
      onTickRef.current(time);
    }
  }, [time]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getTimerColor = () => {
    if (time <= 3) return 'text-red-300 border-red-400/40';
    if (time <= 6) return 'text-amber-300 border-amber-400/40';
    return 'text-white border-white/20';
  };

  return (
    <div className="text-center">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 font-extrabold ${getTimerColor()}`}>
        {time}
      </div>
      <span className="mt-1 block text-xs text-white/70">segundos restantes</span>
    </div>
  );
}
import React from 'react';

export default function Ranking({ players }) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getAccent = (index) => {
    switch (index) {
      case 0: return 'from-amber-400/30 to-amber-400/10 ring-amber-400/40';
      case 1: return 'from-violet-400/30 to-violet-400/10 ring-violet-400/40';
      case 2: return 'from-emerald-400/30 to-emerald-400/10 ring-emerald-400/40';
      default: return 'from-white/10 to-white/5 ring-white/10';
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <h3 className="mb-4 font-bold text-xl">🏆 Tabla de posiciones</h3>
      <div className="flex flex-col gap-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.uid}
            className={`flex items-center gap-4 rounded-xl border ring-1 ring-inset px-3 py-2 bg-gradient-to-br ${getAccent(index)}`}
          >
            <div className="flex justify-center items-center bg-white/10 rounded-full w-10 h-10 text-lg">
              {getRankIcon(index)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{player.displayName || player.email}</div>
              <div className="text-white/80 text-sm">{player.score} puntos</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
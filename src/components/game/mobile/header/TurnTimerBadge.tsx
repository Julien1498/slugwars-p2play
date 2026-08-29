import React from 'react';
import { Clock } from 'lucide-react';
import { GameState } from '../../../../core/types';
import { isTurnTimeUrgent } from './turnHeaderUtils';

interface TurnTimerBadgeProps {
  gameState: GameState;
}

export const TurnTimerBadge: React.FC<TurnTimerBadgeProps> = ({ gameState }) => {
  const turnTime = Math.max(0, Math.ceil(gameState.turnTimer));
  const urgent = isTurnTimeUrgent(gameState.turnTimer, gameState.phase);

  if (gameState.phase === 'RETREAT') {
    return (
      <div className="flex items-center gap-1 bg-orange-950/90 border border-orange-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-orange-300 shadow animate-pulse">
        <Clock className="w-3 h-3 text-orange-400 animate-spin" style={{ animationDuration: '1.2s' }} />
        <span className="font-mono text-xs uppercase">
          FUITE: {Math.max(0, Math.ceil(gameState.retreatTimer ?? 4))}s
        </span>
      </div>
    );
  }

  if (gameState.phase === 'TURN_START') {
    return (
      <div className="flex items-center gap-1 bg-purple-950/90 border border-purple-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-purple-300 shadow animate-bounce">
        <span>📣 DÉBUT TOUR</span>
      </div>
    );
  }

  if (gameState.phase === 'PLACEMENT') {
    return (
      <div className="flex items-center gap-1 bg-amber-950/90 border border-amber-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-amber-300 shadow animate-pulse">
        <span>📍 PLACEMENT</span>
      </div>
    );
  }

  if (gameState.phase === 'CASUALTIES') {
    return (
      <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-red-300 shadow">
        <span>💀 DÉGÂTS</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono text-xs font-black shadow transition-all ${
        urgent
          ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_10px_#ef4444] animate-pulse'
          : 'bg-zinc-900/90 border-zinc-800 text-amber-400'
      }`}
    >
      <Clock
        className={`w-3 h-3 ${urgent ? 'text-red-400 animate-spin' : 'text-amber-400'}`}
        style={{ animationDuration: urgent ? '1s' : '4s' }}
      />
      <span className="tabular-nums font-black">{turnTime}s</span>
    </div>
  );
};

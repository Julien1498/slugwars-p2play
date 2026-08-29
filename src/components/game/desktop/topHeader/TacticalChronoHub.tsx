import React from 'react';
import { GameState } from '../../../../core/types';
import { WindIndicator } from '../../board/WindIndicator';
import { Clock, Flame } from 'lucide-react';
import { isDesktopTurnTimeUrgent } from './desktopHeaderUtils';

interface TacticalChronoHubProps {
  gameState: GameState;
}

export const TacticalChronoHub: React.FC<TacticalChronoHubProps> = ({ gameState }) => {
  const turnTime = Math.max(0, Math.ceil(gameState.turnTimer ?? 0));
  const retreatTime = Math.max(0, Math.ceil(gameState.retreatTimer ?? 0));
  const isTimeUrgent = isDesktopTurnTimeUrgent(gameState.turnTimer, gameState.phase);

  return (
    <div className="pointer-events-auto flex items-center justify-center">
      <div className="bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 hover:border-violet-500/40 p-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex items-center gap-2 transition-all">
        {/* Turn Timer / Chrono Capsule */}
        {gameState.phase === 'RETREAT' ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-950/90 border border-orange-500 rounded-xl text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse">
            <Flame className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-xs font-black uppercase tracking-wider">Repli</span>
            <span className="font-mono text-sm font-black">{retreatTime}s</span>
          </div>
        ) : isTimeUrgent ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-500 rounded-xl text-red-300 shadow-[0_0_20px_#ef4444] animate-bounce">
            <Clock className="w-4 h-4 text-red-400 animate-spin" />
            <span className="font-mono text-sm font-black text-white">{turnTime}s</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800/80 px-3 py-1 rounded-xl shadow-inner">
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="font-mono text-sm font-black text-amber-300">{turnTime}s</span>
          </div>
        )}

        {/* Subtle Divider */}
        <div className="w-px h-6 bg-zinc-800/80" />

        {/* Aerodynamic Wind Indicator */}
        <WindIndicator wind={gameState.wind} />
      </div>
    </div>
  );
};

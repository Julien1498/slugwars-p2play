import React from 'react';
import { Play, SkipForward, Trophy, Pause } from 'lucide-react';
import { GameState } from '../../../../core/types';

interface DevTimeTabProps {
  gameState: GameState;
  onFreezeTimer: () => void;
  onSkipTurn: () => void;
  onForceWin: () => void;
  onResetTimer: () => void;
}

export const DevTimeTab: React.FC<DevTimeTabProps> = ({
  gameState,
  onFreezeTimer,
  onSkipTurn,
  onForceWin,
  onResetTimer,
}) => {
  const isFrozen = gameState.isTimerFrozen;

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
        <div>
          <div className="font-bold text-zinc-200">Chronomètre de Tour</div>
          <div className="text-[11px] text-zinc-400 font-mono">
            Temps restant: <span className="text-amber-400 font-bold">{Math.ceil(gameState.turnTimer)}s</span>
          </div>
        </div>
        <button
          onClick={onFreezeTimer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
            isFrozen
              ? 'bg-cyan-500 text-zinc-950 hover:bg-cyan-400'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          {isFrozen ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isFrozen ? 'GELÉ' : 'GELER'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onResetTimer}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold border border-zinc-700 flex items-center justify-center gap-1.5 transition-colors"
        >
          ⏱️ Reset à 45s
        </button>
        <button
          onClick={onSkipTurn}
          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" /> Sauter le tour
        </button>
      </div>

      <button
        onClick={onForceWin}
        className="px-3 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
      >
        <Trophy className="w-3.5 h-3.5" /> Forcer Victoire de l'Équipe Active
      </button>
    </div>
  );
};

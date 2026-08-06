import React from 'react';
import { GameState } from '../../core/types';
import { getWeapon } from '../../core/weapons/registry';
import { WindIndicator } from './WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import { Clock, Crosshair } from 'lucide-react';

interface TurnHeaderProps {
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  onOpenWeaponPicker: () => void;
  onOpenRules: () => void;
  onExit?: () => void;
}

export const TurnHeader: React.FC<TurnHeaderProps> = ({
  gameState,
  hostPeerId,
  isMyTurn,
  onOpenWeaponPicker,
  onOpenRules,
  onExit,
}) => {
  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;

  return (
    <div className="bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-4">
      {/* Active Team / Slug Badge */}
      <div className="flex items-center gap-3">
        <div
          className="w-4 h-4 rounded-full border border-white/20 shadow-md"
          style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
        />
        <div>
          <div className="font-extrabold text-sm text-zinc-100 flex items-center gap-2">
            <span>{activeSlug?.name || 'Tour de jeu'}</span>
            {isMyTurn && (
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600/50 text-emerald-300 text-[10px] font-black uppercase rounded-full animate-pulse">
                C'est votre tour !
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-400">Équipe {activeTeam?.name}</div>
        </div>
      </div>

      {/* Center: Turn Timer & Active Weapon Button */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-sm font-black text-amber-400">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>{Math.max(0, Math.ceil(gameState.turnTimer))}s</span>
        </div>

        {activeWeapon && (
          <button
            onClick={onOpenWeaponPicker}
            disabled={!isMyTurn}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition ${
              isMyTurn
                ? 'bg-violet-950/80 border-violet-500/80 hover:bg-violet-900 text-violet-200 shadow-md shadow-violet-950'
                : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 opacity-60'
            }`}
          >
            <span className="text-base">{activeWeapon.icon}</span>
            <span>{activeWeapon.name}</span>
            <Crosshair className="w-3.5 h-3.5 text-violet-400" />
          </button>
        )}
      </div>

      {/* Right: Wind & Room Badge */}
      <div className="flex items-center gap-3">
        <WindIndicator wind={gameState.wind} />
        <RoomCodeBadge code={hostPeerId} label="Salon" accentClassName="text-violet-400" />
        <button
          onClick={onOpenRules}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition"
        >
          Règles 📖
        </button>
        {onExit && (
          <button
            onClick={onExit}
            className="px-2.5 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-lg text-xs font-semibold text-red-300 transition"
          >
            Quitter
          </button>
        )}
      </div>
    </div>
  );
};

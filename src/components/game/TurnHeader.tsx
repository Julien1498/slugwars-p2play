import React from 'react';
import { GameState } from '../../core/types';
import { getWeapon } from '../../core/weapons/registry';
import { WindIndicator } from './WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import { Clock, Crosshair, Heart } from 'lucide-react';

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
    <div className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
      {/* Top Left: Active Slug & Turn Status */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2.5">
          <div
            className="w-4 h-4 rounded-full border border-white/40 shadow"
            style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
          />
          <div>
            <div className="font-black text-sm text-zinc-100 flex items-center gap-2">
              <span>{activeSlug?.name || 'Tour de jeu'}</span>
              {isMyTurn && (
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[10px] font-black uppercase rounded-full animate-pulse shadow-sm">
                  🎯 Votre tour !
                </span>
              )}
            </div>
            <div className="text-[11px] font-semibold text-zinc-400">Équipe {activeTeam?.name}</div>
          </div>
        </div>

        {/* Turn Timer Clock */}
        <div className="flex items-center gap-1.5 bg-zinc-950 border border-amber-500/40 px-3 py-1 rounded-xl text-sm font-black text-amber-400 shadow-inner">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span className="font-mono text-base">{Math.max(0, Math.ceil(gameState.turnTimer))}s</span>
        </div>
      </div>

      {/* Worms Team Total HP Leaderboard */}
      <div className="flex items-center gap-3 overflow-x-auto max-w-full py-1 px-2 bg-zinc-950/80 border border-zinc-800 rounded-xl">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-500 fill-red-500" /> Équipes :
        </span>
        {gameState.teams.map((team) => {
          const teamSlugs = gameState.slugs.filter((s) => s.teamId === team.id);
          const totalHp = teamSlugs.reduce((acc, s) => acc + (s.isAlive ? s.hp : 0), 0);
          const maxHp = gameState.config.slugsPerTeam * gameState.config.slugHp;
          const hpPercent = Math.max(0, Math.min(1, totalHp / (maxHp || 1)));
          const isActive = team.id === gameState.activeTeamId;

          return (
            <div
              key={team.id}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-bold transition ${
                isActive
                  ? 'bg-zinc-800 border-amber-500/80 text-white shadow-md'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
              <span>{team.name}</span>
              <span className="font-mono text-[11px] text-amber-300">{totalHp} HP</span>
              <div className="w-12 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${hpPercent * 100}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Controls: Wind, Weapon Button, Room Code & Exit */}
      <div className="flex items-center gap-2.5">
        <WindIndicator wind={gameState.wind} />

        {activeWeapon && (
          <button
            onClick={onOpenWeaponPicker}
            disabled={!isMyTurn}
            className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition ${
              isMyTurn
                ? 'bg-violet-950/90 border-violet-500 hover:bg-violet-900 text-violet-200 shadow-md shadow-violet-950'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
            }`}
          >
            <span className="text-sm">{activeWeapon.icon}</span>
            <span>{activeWeapon.name}</span>
            <Crosshair className="w-3.5 h-3.5 text-violet-400" />
          </button>
        )}

        <RoomCodeBadge code={hostPeerId} label="Salon" accentClassName="text-violet-400" />
        <button
          onClick={onOpenRules}
          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition"
        >
          📖
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

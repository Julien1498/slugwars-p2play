import React from 'react';
import { Team, Slug } from '../../../../core/types';
import { getSlugHpColor } from './desktopHeaderUtils';

interface ActiveOperativeCardProps {
  activeTeam?: Team;
  activeSlug?: Slug;
  isMyTurn: boolean;
  activeSlugMaxHp: number;
  activeSlugHpPercent: number;
}

export const ActiveOperativeCard: React.FC<ActiveOperativeCardProps> = ({
  activeTeam,
  activeSlug,
  isMyTurn,
  activeSlugMaxHp,
  activeSlugHpPercent,
}) => {
  if (!activeTeam || !activeSlug) return null;

  return (
    <div className="pointer-events-auto flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          try {
            window.dispatchEvent(new CustomEvent('slugwars:recenter-camera'));
          } catch {}
        }}
        className="bg-zinc-950/90 hover:bg-zinc-900 active:scale-95 cursor-pointer backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 transition-all text-left"
        style={{
          boxShadow: `0 8px 32px -4px rgba(0,0,0,0.8), 0 0 16px -2px ${activeTeam.color}33`,
          borderColor: `${activeTeam.color}55`,
        }}
        title="Cliquer pour centrer la caméra sur la limace active [Touche C]"
      >
        {/* Squad Avatar with Glow Ring */}
        <div className="relative">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20"
            style={{ backgroundColor: activeTeam.color }}
          >
            {activeTeam.avatar || '🐌'}
          </div>
          {isMyTurn && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-zinc-950 text-[8px] font-black text-slate-950 items-center justify-center">
                ⚡
              </span>
            </span>
          )}
        </div>

        {/* Slug Identity & Dynamic Health Gauge */}
        <div className="flex flex-col min-w-[130px] max-w-[180px]">
          <div className="flex items-center justify-between gap-2 leading-none">
            <span className="text-xs font-black text-zinc-100 truncate">
              {activeSlug.name}
            </span>
            <span className="font-mono text-xs font-black text-amber-400">
              {activeSlug.hp} <span className="text-[10px] text-zinc-500 font-normal">/ {activeSlugMaxHp}</span>
            </span>
          </div>

          {/* HP Bar */}
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mt-1.5 border border-zinc-800 shadow-inner">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${activeSlugHpPercent * 100}%`,
                backgroundColor: getSlugHpColor(activeSlugHpPercent),
              }}
            />
          </div>

          {/* Team Tag / Turn Status */}
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-[10px] font-bold text-zinc-400 truncate">
              {activeTeam.name}
            </span>
            <span
              className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm"
              style={{
                backgroundColor: isMyTurn ? '#8b5cf633' : `${activeTeam.color}22`,
                borderColor: isMyTurn ? '#a78bfa' : `${activeTeam.color}66`,
                color: isMyTurn ? '#c4b5fd' : activeTeam.color,
              }}
            >
              {isMyTurn ? 'À ton tour !' : 'En attente'}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};

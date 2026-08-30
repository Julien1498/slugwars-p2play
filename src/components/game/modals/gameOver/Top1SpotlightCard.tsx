import React from 'react';
import { Crown, Heart } from 'lucide-react';
import { TeamSummary } from './gameOverTypes';

interface Top1SpotlightCardProps {
  topTeam: TeamSummary;
  maxTeamHp: number;
}

export const Top1SpotlightCard: React.FC<Top1SpotlightCardProps> = ({
  topTeam,
  maxTeamHp,
}) => {
  const hpPercent = Math.max(0, Math.min(100, Math.round((topTeam.totalRemainingHp / (maxTeamHp || 1)) * 100)));

  return (
    <div className="md:col-span-4 landscape:col-span-4 flex flex-col">
      <div className="bg-gradient-to-b from-amber-950/40 via-zinc-900/90 to-zinc-950/95 border-2 border-amber-500/60 rounded-2xl p-3 sm:p-4 flex flex-col justify-between items-center text-center relative shadow-[0_0_35px_rgba(245,158,11,0.2)] flex-1 min-h-0">
        {/* Top badges */}
        <div className="w-full flex items-center justify-between shrink-0">
          <div className="w-7 h-7 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-xs shadow-md">
            1
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-400/50 rounded-full text-amber-300 text-[9px] font-black tracking-wider uppercase shadow-inner">
            <Crown className="w-2.5 h-2.5 text-amber-400" />
            TOP 1
          </div>
        </div>

        {/* Big Slug Mascot with Crown */}
        <div className="my-auto py-1 flex flex-col items-center">
          <div className="relative inline-block mb-1">
            <span className="text-5xl sm:text-6xl drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              {topTeam.team.avatar || '🐌'}
            </span>
            <span className="absolute -top-2 -right-2 text-xl animate-bounce">
              👑
            </span>
          </div>

          {/* Team Name with Color Dots */}
          <div className="flex items-center gap-1.5 justify-center mt-1">
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: topTeam.team.color }}
            />
            <h3 className="text-sm sm:text-base font-black text-zinc-100 truncate max-w-[180px]">
              {topTeam.team.name}
            </h3>
            <div
              className="w-2.5 h-2.5 rounded-full shadow-sm"
              style={{ backgroundColor: topTeam.team.color }}
            />
          </div>

          {/* Health Gauge */}
          <div className="w-full max-w-[190px] mt-1.5 space-y-1">
            <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-300 font-semibold">
              <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400" />
              <span>Santé : {topTeam.totalRemainingHp} HP</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${hpPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Stat Pills */}
        <div className="w-full space-y-1.5 shrink-0 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-1.5">
              <div className="text-[8px] uppercase font-bold text-zinc-400">Kills</div>
              <div className="text-sm sm:text-base font-black text-rose-400">{topTeam.kills}</div>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-1.5">
              <div className="text-[8px] uppercase font-bold text-zinc-400">Dégâts</div>
              <div className="text-sm sm:text-base font-black text-amber-400">{topTeam.damageDealt}</div>
            </div>
          </div>
          <div className="text-[9px] text-amber-300/80 font-bold uppercase tracking-wider">
            Performance Élite
          </div>
        </div>
      </div>
    </div>
  );
};

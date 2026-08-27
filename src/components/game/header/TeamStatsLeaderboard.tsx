import React from 'react';
import { Heart } from 'lucide-react';
import { Team } from '../../../core/types';

export interface TeamStatItem {
  team: Team;
  totalHp: number;
  hpPercent: number;
  isActive: boolean;
  aliveSlugs: number;
  totalSlugs: number;
}

interface TeamStatsLeaderboardProps {
  teamStats: TeamStatItem[];
}

export const TeamStatsLeaderboard: React.FC<TeamStatsLeaderboardProps> = ({ teamStats }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 px-2 bg-zinc-900/60 border border-zinc-800/80 rounded-lg shrink min-w-0 shadow-inner">
      <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" />
      {teamStats.map(({ team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs }) => (
        <div
          key={team.id}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold transition-all shrink-0 ${
            isActive
              ? 'bg-zinc-800/95 border-amber-400/80 text-white shadow ring-1 ring-amber-400/30'
              : 'bg-zinc-950/50 border-zinc-800 text-zinc-400'
          }`}
        >
          <div
            className="w-2 h-2 rounded-full shadow-sm"
            style={{ backgroundColor: team.color }}
          />
          <span className="truncate max-w-[80px] text-zinc-200">{team.name}</span>
          <span className="text-[9px] font-semibold text-zinc-400">
            ({aliveSlugs}/{totalSlugs})
          </span>
          <span className="font-mono text-[10px] font-black text-amber-300">
            {totalHp} HP
          </span>
          <div className="w-10 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700/60">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${hpPercent * 100}%`,
                backgroundColor: team.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

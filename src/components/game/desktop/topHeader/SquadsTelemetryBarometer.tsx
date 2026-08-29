import React from 'react';
import { Team } from '../../../../core/types';

export interface DesktopTeamStatItem {
  team: Team;
  totalHp: number;
  maxHp: number;
  hpPercent: number;
  aliveSlugs: number;
  totalSlugs: number;
  isActive: boolean;
}

interface SquadsTelemetryBarometerProps {
  teamStats: DesktopTeamStatItem[];
}

export const SquadsTelemetryBarometer: React.FC<SquadsTelemetryBarometerProps> = ({ teamStats }) => {
  return (
    <div className="hidden lg:flex items-center gap-2 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 px-3 py-1.5 rounded-2xl shadow-2xl">
      {teamStats.map(({ team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs }) => (
        <div
          key={team.id}
          className={`flex items-center gap-2 px-2 py-1 rounded-xl transition-all ${
            isActive
              ? 'bg-zinc-900 border border-amber-500/60 shadow-md scale-105'
              : 'opacity-70 hover:opacity-100'
          }`}
        >
          <div
            className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
            style={{ backgroundColor: team.color }}
          />
          <div className="flex flex-col min-w-[65px]">
            <div className="flex items-center justify-between gap-1 leading-none">
              <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[55px]">
                {team.name}
              </span>
              <span className="text-[9px] font-mono text-zinc-400">
                ({aliveSlugs}/{totalSlugs})
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1 border border-zinc-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${hpPercent * 100}%`,
                  backgroundColor: team.color,
                }}
              />
            </div>
          </div>
          <span className="font-mono text-[11px] font-black text-amber-400">
            {totalHp}
          </span>
        </div>
      ))}
    </div>
  );
};

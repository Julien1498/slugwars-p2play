import React from 'react';
import { Heart } from 'lucide-react';
import { TeamSummary } from './gameOverTypes';

interface RunnerUpsLeaderboardProps {
  runnerUps: TeamSummary[];
}

export const RunnerUpsLeaderboard: React.FC<RunnerUpsLeaderboardProps> = ({
  runnerUps,
}) => {
  return (
    <div className="md:col-span-4 landscape:col-span-4 flex flex-col min-h-0 space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 shrink-0">
        <span>Classement & Performances</span>
        <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-semibold pr-1">
          <span>K</span>
          <span>D</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-0 no-scrollbar">
        {runnerUps.length > 0 ? (
          runnerUps.map((summary, idx) => {
            const rank = idx + 2;
            const { team, totalRemainingHp, kills, damageDealt } = summary;
            return (
              <div
                key={team.id}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700/80 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                      rank === 2
                        ? 'bg-zinc-300 text-zinc-950'
                        : rank === 3
                        ? 'bg-amber-700 text-zinc-100'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {rank}
                  </div>

                  <span className="text-base shrink-0">{team.avatar || '🐌'}</span>

                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: team.color }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-zinc-100 truncate">
                      {team.name}
                    </div>
                    <div className="text-[9px] text-zinc-400 flex items-center gap-0.5">
                      <Heart className="w-2 h-2 text-rose-400" />
                      <span>Santé : {totalRemainingHp} HP</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right shrink-0 font-mono text-xs">
                  <div className="w-4 text-center font-bold text-rose-400">{kills}</div>
                  <div className="w-6 text-center font-black text-amber-400">{damageDealt}</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-4 bg-zinc-900/40 border border-zinc-800/60 rounded-xl text-center space-y-1 text-zinc-400">
            <span className="text-2xl">🎯</span>
            <div className="text-xs font-bold text-zinc-300">Partie Solo Terminée</div>
            <div className="text-[10px] text-zinc-500">Aucun adversaire en lice</div>
          </div>
        )}
      </div>
    </div>
  );
};

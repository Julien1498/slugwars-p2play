import React from 'react';
import { Award, Skull, Sparkles, Swords } from 'lucide-react';
import { TeamSummary } from './gameOverTypes';

interface TacticalDistinctionsProps {
  mvpTeam?: TeamSummary | null;
  reaperTeam?: TeamSummary | null;
}

export const TacticalDistinctions: React.FC<TacticalDistinctionsProps> = ({
  mvpTeam,
  reaperTeam,
}) => {
  return (
    <div className="space-y-1.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        Distinctions Tactiques
      </div>

      <div className="space-y-1.5">
        {/* MVP Card */}
        {mvpTeam && (
          <div className="bg-zinc-900/90 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2.5 shadow-sm">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] sm:text-[9px] uppercase font-extrabold text-amber-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> MVP
              </div>
              <div className="text-xs font-black text-zinc-100 truncate">
                {mvpTeam.team.name}
              </div>
              <div className="text-[9px] text-zinc-400 font-medium">
                {mvpTeam.damageDealt} dgt
              </div>
            </div>
          </div>
        )}

        {/* Faucheur Card */}
        {reaperTeam && (
          <div className="bg-zinc-900/90 border border-rose-500/30 rounded-xl p-2 flex items-center gap-2.5 shadow-sm">
            <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg shrink-0">
              <Skull className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[8px] sm:text-[9px] uppercase font-extrabold text-rose-400 flex items-center gap-1">
                <Swords className="w-2.5 h-2.5" /> Faucheur
              </div>
              <div className="text-xs font-black text-zinc-100 truncate">
                {reaperTeam.team.name}
              </div>
              <div className="text-[9px] text-zinc-400 font-medium">
                {reaperTeam.kills} kill{reaperTeam.kills > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

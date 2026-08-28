import React from 'react';
import { JournalEntry } from '../../../../core/types';
import { Skull, Zap, Rocket, Info, ShieldAlert } from 'lucide-react';
import { getLogMeta } from './combatLogUtils';

interface CombatLogJournalTabProps {
  journal: JournalEntry[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}

function renderLogIcon(iconType: 'death' | 'combat' | 'weapon' | 'info') {
  switch (iconType) {
    case 'death':
      return <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />;
    case 'combat':
      return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case 'weapon':
      return <Rocket className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    default:
      return <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
  }
}

export const CombatLogJournalTab: React.FC<CombatLogJournalTabProps> = ({
  journal,
  scrollContainerRef,
}) => {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto pr-1.5 space-y-2 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700/80 scrollbar-track-zinc-900/40"
    >
      {journal.length > 0 ? (
        journal.map((j) => {
          const meta = getLogMeta(j.type);
          return (
            <div
              key={j.id}
              className={`p-2.5 rounded-2xl border backdrop-blur-md transition shadow-sm ${meta.cardStyle}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  {renderLogIcon(meta.iconType)}
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border font-mono ${meta.badgeStyle}`}>
                    {meta.badge}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {new Date(j.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="font-semibold text-xs leading-snug pl-5">
                {j.message}
              </div>
            </div>
          );
        })
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs italic gap-2">
          <ShieldAlert className="w-8 h-8 text-zinc-700" />
          <span>Aucun événement de combat enregistré pour l'instant.</span>
        </div>
      )}
    </div>
  );
};

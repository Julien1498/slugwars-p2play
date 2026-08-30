import React from 'react';
import { Bug, Sparkles } from 'lucide-react';
import { DevCursorTool } from '../../../hooks/useDevMode';

interface DevFloatingToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  activeCursorTool: DevCursorTool | null;
}

export const DevFloatingToggle: React.FC<DevFloatingToggleProps> = ({
  isOpen,
  onToggle,
  activeCursorTool,
}) => {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 select-none">
      <button
        onClick={onToggle}
        className={`group relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black tracking-wider transition-all duration-200 shadow-2xl backdrop-blur-xl border ${
          isOpen
            ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-amber-500/30 scale-105'
            : activeCursorTool
            ? 'bg-emerald-600 text-white border-emerald-400 shadow-emerald-500/40 animate-pulse'
            : 'bg-zinc-900/90 text-amber-400 border-amber-500/40 hover:bg-zinc-800 hover:border-amber-400 hover:scale-105'
        }`}
        title="Mode Développeur / Debug (Raccourci: ²) [URL: ?dev=true]"
      >
        <Bug className="w-4 h-4 animate-bounce" />
        <span>DEV MODE</span>
        {activeCursorTool && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
            <Sparkles className="w-2.5 h-2.5" />
            ACTIF
          </span>
        )}
      </button>

      {activeCursorTool && (
        <div className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-950/90 text-emerald-400 border border-emerald-500/50 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-left duration-200">
          🎯 Cliquez sur le terrain : <span className="text-white underline">{activeCursorTool}</span>
        </div>
      )}
    </div>
  );
};

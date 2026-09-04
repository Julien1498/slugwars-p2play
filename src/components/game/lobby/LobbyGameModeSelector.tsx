import React from 'react';
import { GameMode, GAME_MODES_CONFIG } from '../../../core/types';
import { Swords } from 'lucide-react';

interface LobbyGameModeSelectorProps {
  currentMode?: GameMode;
  isHost: boolean;
  onSelectMode: (mode: GameMode) => void;
}

export const LobbyGameModeSelector: React.FC<LobbyGameModeSelectorProps> = ({
  currentMode = 'DEATHMATCH',
  isHost,
  onSelectMode,
}) => {
  const modes = Object.values(GAME_MODES_CONFIG);

  return (
    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Swords className="w-3 h-3 text-violet-400" /> Mode de Jeu Tactique
        </label>
        <span className="text-[9px] font-mono text-zinc-500">
          {isHost ? 'Sélection Hôte' : 'Imposé par l\'hôte'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
        {modes.map((mode) => {
          const isSelected = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={!isHost}
              onClick={() => onSelectMode(mode.id)}
              className={`py-1.5 px-2 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-md ring-1 ring-violet-500/40'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              } ${!isHost ? 'cursor-default' : 'cursor-pointer active:scale-[0.98]'}`}
              title={mode.description}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{mode.icon}</span>
                <span className="text-xs font-bold truncate">{mode.shortLabel}</span>
              </div>
              <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5 leading-tight">
                {mode.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

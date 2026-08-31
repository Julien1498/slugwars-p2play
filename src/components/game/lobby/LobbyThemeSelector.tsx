import React from 'react';
import { MapTheme, MapSize } from '../../../core/types';
import { THEME_CONFIGS } from '../../../core/terrain/themeRegistry';
import { BiomeMiniPreview } from './BiomeMiniPreview';

export const MAP_THEMES: { id: MapTheme; label: string; icon: string; desc: string }[] = Object.values(THEME_CONFIGS).map(
  (c) => ({
    id: c.id,
    label: c.label,
    icon: c.icon,
    desc: c.desc,
  })
);

interface LobbyThemeSelectorProps {
  currentTheme: MapTheme;
  isHost: boolean;
  onSelectTheme: (theme: MapTheme) => void;
  size?: MapSize;
  seed?: number;
}

export const LobbyThemeSelector: React.FC<LobbyThemeSelectorProps> = ({
  currentTheme,
  isHost,
  onSelectTheme,
  size = 'NORMAL',
  seed = 42,
}) => {
  return (
    <div className="relative group/carousel">
      <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth p-1 pb-1.5">
        {MAP_THEMES.map((theme) => {
          const isSelected = currentTheme === theme.id;
          return (
            <button
              key={theme.id}
              disabled={!isHost}
              onClick={() => onSelectTheme(theme.id)}
              className={`flex-shrink-0 w-28 p-1.5 rounded-xl border text-center transition-all duration-200 flex flex-col items-center group relative ${
                isSelected
                  ? 'bg-violet-950/80 border-violet-500 ring-1 ring-violet-500/50 text-white shadow-lg shadow-violet-950/60 scale-[1.02]'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              {/* Mini Real Map Preview */}
              <div className="w-full h-14 rounded-lg overflow-hidden bg-zinc-950 border border-white/10 relative shadow-inner">
                <BiomeMiniPreview theme={theme.id} size={size} seed={seed} />
                {isSelected && (
                  <div className="absolute inset-0 bg-violet-500/10 pointer-events-none ring-1 ring-inset ring-violet-400/30 rounded-lg" />
                )}
              </div>

              {/* Biome Title */}
              <div className="text-[11px] font-bold truncate w-full px-0.5 mt-1.5 leading-tight">
                {theme.label}
              </div>

              {/* Active Indicator Underline */}
              {isSelected && (
                <div className="h-0.5 w-6 bg-violet-400 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.9)] mt-1 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

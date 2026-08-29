import React from 'react';
import { MapTheme } from '../../../core/types';
import { THEME_CONFIGS } from '../../../core/terrain/themeRegistry';

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
}

export const LobbyThemeSelector: React.FC<LobbyThemeSelectorProps> = ({
  currentTheme,
  isHost,
  onSelectTheme,
}) => {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {MAP_THEMES.map((theme) => (
        <button
          key={theme.id}
          disabled={!isHost}
          onClick={() => onSelectTheme(theme.id)}
          className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
            currentTheme === theme.id
              ? 'bg-violet-950/90 border-violet-500 text-white shadow-md shadow-violet-950/40'
              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
          }`}
        >
          <span className="text-lg">{theme.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate leading-tight">{theme.label}</div>
            <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{theme.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

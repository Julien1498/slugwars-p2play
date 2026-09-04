import React from 'react';
import { GameConfig, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { WEAPON_SETS } from '../../../core/weapons/weaponSets';
import { THEME_CONFIGS } from '../../../core/terrain/themeRegistry';
import { MapThumbnailPreview } from './MapThumbnailPreview';
import { LobbyThemeSelector, MAP_THEMES } from './LobbyThemeSelector';
import { LobbyEnvironmentConfig } from './LobbyEnvironmentConfig';
import { LobbyGameModeSelector } from './LobbyGameModeSelector';
import { Dices, Sparkles, Swords, Rocket } from 'lucide-react';

export { MAP_THEMES };

interface LobbyMapConfigProps {
  config: GameConfig;
  isHost: boolean;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
}

export const LobbyMapConfig: React.FC<LobbyMapConfigProps> = ({ config, isHost, onChangeConfig }) => {
  const currentSizeCfg = MAP_SIZE_CONFIGS[config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;
  const currentThemeConfig = THEME_CONFIGS[config.mapTheme || 'ISLAND'] || THEME_CONFIGS.ISLAND;

  return (
    <div className="md:col-span-7 landscape:col-span-7 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-4 rounded-2xl shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Zone d'Opérations & Radar
        </h2>
        <span className="text-[11px] font-bold text-violet-300 bg-zinc-950/80 px-2.5 py-0.5 rounded-lg border border-violet-500/30 flex items-center gap-1.5 shadow-sm">
          <span>{currentThemeConfig.icon}</span>
          <span>{currentThemeConfig.label}</span>
        </span>
      </div>

      <div className="space-y-2">
        <MapThumbnailPreview theme={config.mapTheme} size={config.mapSize || 'NORMAL'} seed={config.mapSeed} />

        <LobbyThemeSelector
          currentTheme={config.mapTheme}
          size={config.mapSize || 'NORMAL'}
          seed={config.mapSeed}
          isHost={isHost}
          onSelectTheme={(mapTheme) => {
            if (mapTheme === config.mapTheme) {
              onChangeConfig({ mapTheme, mapSeed: Math.floor(Math.random() * 1_000_000_000) });
            } else {
              onChangeConfig({ mapTheme });
            }
          }}
        />

        <div className="flex items-center gap-2">
          <div className="flex-1 grid grid-cols-3 gap-1.5">
            {(Object.entries(MAP_SIZE_CONFIGS) as [MapSize, typeof MAP_SIZE_CONFIGS[MapSize]][]).map(([sizeKey, sizeVal]) => (
              <button
                key={sizeKey}
                disabled={!isHost}
                onClick={() => onChangeConfig({ mapSize: sizeKey })}
                className={`py-1.5 px-2 rounded-xl border text-center transition ${
                  (config.mapSize || 'NORMAL') === sizeKey
                    ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-sm'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <div className="text-[11px] font-bold">{sizeVal.icon} {sizeVal.label}</div>
              </button>
            ))}
          </div>

          {isHost && (
            <button
              onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1_000_000_000) })}
              className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] border border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 transition whitespace-nowrap"
              title="Générer une nouvelle seed"
            >
              <Dices className="w-3.5 h-3.5 text-violet-400" />
              <span>Seed #{config.mapSeed}</span>
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1.5 pt-2 border-t border-zinc-800">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Rocket className="w-3 h-3 text-violet-400" /> Configuration de l'Arsenal
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(WEAPON_SETS).map((wSet) => (
            <button
              key={wSet.id}
              disabled={!isHost}
              onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
              className={`p-2 rounded-xl border text-left transition ${
                config.weaponSetId === wSet.id
                  ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="text-xs font-bold truncate">
                {wSet.name}
              </div>
              <div className="text-[9px] text-zinc-500 line-clamp-1 mt-0.5">{wSet.description}</div>
            </button>
          ))}
        </div>
      </div>

      <LobbyGameModeSelector
        currentMode={config.gameMode}
        isHost={isHost}
        onSelectMode={(gameMode) => onChangeConfig({ gameMode })}
      />

      <LobbyEnvironmentConfig
        config={config}
        isHost={isHost}
        onChangeConfig={onChangeConfig}
      />
    </div>
  );
};

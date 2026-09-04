import React from 'react';
import { GameConfig } from '../../../core/types';

interface LobbyEnvironmentConfigProps {
  config: GameConfig;
  isHost: boolean;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
}

export const LobbyEnvironmentConfig: React.FC<LobbyEnvironmentConfigProps> = ({
  config,
  isHost,
  onChangeConfig,
}) => {
  return (
    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-1.5">
        {isHost ? (
          <button
            onClick={() => {
              const counts = [1, 2, 3, 4, 6, 8];
              const next = counts[(counts.indexOf(config.slugsPerTeam ?? 3) + 1) % counts.length];
              onChangeConfig({ slugsPerTeam: next });
            }}
            className="p-2 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-xl text-left transition"
          >
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
            <div className="text-xs font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
          </button>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
            <div className="text-xs font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={() => {
              const hps = [50, 100, 150, 200];
              const next = hps[(hps.indexOf(config.slugHp ?? 100) + 1) % hps.length];
              onChangeConfig({ slugHp: next });
            }}
            className="p-2 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition"
          >
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
            <div className="text-xs font-black text-emerald-400">❤️ {config.slugHp} HP</div>
          </button>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
            <div className="text-xs font-black text-emerald-400">❤️ {config.slugHp} HP</div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
            className={`p-2 rounded-xl border text-left transition ${
              config.windEnabled
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="text-[9px] font-bold uppercase">Vent Météo</div>
            <div className="text-xs font-black">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
          </button>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Vent Météo</div>
            <div className="text-xs font-black text-emerald-400">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
            className={`p-2 rounded-xl border text-left transition ${
              config.vehiclesEnabled
                ? 'bg-violet-950/70 border-violet-500/60 text-violet-200'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <div className="text-[9px] font-bold uppercase">Véhicules</div>
            <div className="text-xs font-black">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
          </button>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Véhicules</div>
            <div className="text-xs font-black text-violet-300">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
          </div>
        )}

        {isHost ? (
          <button
            onClick={() => onChangeConfig({ dayNightCycle: (config.dayNightCycle || 'DAY') === 'DAY' ? 'NIGHT' : 'DAY' })}
            className={`p-2 rounded-xl border text-left transition ${
              (config.dayNightCycle || 'DAY') === 'DAY'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-sm'
                : 'bg-indigo-950/70 border-indigo-500/60 text-indigo-200 shadow-sm'
            }`}
          >
            <div className="text-[9px] font-bold uppercase">Atmosphère</div>
            <div className="text-xs font-black">{(config.dayNightCycle || 'DAY') === 'DAY' ? '☀️ Jour' : '🌙 Nuit'}</div>
          </button>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
            <div className="text-[9px] text-zinc-400 font-bold uppercase">Atmosphère</div>
            <div className="text-xs font-black text-amber-300">{(config.dayNightCycle || 'DAY') === 'DAY' ? '☀️ Jour' : '🌙 Nuit'}</div>
          </div>
        )}

        {/* Mort Subite (Montée des eaux) */}
        {isHost ? (
          <div
            className={`p-2 rounded-xl border text-left transition flex items-center justify-between ${
              (config.waterRiseSpeed || 'OFF') !== 'OFF'
                ? 'bg-sky-950/70 border-sky-500/60 text-sky-200 shadow-sm'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                const speeds: Array<'OFF' | 'SLOW' | 'NORMAL' | 'FAST'> = ['OFF', 'SLOW', 'NORMAL', 'FAST'];
                const cur = config.waterRiseSpeed || 'OFF';
                const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
                onChangeConfig({ waterRiseSpeed: next });
              }}
              className="flex-1 text-left cursor-pointer min-w-0"
              title="Vitesse de montée des eaux"
            >
              <div className="text-[9px] font-bold uppercase text-zinc-400">Mort Subite</div>
              <div className="text-xs font-black truncate">
                {config.waterRiseSpeed === 'SLOW'
                  ? '💧 Lente'
                  : config.waterRiseSpeed === 'NORMAL'
                  ? '🌊 Normale'
                  : config.waterRiseSpeed === 'FAST'
                  ? '⚡ Rapide'
                  : '❌ Sans'}
              </div>
            </button>

            {(config.waterRiseSpeed || 'OFF') !== 'OFF' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const curFreq = config.waterRiseFreq || 'EVERY_TURN';
                  onChangeConfig({ waterRiseFreq: curFreq === 'EVERY_TURN' ? 'ROUND_CYCLE' : 'EVERY_TURN' });
                }}
                className="ml-1 px-1.5 py-0.5 rounded bg-sky-900/80 hover:bg-sky-800 text-[9px] font-bold text-sky-200 border border-sky-400/40 cursor-pointer whitespace-nowrap shadow-sm flex-shrink-0"
                title="Rythme : Tour par tour ou Fin de round"
              >
                {(config.waterRiseFreq || 'EVERY_TURN') === 'ROUND_CYCLE' ? '⏱️ Round' : '🔄 Tour'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] text-zinc-400 font-bold uppercase">Mort Subite</div>
              <div className="text-xs font-black text-sky-300 truncate">
                {config.waterRiseSpeed === 'SLOW'
                  ? '💧 Lente'
                  : config.waterRiseSpeed === 'NORMAL'
                  ? '🌊 Normale'
                  : config.waterRiseSpeed === 'FAST'
                  ? '⚡ Rapide'
                  : '❌ Sans'}
              </div>
            </div>
            {(config.waterRiseSpeed || 'OFF') !== 'OFF' && (
              <span className="ml-1 text-[9px] font-bold text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-500/30 whitespace-nowrap flex-shrink-0">
                {(config.waterRiseFreq || 'EVERY_TURN') === 'ROUND_CYCLE' ? '⏱️ Round' : '🔄 Tour'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

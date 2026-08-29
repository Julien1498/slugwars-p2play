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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
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
      </div>

      <div className="p-2.5 bg-zinc-950/80 border border-sky-950/80 rounded-xl space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-sky-400">
          <span className="flex items-center gap-1.5">
            <span>🌊</span> Montée des Eaux (Mort Subite)
          </span>
          <span className="text-[9px] font-mono text-zinc-500">
            {(config.waterRiseSpeed || 'OFF') === 'OFF' ? 'Désactivée' : 'Active'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {isHost ? (
            <button
              onClick={() => {
                const speeds: Array<'OFF' | 'SLOW' | 'NORMAL' | 'FAST'> = ['OFF', 'SLOW', 'NORMAL', 'FAST'];
                const cur = config.waterRiseSpeed || 'OFF';
                const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
                onChangeConfig({ waterRiseSpeed: next });
              }}
              className={`p-2 rounded-xl border text-left transition ${
                (config.waterRiseSpeed || 'OFF') !== 'OFF'
                  ? 'bg-sky-950/80 border-sky-500/70 text-sky-200 shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
              }`}
              title="Vitesse de montée des eaux"
            >
              <div className="text-[9px] font-bold uppercase">Vitesse Montée</div>
              <div className="text-xs font-black">
                {config.waterRiseSpeed === 'SLOW'
                  ? '💧 Lente'
                  : config.waterRiseSpeed === 'NORMAL'
                  ? '🌊 Normale'
                  : config.waterRiseSpeed === 'FAST'
                  ? '⚡ Rapide'
                  : '❌ Désactivée'}
              </div>
            </button>
          ) : (
            <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left">
              <div className="text-[9px] text-zinc-400 font-bold uppercase">Vitesse Montée</div>
              <div className="text-xs font-black text-sky-300">
                {config.waterRiseSpeed === 'SLOW'
                  ? '💧 Lente'
                  : config.waterRiseSpeed === 'NORMAL'
                  ? '🌊 Normale'
                  : config.waterRiseSpeed === 'FAST'
                  ? '⚡ Rapide'
                  : '❌ Désactivée'}
              </div>
            </div>
          )}

          {isHost ? (
            <button
              disabled={(config.waterRiseSpeed || 'OFF') === 'OFF'}
              onClick={() => {
                const curFreq = config.waterRiseFreq || 'EVERY_TURN';
                const nextFreq = curFreq === 'EVERY_TURN' ? 'ROUND_CYCLE' : 'EVERY_TURN';
                onChangeConfig({ waterRiseFreq: nextFreq });
              }}
              className={`p-2 rounded-xl border text-left transition ${
                (config.waterRiseSpeed || 'OFF') === 'OFF'
                  ? 'bg-zinc-900/40 border-zinc-800/60 text-zinc-600 opacity-60 cursor-not-allowed'
                  : 'bg-cyan-950/80 border-cyan-500/70 text-cyan-200 shadow-sm'
              }`}
              title="Fréquence de la montée des eaux (Tour par tour ou Fin de round)"
            >
              <div className="text-[9px] font-bold uppercase">Rythme Déclenchement</div>
              <div className="text-xs font-black">
                {(config.waterRiseSpeed || 'OFF') === 'OFF'
                  ? '❌ Inactif'
                  : (config.waterRiseFreq || 'EVERY_TURN') === 'ROUND_CYCLE'
                  ? '⏱️ Fin de round'
                  : '🔄 Tour par tour'}
              </div>
            </button>
          ) : (
            <div className="p-2 bg-zinc-900/60 border border-zinc-800 rounded-xl text-left">
              <div className="text-[9px] text-zinc-400 font-bold uppercase">Rythme Déclenchement</div>
              <div className="text-xs font-black text-cyan-300">
                {(config.waterRiseSpeed || 'OFF') === 'OFF'
                  ? '❌ Inactif'
                  : (config.waterRiseFreq || 'EVERY_TURN') === 'ROUND_CYCLE'
                  ? '⏱️ Fin de round'
                  : '🔄 Tour par tour'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

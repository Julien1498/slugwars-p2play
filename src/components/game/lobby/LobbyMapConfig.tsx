import React from 'react';
import { GameConfig, MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { WEAPON_SETS } from '../../../core/weapons/weaponSets';
import { MapThumbnailPreview } from './MapThumbnailPreview';
import { Dices, Sparkles, Swords, Rocket } from 'lucide-react';

export const MAP_THEMES: { id: MapTheme; label: string; icon: string; desc: string }[] = [
  { id: 'ISLAND', label: 'Île Tropicale', icon: '🏝️', desc: 'Collines ouvertes & lagons' },
  { id: 'ARCHIPELAGO', label: 'Archipel Océan', icon: '🌊', desc: '3 îles séparées par la mer' },
  { id: 'NATURAL_ARCHES', label: 'Arches & Ponts', icon: '🌉', desc: 'Viaducs rocheux & cavernes' },
  { id: 'SPIRES', label: 'Aiguilles & Pics', icon: '🏔️', desc: 'Pics verticaux & gouffres' },
  { id: 'CAVERN', label: 'Grotte Caverne', icon: '🦇', desc: 'Plafond rocheux & tunnels' },
  { id: 'ORGANIC_CAVES', label: 'Labyrinthe Boyaux', icon: '🕳️', desc: 'Tunnels organiques sinueux' },
  { id: 'FORTRESS', label: 'Deux Forteresses', icon: '🏰', desc: 'Canyons & châteaux' },
  { id: 'FLOATING_CHAOS', label: 'Archipel Flottant', icon: '☁️', desc: 'Îlots suspendus & ciel azur' },
];

interface LobbyMapConfigProps {
  config: GameConfig;
  isHost: boolean;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
}

export const LobbyMapConfig: React.FC<LobbyMapConfigProps> = ({ config, isHost, onChangeConfig }) => {
  const currentSizeCfg = MAP_SIZE_CONFIGS[config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  return (
    <div className="md:col-span-7 landscape:col-span-7 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-4 rounded-2xl shadow-xl space-y-3">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Zone d'Opérations & Radar
        </h2>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
          {currentSizeCfg.width}×{currentSizeCfg.height} px
        </span>
      </div>

      <div className="space-y-2">
        <MapThumbnailPreview theme={config.mapTheme} size={config.mapSize || 'NORMAL'} seed={config.mapSeed} />

        <div className="grid grid-cols-2 gap-1.5">
          {MAP_THEMES.map((theme) => (
            <button
              key={theme.id}
              disabled={!isHost}
              onClick={() => onChangeConfig({ mapTheme: theme.id })}
              className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                config.mapTheme === theme.id
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
              onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
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
          <Rocket className="w-3 h-3 text-violet-400" /> Arsenal W.M.D
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.values(WEAPON_SETS).map((wSet) => (
            <button
              key={wSet.id}
              disabled={!isHost}
              onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
              className={`p-2 rounded-xl border text-left transition ${
                config.weaponSetId === wSet.id
                  ? 'bg-violet-950/90 border-violet-500 text-white shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
              }`}
            >
              <div className="font-bold text-[11px] truncate">{wSet.name}</div>
              <div className="text-[9px] text-zinc-400 line-clamp-1 leading-snug mt-0.5">{wSet.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-zinc-800">
        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Swords className="w-3 h-3 text-violet-400" /> Règles d'Engagement
        </label>
        
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
    </div>
  );
};

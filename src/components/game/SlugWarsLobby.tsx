import React, { useRef, useEffect } from 'react';
import { GameConfig, Team, MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../core/types';
import { generateProceduralTerrain } from '../../core/terrainGenerator';
import { WEAPON_SETS } from '../../core/weapons/weaponSets';
import { RoomCodeBadge, CopyRoomLinkButton } from 'p2play-core';
import { Dices, Play, RefreshCw, Shield, Sparkles } from 'lucide-react';

interface SlugWarsLobbyProps {
  isHost: boolean;
  myPeerId: string;
  hostPeerId: string;
  config: GameConfig;
  teams: Team[];
  isEmbedded?: boolean;
  onExit?: () => void;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
  onStartGame: () => void;
}

const MAP_THEMES: { id: MapTheme; label: string; icon: string }[] = [
  { id: 'ISLAND', label: 'Île Ouverte', icon: '🏝️' },
  { id: 'CAVERN', label: 'Grotte Caverne', icon: '🦇' },
  { id: 'FORTRESS', label: 'Deux Forteresses', icon: '🏰' },
  { id: 'FLOATING_CHAOS', label: 'Archipel Flottant', icon: '🌌' },
];

const MapThumbnailPreview: React.FC<{ theme: MapTheme; size: MapSize; seed: number }> = ({ theme, size, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCfg = MAP_SIZE_CONFIGS[size || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = canvas.width;
    const previewH = canvas.height;

    // Generate miniature terrain using selected dimensions
    const terrain = generateProceduralTerrain(seed, theme, sizeCfg.width, sizeCfg.height);
    const { grid, width, height, waterLevel } = terrain;

    // 1. Draw Thematic Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, previewH);
    if (theme === 'ISLAND') {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#93c5fd');
      skyGrad.addColorStop(1, '#60a5fa');
    } else if (theme === 'CAVERN') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#312e81');
    } else if (theme === 'FORTRESS') {
      skyGrad.addColorStop(0, '#ea580c');
      skyGrad.addColorStop(0.5, '#9a3412');
      skyGrad.addColorStop(1, '#431407');
    } else {
      skyGrad.addColorStop(0, '#09090b');
      skyGrad.addColorStop(0.5, '#2e1065');
      skyGrad.addColorStop(1, '#581c87');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, previewW, previewH);

    // 2. Downsampled Terrain Surface & Underground Drawing
    const imgData = ctx.createImageData(previewW, previewH);
    const data = imgData.data;

    const grassR = theme === 'ISLAND' ? 34 : theme === 'CAVERN' ? 71 : theme === 'FORTRESS' ? 132 : 168;
    const grassG = theme === 'ISLAND' ? 197 : theme === 'CAVERN' ? 85 : theme === 'FORTRESS' ? 204 : 85;
    const grassB = theme === 'ISLAND' ? 94 : theme === 'CAVERN' ? 105 : theme === 'FORTRESS' ? 22 : 247;

    const rockR = theme === 'ISLAND' ? 120 : theme === 'CAVERN' ? 30 : theme === 'FORTRESS' ? 82 : 46;
    const rockG = theme === 'ISLAND' ? 53 : theme === 'CAVERN' ? 27 : theme === 'FORTRESS' ? 82 : 16;
    const rockB = theme === 'ISLAND' ? 15 : theme === 'CAVERN' ? 75 : theme === 'FORTRESS' ? 91 : 101;

    for (let py = 0; py < previewH; py++) {
      const srcY = Math.floor((py / previewH) * height);
      for (let px = 0; px < previewW; px++) {
        const srcX = Math.floor((px / previewW) * width);
        const isSolid = grid[srcY * width + srcX] === 1;

        if (isSolid) {
          const idx = (py * previewW + px) * 4;
          const isAboveSolid = srcY > 0 && grid[(srcY - 1) * width + srcX] === 1;
          if (!isAboveSolid) {
            data[idx] = grassR;
            data[idx + 1] = grassG;
            data[idx + 2] = grassB;
            data[idx + 3] = 255;
          } else {
            data[idx] = rockR;
            data[idx + 1] = rockG;
            data[idx + 2] = rockB;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // 3. Water Surface at Bottom
    const waterCanvasY = (waterLevel / height) * previewH;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.7)';
    ctx.fillRect(0, waterCanvasY, previewW, previewH - waterCanvasY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waterCanvasY);
    ctx.lineTo(previewW, waterCanvasY);
    ctx.stroke();
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-inner">
      <canvas ref={canvasRef} width={380} height={140} className="w-full h-[140px] block" />
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded border border-white/20 text-[10px] font-mono text-zinc-200 shadow">
        Seed: #{seed}
      </div>
      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/75 backdrop-blur rounded border border-white/20 text-[10px] font-bold text-violet-300 shadow flex items-center gap-1">
        <span>🗺️ {sizeCfg.label} ({sizeCfg.width}×{sizeCfg.height})</span>
      </div>
    </div>
  );
};

export const SlugWarsLobby: React.FC<SlugWarsLobbyProps> = ({
  isHost,
  myPeerId,
  hostPeerId,
  config,
  teams,
  isEmbedded,
  onExit,
  onChangeConfig,
  onStartGame,
}) => {
  const currentSizeCfg = MAP_SIZE_CONFIGS[config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900/80 backdrop-blur border border-zinc-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐌</span>
          <div>
            <h1 className="text-2xl font-black text-violet-400">Slug Wars P2P</h1>
            <p className="text-sm text-zinc-400">Salon de configuration avant-partie</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoomCodeBadge code={hostPeerId || myPeerId} label="Code Salon" accentClassName="text-violet-400" />
          <CopyRoomLinkButton code={hostPeerId || myPeerId} id="slugwars-lobby-copy" />
          {isEmbedded && onExit && (
            <button onClick={onExit} className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-lg text-xs font-semibold text-red-300 transition">
              Quitter vers Hub
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Pre-game Configuration */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl space-y-5">
          <h2 className="text-lg font-bold text-violet-300 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" /> Configuration de Partie
          </h2>

          {/* Map Theme, Size & Real-time Live Thumbnail Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase text-zinc-400">Thème & Dimensions de la Carte</label>
              <span className="text-[11px] font-mono text-zinc-500">{currentSizeCfg.width}×{currentSizeCfg.height} px</span>
            </div>

            {/* Interactive Real-Time Map Preview */}
            <MapThumbnailPreview theme={config.mapTheme} size={config.mapSize || 'NORMAL'} seed={config.mapSeed} />

            {/* Map Theme Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {MAP_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  disabled={!isHost}
                  onClick={() => onChangeConfig({ mapTheme: theme.id })}
                  className={`p-2.5 rounded-lg border text-left text-xs font-bold transition flex items-center gap-2 ${
                    config.mapTheme === theme.id
                      ? 'bg-violet-950/80 border-violet-500 text-violet-200'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <span>{theme.icon}</span>
                  <span>{theme.label}</span>
                </button>
              ))}
            </div>

            {/* Map Size Buttons: Petite / Normale / Grande */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase text-zinc-400">Taille du Champ de Bataille</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(MAP_SIZE_CONFIGS) as [MapSize, typeof MAP_SIZE_CONFIGS[MapSize]][]).map(([sizeKey, sizeVal]) => (
                  <button
                    key={sizeKey}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ mapSize: sizeKey })}
                    className={`p-2 rounded-lg border text-left transition flex flex-col gap-0.5 ${
                      (config.mapSize || 'NORMAL') === sizeKey
                        ? 'bg-violet-950/80 border-violet-500 text-violet-200 shadow-sm'
                        : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-bold">
                      <span>{sizeVal.icon}</span>
                      <span>{sizeVal.label}</span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-400">{sizeVal.width}×{sizeVal.height}</div>
                  </button>
                ))}
              </div>
            </div>

            {isHost && (
              <button
                onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
                className="w-full mt-1 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition"
              >
                <Dices className="w-4 h-4 text-violet-400" /> Régénérer la carte (Seed: #{config.mapSeed})
              </button>
            )}
          </div>

          {/* Weapon Set Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400">Arsenal W.M.D</label>
            <div className="space-y-2">
              {Object.values(WEAPON_SETS).map((wSet) => (
                <button
                  key={wSet.id}
                  disabled={!isHost}
                  onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
                  className={`w-full p-3 rounded-lg border text-left transition ${
                    config.weaponSetId === wSet.id
                      ? 'bg-violet-950/80 border-violet-500 text-violet-200'
                      : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="font-bold text-sm">{wSet.name}</div>
                  <div className="text-xs text-zinc-400">{wSet.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Slugs Count & HP Options */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase text-zinc-400">Configuration des Limaces</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Slugs Per Team Button */}
              {isHost ? (
                <button
                  onClick={() => {
                    const counts = [1, 2, 3, 4, 6, 8];
                    const next = counts[(counts.indexOf(config.slugsPerTeam ?? 3) + 1) % counts.length];
                    onChangeConfig({ slugsPerTeam: next });
                  }}
                  className="p-3 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/80 rounded-xl text-left transition"
                >
                  <div className="text-[11px] text-zinc-400 font-medium">Limaces / Équipe</div>
                  <div className="text-base font-bold text-violet-300 flex items-center justify-between">
                    <span>🐌 {config.slugsPerTeam} {config.slugsPerTeam > 1 ? 'Limaces' : 'Limace'}</span>
                    <span className="text-[10px] bg-violet-950 text-violet-300 border border-violet-800 px-1.5 py-0.5 rounded font-mono uppercase">Changer</span>
                  </div>
                </button>
              ) : (
                <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">Limaces / Équipe</div>
                  <div className="text-base font-bold text-violet-300">🐌 {config.slugsPerTeam} Limaces</div>
                </div>
              )}

              {/* HP Per Slug Button */}
              {isHost ? (
                <button
                  onClick={() => {
                    const hps = [50, 100, 150, 200];
                    const next = hps[(hps.indexOf(config.slugHp ?? 100) + 1) % hps.length];
                    onChangeConfig({ slugHp: next });
                  }}
                  className="p-3 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/80 rounded-xl text-left transition"
                >
                  <div className="text-[11px] text-zinc-400 font-medium">PV Initial / Limace</div>
                  <div className="text-base font-bold text-emerald-400 flex items-center justify-between">
                    <span>❤️ {config.slugHp} HP</span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono uppercase">Changer</span>
                  </div>
                </button>
              ) : (
                <div className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-medium">PV Initial / Limace</div>
                  <div className="text-base font-bold text-emerald-400">❤️ {config.slugHp} HP</div>
                </div>
              )}
            </div>
          </div>

          {/* Options Toggles */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            {/* Day / Night Selector */}
            {isHost ? (
              <button
                onClick={() =>
                  onChangeConfig({
                    dayNightCycle: config.dayNightCycle === 'DAY' ? 'NIGHT' : 'DAY',
                  })
                }
                className={`p-3 rounded-xl border text-left transition ${
                  config.dayNightCycle === 'DAY'
                    ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                    : 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
                }`}
              >
                <span className="text-xs text-zinc-400 font-medium">Ambiance</span>
                <div className="text-sm font-bold flex items-center gap-1">
                  {config.dayNightCycle === 'DAY' ? 'Jour ☀️' : 'Nuit 🌙'}
                </div>
              </button>
            ) : (
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                <span className="text-xs text-zinc-400 font-medium">Ambiance</span>
                <div className="text-sm font-bold text-amber-400">
                  {config.dayNightCycle === 'DAY' ? 'Jour ☀️' : 'Nuit 🌙'}
                </div>
              </div>
            )}

            {isHost ? (
              <button
                onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
                className={`p-3 rounded-xl border text-left transition ${
                  config.windEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                }`}
              >
                <span className="text-xs text-zinc-400">Vent</span>
                <div className="text-sm font-bold">{config.windEnabled ? 'Activé 💨' : 'Sans'}</div>
              </button>
            ) : (
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                <span className="text-xs text-zinc-400">Vent</span>
                <div className="text-sm font-bold text-emerald-400">{config.windEnabled ? 'Activé 💨' : 'Sans'}</div>
              </div>
            )}

            {isHost ? (
              <button
                onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
                className={`p-3 rounded-xl border text-left transition ${
                  config.vehiclesEnabled
                    ? 'bg-violet-950/60 border-violet-500/60 text-violet-200'
                    : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                }`}
              >
                <span className="text-xs text-zinc-400">Véhicules</span>
                <div className="text-sm font-bold">{config.vehiclesEnabled ? 'Hélico 🚁' : 'Sans'}</div>
              </button>
            ) : (
              <div className="bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/50">
                <span className="text-xs text-zinc-400">Véhicules</span>
                <div className="text-sm font-bold text-amber-400">{config.vehiclesEnabled ? 'Hélico 🚁' : 'Sans'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Player Teams & Launch */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-bold text-violet-300 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-violet-400" /> Équipes dans le Salon ({teams.length})
            </h2>
            <div className="space-y-3">
              {teams.map((t) => (
                <div key={t.id} className="p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{t.avatar}</span>
                    <div>
                      <div className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                        {t.name}
                        {t.isHost && <span className="px-1.5 py-0.5 bg-violet-900/80 text-violet-300 text-[10px] rounded font-bold uppercase">Hôte</span>}
                      </div>
                      <div className="text-xs text-zinc-400">{config.slugsPerTeam} limaces prêtes au combat</div>
                    </div>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.color }} />
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={onStartGame}
              disabled={teams.length === 0}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-lg rounded-xl shadow-lg shadow-violet-950/50 flex items-center justify-center gap-3 transition active:scale-[0.98] disabled:opacity-50"
            >
              <Play className="w-6 h-6 fill-current" /> Lancer la Partie 🚀
            </button>
          ) : (
            <div className="p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-xl text-center text-sm text-zinc-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-violet-400" /> En attente de l'hôte pour lancer la partie...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

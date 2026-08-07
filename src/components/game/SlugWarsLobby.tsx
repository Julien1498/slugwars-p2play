import React from 'react';
import { GameConfig, Team, MapTheme } from '../../core/types';
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

          {/* Map Theme & Seed */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase text-zinc-400">Thème de la Carte Procédurale</label>
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
            {isHost && (
              <button
                onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
                className="w-full mt-2 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition"
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

          {/* Options Toggles */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
              <span className="text-xs text-zinc-400">PV / Limace</span>
              <div className="text-lg font-bold text-violet-300">{config.slugHp} HP</div>
            </div>
            {isHost ? (
              <button
                onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
                className={`p-3 rounded-lg border text-left transition ${
                  config.windEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                }`}
              >
                <span className="text-xs text-zinc-400">Vent</span>
                <div className="text-sm font-bold">{config.windEnabled ? 'Activé 💨' : 'Désactivé'}</div>
              </button>
            ) : (
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
                <span className="text-xs text-zinc-400">Vent</span>
                <div className="text-sm font-bold text-emerald-400">{config.windEnabled ? 'Activé 💨' : 'Désactivé'}</div>
              </div>
            )}

            {isHost ? (
              <button
                onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
                className={`p-3 rounded-lg border text-left transition ${
                  config.vehiclesEnabled
                    ? 'bg-violet-950/60 border-violet-500/60 text-violet-200'
                    : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400'
                }`}
              >
                <span className="text-xs text-zinc-400">Véhicules</span>
                <div className="text-sm font-bold">{config.vehiclesEnabled ? 'Hélico 🚁' : 'Sans'}</div>
              </button>
            ) : (
              <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
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

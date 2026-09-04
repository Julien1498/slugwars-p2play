import React, { useState } from 'react';
import { Team, GameConfig } from '../../../core/types';
import { Users, Play, RefreshCw } from 'lucide-react';
import { getHat } from '../../../core/cosmetics/hatsRegistry';
import { HatPickerModal } from './HatPickerModal';
import { HatPreviewCanvas } from './HatPreviewCanvas';

interface LobbyTeamListProps {
  teams: Team[];
  config: GameConfig;
  isHost: boolean;
  myPeerId?: string | null;
  onStartGame: () => void;
  onSetTeamHat?: (teamId: string, hatId: string) => void;
}

export const LobbyTeamList: React.FC<LobbyTeamListProps> = ({
  teams,
  config,
  isHost,
  myPeerId,
  onStartGame,
  onSetTeamHat,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || null;

  return (
    <div className="md:col-span-5 landscape:col-span-5 flex flex-col bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-3.5 rounded-2xl shadow-xl space-y-2">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-violet-400" /> Escouades Engagées ({teams.length}/6)
        </h2>
        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-full">
          Prêts au combat
        </span>
      </div>

      {/* Squad Dossier Cards List */}
      <div className="space-y-2 flex-1">
        {teams.map((t, idx) => {
          const hatDef = getHat(t.hat);
          const canCustomize = isHost || t.id === myPeerId;

          return (
            <div
              key={t.id}
              className="p-2.5 bg-zinc-950/80 border border-zinc-800 hover:border-violet-500/40 rounded-xl flex items-center justify-between transition shadow-sm gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/20"
                    style={{ backgroundColor: `${t.color}33` }}
                  >
                    {t.avatar}
                  </div>
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 shadow"
                    style={{ backgroundColor: t.color }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-zinc-100 flex items-center gap-1.5 truncate">
                    <span className="truncate">{t.name}</span>
                    {t.isHost && (
                      <span className="px-1.5 py-0.2 bg-violet-950 text-violet-300 border border-violet-600/50 text-[8px] rounded font-black uppercase flex-shrink-0">
                        Commandant
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                    Équipe #{idx + 1} • <span className="text-violet-300 font-semibold">{config.slugsPerTeam} limaces ({config.slugHp} HP)</span>
                  </div>
                </div>
              </div>

              {/* Hat Customization Button & Color Indicator */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  disabled={!canCustomize}
                  onClick={() => canCustomize && setSelectedTeamId(t.id)}
                  className={`w-8 h-8 rounded-xl border flex items-center justify-center transition flex-shrink-0 ${
                    canCustomize
                      ? 'bg-zinc-900 hover:bg-violet-950/60 border-zinc-700 hover:border-violet-500/50 text-zinc-200 cursor-pointer shadow-sm active:scale-95'
                      : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 cursor-default'
                  }`}
                  title={canCustomize ? `Changer de couvre-chef (${hatDef.name})` : `Couvre-chef : ${hatDef.name}`}
                  aria-label={canCustomize ? `Changer de couvre-chef (${hatDef.name})` : `Couvre-chef : ${hatDef.name}`}
                >
                  <HatPreviewCanvas hatId={t.hat || 'military'} teamColor={t.color} size={24} />
                </button>

                <div
                  className="w-2.5 h-6 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: t.color }}
                />
              </div>
            </div>
          );
        })}

        {/* Waiting Slot Placeholder */}
        {teams.length < 6 && (
          <div className="p-3 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-ping" />
            <span>En attente d'autres joueurs...</span>
          </div>
        )}
      </div>

      {/* Launch Game Action Bar */}
      <div className="pt-2 border-t border-zinc-800 space-y-1.5 mt-auto">
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={teams.length === 0}
            className="w-full py-2.5 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 text-white font-black text-sm md:text-base rounded-xl shadow-xl shadow-violet-950/60 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 animate-pulse hover:animate-none"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>LANCER L'ASSAUT 🚀</span>
          </button>
        ) : (
          <div className="p-3 bg-zinc-950/80 border border-violet-500/30 rounded-xl text-center text-xs text-zinc-300 flex items-center justify-center gap-2 shadow-inner">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
            <span className="font-semibold text-xs">En attente du lancement par le Commandant...</span>
          </div>
        )}
        
        <div className="text-center text-[10px] text-zinc-500 font-medium">
          Terrain destructible • Tour par tour • P2P
        </div>
      </div>

      {selectedTeam && (
        <HatPickerModal
          isOpen={true}
          onClose={() => setSelectedTeamId(null)}
          currentHatId={selectedTeam.hat}
          teamName={selectedTeam.name}
          teamColor={selectedTeam.color}
          onSelectHat={(hatId) => {
            onSetTeamHat?.(selectedTeam.id, hatId);
          }}
        />
      )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { GameState } from '../../core/types';
import { getWeapon } from '../../core/weapons/registry';
import { WindIndicator } from './WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import { Clock, Crosshair, Heart, Activity, AlertTriangle } from 'lucide-react';

interface TurnHeaderProps {
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  isHost?: boolean;
  onOpenWeaponPicker: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
}

export const TurnHeader: React.FC<TurnHeaderProps> = React.memo(({
  gameState,
  hostPeerId,
  isMyTurn,
  isHost,
  onOpenWeaponPicker,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
}) => {
  const [showConfirmLobby, setShowConfirmLobby] = useState(false);
  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;

  const teamStats = useMemo(() => {
    return gameState.teams.map((team) => {
      const teamSlugs = gameState.slugs.filter((s) => s.teamId === team.id);
      const totalHp = teamSlugs.reduce((acc, s) => acc + (s.isAlive ? s.hp : 0), 0);
      const maxHp = gameState.config.slugsPerTeam * gameState.config.slugHp;
      const hpPercent = Math.max(0, Math.min(1, totalHp / (maxHp || 1)));
      const isActive = team.id === gameState.activeTeamId;
      return { team, totalHp, hpPercent, isActive };
    });
  }, [gameState.teams, gameState.slugs, gameState.config.slugsPerTeam, gameState.config.slugHp, gameState.activeTeamId]);

  return (
    <>
      <div className="bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-3 py-1.5 flex items-center justify-between gap-2.5 shadow-md shrink-0">
        {/* Top Left: Active Slug & Turn Status */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-3.5 h-3.5 rounded-full border border-white/40 shadow shrink-0"
              style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
            />
            <div>
              <div className="font-black text-sm text-zinc-100 flex items-center gap-2 leading-none">
                <span>{activeSlug?.name || 'Tour de jeu'}</span>
                {isMyTurn && (
                  <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/60 text-emerald-300 text-[10px] font-black uppercase rounded-full animate-pulse shadow-sm">
                    🎯 Votre tour !
                  </span>
                )}
              </div>
              <div className="text-[10px] font-semibold text-zinc-400 leading-none mt-0.5">Équipe {activeTeam?.name}</div>
            </div>
          </div>

          {/* Turn Timer Clock or RETREAT / TURN_START Phase Badge */}
          {gameState.phase === 'RETREAT' ? (
            <div className="flex items-center gap-1.5 bg-red-950 border border-red-500/80 px-2.5 py-0.5 rounded-lg text-xs font-black text-red-400 shadow-inner animate-pulse">
              <Clock className="w-3.5 h-3.5 text-red-400 animate-spin" style={{ animationDuration: '1s' }} />
              <span className="font-mono text-sm uppercase">🏃 FUITE : {Math.max(0, Math.ceil(gameState.retreatTimer ?? 4))}s</span>
            </div>
          ) : gameState.phase === 'TURN_START' ? (
            <div className="flex items-center gap-1.5 bg-purple-950 border border-purple-500/80 px-2.5 py-0.5 rounded-lg text-xs font-black text-purple-300 shadow-inner animate-bounce">
              <span>📣 DÉBUT DU TOUR !</span>
            </div>
          ) : gameState.phase === 'PLACEMENT' ? (
            <div className="flex items-center gap-1.5 bg-amber-950 border border-amber-500/80 px-2.5 py-0.5 rounded-lg text-xs font-black text-amber-300 shadow-inner animate-pulse">
              <span>📍 PLACEMENT LIMACE</span>
            </div>
          ) : gameState.phase === 'CASUALTIES' ? (
            <div className="flex items-center gap-1.5 bg-amber-950 border border-amber-500/80 px-2.5 py-0.5 rounded-lg text-xs font-black text-amber-300 shadow-inner">
              <span>💀 BILAN DÉGÂTS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-zinc-950 border border-amber-500/40 px-2.5 py-0.5 rounded-lg text-xs font-black text-amber-400 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="font-mono text-sm">{Math.max(0, Math.ceil(gameState.turnTimer))}s</span>
            </div>
          )}
        </div>

        {/* Worms Team Total HP Leaderboard */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full py-0.5 px-2 bg-zinc-950/80 border border-zinc-800 rounded-lg shrink min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1 shrink-0">
            <Heart className="w-3 h-3 text-red-500 fill-red-500" /> Équipes :
          </span>
          {teamStats.map(({ team, totalHp, hpPercent, isActive }) => (
            <div
              key={team.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold transition shrink-0 ${
                isActive
                  ? 'bg-zinc-800 border-amber-500/80 text-white shadow-sm'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
              <span className="truncate max-w-[100px]">{team.name}</span>
              <span className="font-mono text-[11px] text-amber-300">{totalHp} HP</span>
              <div className="w-10 h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${hpPercent * 100}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right Controls: Wind, Rising Water, Weapon Button, Room Code & Exit */}
        <div className="flex items-center gap-2 shrink-0">
          <WindIndicator wind={gameState.wind} />

          {/* Rising Water Active Indicator */}
          {gameState.config.waterRiseSpeed && gameState.config.waterRiseSpeed !== 'OFF' && (
            <div
              className="px-2 py-1 bg-sky-950/80 border border-sky-500/60 text-sky-300 text-[11px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              title={`Montée des eaux active : ${gameState.config.waterRiseSpeed}`}
            >
              <span className="animate-pulse">🌊</span>
              <span>
                {gameState.config.waterRiseSpeed === 'SLOW'
                  ? '+6px/tour'
                  : gameState.config.waterRiseSpeed === 'NORMAL'
                  ? '+14px/tour'
                  : '+26px/tour'}
              </span>
            </div>
          )}

          {activeWeapon && (
            <button
              onClick={onOpenWeaponPicker}
              disabled={!isMyTurn}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition ${
                isMyTurn
                  ? 'bg-violet-950/90 border-violet-500 hover:bg-violet-900 text-violet-200 shadow-md shadow-violet-950'
                  : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 opacity-60'
              }`}
            >
              <span className="text-sm">{activeWeapon.icon}</span>
              <span>{activeWeapon.name}</span>
              <Crosshair className="w-3.5 h-3.5 text-violet-400" />
            </button>
          )}

          <RoomCodeBadge code={hostPeerId} label="Salon" accentClassName="text-violet-400" />
          {onOpenMetrics && (
            <button
              onClick={onOpenMetrics}
              title="Métriques de performances & réseau P2P"
              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 rounded-lg text-xs font-bold text-emerald-300 transition flex items-center gap-1 shadow-sm"
            >
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Perfs</span>
            </button>
          )}
          <button
            onClick={onOpenRules}
            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition"
          >
            📖
          </button>
          {isHost && onRestartGame && (
            <button
              onClick={() => setShowConfirmLobby(true)}
              title="Retourner au Salon (Lobby) pour tous les joueurs"
              className="px-2 py-1 bg-amber-950/90 hover:bg-amber-900 border border-amber-500/70 rounded-lg text-xs font-bold text-amber-200 transition flex items-center gap-1 shadow-sm"
            >
              <span>🏠 Salon</span>
            </button>
          )}
          {onExit && (
            <button
              onClick={onExit}
              className="px-2 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-lg text-xs font-semibold text-red-300 transition"
            >
              Quitter
            </button>
          )}
        </div>
      </div>

      {/* Return to Lobby Host Confirmation Modal */}
      {showConfirmLobby && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-amber-500/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Retourner au Salon ?</h3>
                <p className="text-xs text-zinc-400 mt-0.5">La partie en cours sera interrompue pour tous les joueurs connectés.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowConfirmLobby(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowConfirmLobby(false);
                  onRestartGame?.();
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5"
              >
                <span>Confirmer le retour</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}, (prev, next) => {
  if (prev.isMyTurn !== next.isMyTurn) return false;
  if (prev.isHost !== next.isHost) return false;
  if (prev.hostPeerId !== next.hostPeerId) return false;
  if (prev.onRestartGame !== next.onRestartGame) return false;

  const pState = prev.gameState;
  const nState = next.gameState;
  if (pState === nState) return true;

  if (pState.phase !== nState.phase) return false;
  if (Math.ceil(pState.turnTimer) !== Math.ceil(nState.turnTimer)) return false;
  if (Math.ceil(pState.retreatTimer ?? 0) !== Math.ceil(nState.retreatTimer ?? 0)) return false;
  if (pState.activeTeamId !== nState.activeTeamId) return false;
  if (pState.activeSlugId !== nState.activeSlugId) return false;
  if (pState.wind !== nState.wind) return false;
  if (pState.teams !== nState.teams && pState.teams.length !== nState.teams.length) return false;

  const pActiveSlug = pState.slugs.find((s) => s.id === pState.activeSlugId);
  const nActiveSlug = nState.slugs.find((s) => s.id === nState.activeSlugId);
  if (pActiveSlug?.selectedWeaponId !== nActiveSlug?.selectedWeaponId) return false;
  if (pActiveSlug?.name !== nActiveSlug?.name) return false;

  if (pState.slugs !== nState.slugs) {
    if (pState.slugs.length !== nState.slugs.length) return false;
    for (let i = 0; i < pState.slugs.length; i++) {
      const ps = pState.slugs[i];
      const ns = nState.slugs[i];
      if (ps.hp !== ns.hp || ps.isAlive !== ns.isAlive || ps.teamId !== ns.teamId) {
        return false;
      }
    }
  }

  return true;
});

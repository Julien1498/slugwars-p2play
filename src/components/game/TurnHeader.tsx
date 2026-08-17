import React, { useMemo, useState, useRef, useEffect } from 'react';
import { GameState } from '../../core/types';
import { getWeapon } from '../../core/weapons/registry';
import { WindIndicator } from './WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import { Clock, Crosshair, Heart, Activity, AlertTriangle, BookOpen, Home, LogOut, Settings, Eye, ChevronDown } from 'lucide-react';

interface TurnHeaderProps {
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  isHost?: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
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
  showHitboxes,
  onToggleHitboxes,
  onOpenWeaponPicker,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
}) => {
  const [showConfirmLobby, setShowConfirmLobby] = useState(false);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;

  // Close Menu Popover when clicking outside
  useEffect(() => {
    if (!showMenuPopover) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenuPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenuPopover]);

  const teamStats = useMemo(() => {
    return gameState.teams.map((team) => {
      const teamSlugs = gameState.slugs.filter((s) => s.teamId === team.id);
      const aliveSlugs = teamSlugs.filter((s) => s.isAlive).length;
      const totalHp = teamSlugs.reduce((acc, s) => acc + (s.isAlive ? s.hp : 0), 0);
      const maxHp = gameState.config.slugsPerTeam * gameState.config.slugHp;
      const hpPercent = Math.max(0, Math.min(1, totalHp / (maxHp || 1)));
      const isActive = team.id === gameState.activeTeamId;
      return { team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs: teamSlugs.length };
    });
  }, [gameState.teams, gameState.slugs, gameState.config.slugsPerTeam, gameState.config.slugHp, gameState.activeTeamId]);

  const turnTime = Math.max(0, Math.ceil(gameState.turnTimer));
  const isTimeUrgent = turnTime <= 5 && gameState.phase === 'AIMING';

  return (
    <>
      <header className="bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-xl px-2.5 py-1 flex items-center justify-between gap-2 shadow-xl shrink-0 mx-1 mt-0.5 z-30 transition-all">
        {/* Left: Active Player / Turn Status Card */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="flex items-center gap-2 px-2 py-0.5 rounded-lg border bg-zinc-900/90 shadow transition-all"
            style={{
              borderColor: activeTeam ? `${activeTeam.color}60` : '#3f3f46',
              boxShadow: activeTeam ? `0 0 10px ${activeTeam.color}20` : undefined,
            }}
          >
            {/* Glowing Team Dot */}
            <div className="relative flex items-center justify-center">
              <div
                className="w-2.5 h-2.5 rounded-full shadow-inner"
                style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
              />
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-60 pointer-events-none"
                style={{ backgroundColor: activeTeam?.color || '#a855f7' }}
              />
            </div>

            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-xs text-zinc-100 tracking-tight">
                {activeSlug?.name || 'Tour de jeu'}
              </span>
              {isMyTurn ? (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 border border-emerald-500/70 text-emerald-300 text-[9px] font-black uppercase rounded-full animate-pulse shadow-[0_0_6px_#10b981]">
                  🎯 Votre tour
                </span>
              ) : (
                <span className="px-1 py-0.2 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[9px] font-semibold rounded">
                  {activeTeam?.name}
                </span>
              )}
            </div>
          </div>

          {/* Turn Timer Clock / Special Phase Badge */}
          {gameState.phase === 'RETREAT' ? (
            <div className="flex items-center gap-1 bg-orange-950/90 border border-orange-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-orange-300 shadow animate-pulse">
              <Clock className="w-3 h-3 text-orange-400 animate-spin" style={{ animationDuration: '1.2s' }} />
              <span className="font-mono text-xs uppercase">FUITE: {Math.max(0, Math.ceil(gameState.retreatTimer ?? 4))}s</span>
            </div>
          ) : gameState.phase === 'TURN_START' ? (
            <div className="flex items-center gap-1 bg-purple-950/90 border border-purple-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-purple-300 shadow animate-bounce">
              <span>📣 DÉBUT TOUR</span>
            </div>
          ) : gameState.phase === 'PLACEMENT' ? (
            <div className="flex items-center gap-1 bg-amber-950/90 border border-amber-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-amber-300 shadow animate-pulse">
              <span>📍 PLACEMENT</span>
            </div>
          ) : gameState.phase === 'CASUALTIES' ? (
            <div className="flex items-center gap-1 bg-red-950/90 border border-red-500/80 px-2 py-0.5 rounded-lg text-xs font-black text-red-300 shadow">
              <span>💀 DÉGÂTS</span>
            </div>
          ) : (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-mono text-xs font-black shadow transition-all ${
                isTimeUrgent
                  ? 'bg-red-950/90 border-red-500 text-red-300 shadow-[0_0_10px_#ef4444] animate-pulse'
                  : 'bg-zinc-900/90 border-zinc-800 text-amber-400'
              }`}
            >
              <Clock className={`w-3 h-3 ${isTimeUrgent ? 'text-red-400 animate-spin' : 'text-amber-400'}`} style={{ animationDuration: isTimeUrgent ? '1s' : '4s' }} />
              <span>{turnTime}s</span>
            </div>
          )}
        </div>

        {/* Center: Team Health Leaderboard & Bars */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-0.5 px-2 bg-zinc-900/60 border border-zinc-800/80 rounded-lg shrink min-w-0 shadow-inner">
          <Heart className="w-3 h-3 text-red-500 fill-red-500 shrink-0" />
          {teamStats.map(({ team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs }) => (
            <div
              key={team.id}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-zinc-800/95 border-amber-400/80 text-white shadow ring-1 ring-amber-400/30'
                  : 'bg-zinc-950/50 border-zinc-800 text-zinc-400'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shadow-sm"
                style={{ backgroundColor: team.color }}
              />
              <span className="truncate max-w-[80px] text-zinc-200">{team.name}</span>
              <span className="text-[9px] font-semibold text-zinc-400">({aliveSlugs}/{totalSlugs})</span>
              <span className="font-mono text-[10px] font-black text-amber-300">{totalHp} HP</span>
              <div className="w-10 h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700/60">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${hpPercent * 100}%`,
                    backgroundColor: team.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Tactical Sensors, Weapons & Menu Popover */}
        <div className="flex items-center gap-1.5 shrink-0">
          <WindIndicator wind={gameState.wind} />

          {/* Rising Water Active Badge */}
          {gameState.config.waterRiseSpeed && gameState.config.waterRiseSpeed !== 'OFF' && (
            <div
              className="px-2 py-0.5 bg-sky-950/85 border border-sky-500/50 text-sky-300 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-sm"
              title={`Montée des eaux : ${gameState.config.waterRiseSpeed}`}
            >
              <span className="animate-bounce">🌊</span>
              <span>
                {gameState.config.waterRiseFreq === 'ROUND_CYCLE'
                  ? (gameState.config.waterRiseSpeed === 'SLOW' ? '+16px' : gameState.config.waterRiseSpeed === 'NORMAL' ? '+36px' : '+68px')
                  : (gameState.config.waterRiseSpeed === 'SLOW' ? '+5px' : gameState.config.waterRiseSpeed === 'NORMAL' ? '+12px' : '+24px')}
              </span>
            </div>
          )}

          {/* Highly Accessible Equipped Weapon Button */}
          {activeWeapon && (
            <button
              onClick={onOpenWeaponPicker}
              disabled={!isMyTurn}
              className={`px-3 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-black transition-all shadow-md ${
                isMyTurn
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-violet-400 shadow-[0_0_14px_rgba(147,51,234,0.45)] hover:scale-105 active:scale-95'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-60 cursor-not-allowed'
              }`}
              title="Ouvrir l'Arsenal W.M.D pour choisir une arme"
            >
              <span className="text-sm">{activeWeapon.icon}</span>
              <span>{activeWeapon.name}</span>
              <Crosshair className="w-3 h-3 text-violet-200" />
            </button>
          )}

          <RoomCodeBadge code={hostPeerId} label="Salon" accentClassName="text-violet-400" />

          {/* Consolidated Menu Dropdown Button (Cleans up the HUD!) */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenuPopover(!showMenuPopover)}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                showMenuPopover
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
              title="Menu des options & outils"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-300" />
              <span>Menu</span>
              <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showMenuPopover ? 'rotate-180' : ''}`} />
            </button>

            {/* Menu Popover Dropdown */}
            {showMenuPopover && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-xl rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                {/* Hitboxes Toggle */}
                {onToggleHitboxes && (
                  <button
                    onClick={() => {
                      onToggleHitboxes();
                      setShowMenuPopover(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
                  >
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Hitboxes</span>
                    </div>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${showHitboxes ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-zinc-800 text-zinc-500'}`}>
                      {showHitboxes ? 'ON' : 'OFF'}
                    </span>
                  </button>
                )}

                {/* Perfs Monitor */}
                {onOpenMetrics && (
                  <button
                    onClick={() => {
                      onOpenMetrics();
                      setShowMenuPopover(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-emerald-300"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Métriques & Réseau P2P</span>
                  </button>
                )}

                {/* Rules */}
                <button
                  onClick={() => {
                    onOpenRules();
                    setShowMenuPopover(false);
                  }}
                  className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center gap-2 text-zinc-200"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>Règles d'engagement</span>
                </button>

                <div className="w-full h-px bg-zinc-800/80 my-1" />

                {/* Return to Lobby (Host Only) */}
                {isHost && onRestartGame && (
                  <button
                    onClick={() => {
                      setShowConfirmLobby(true);
                      setShowMenuPopover(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-amber-950/40 transition flex items-center gap-2 text-amber-300"
                  >
                    <Home className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retourner au Salon</span>
                  </button>
                )}

                {/* Exit Game */}
                {onExit && (
                  <button
                    onClick={() => {
                      onExit();
                      setShowMenuPopover(false);
                    }}
                    className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-red-950/40 transition flex items-center gap-2 text-red-400"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Quitter la partie</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Return to Lobby Host Confirmation Modal */}
      {showConfirmLobby && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
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
  if (prev.showHitboxes !== next.showHitboxes) return false;
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

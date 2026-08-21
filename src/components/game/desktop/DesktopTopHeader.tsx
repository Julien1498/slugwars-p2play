import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameState } from '../../../core/types';
import { perfTracker } from '../../../core/perfTracker';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { WindIndicator } from '../WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import {
  Clock,
  Eye,
  BookOpen,
  Settings,
  Home,
  LogOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface DesktopTopHeaderProps {
  gameState: GameState;
  hostPeerId?: string;
  isMyTurn: boolean;
  isHost: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
}

export const DesktopTopHeader: React.FC<DesktopTopHeaderProps> = React.memo(({
  gameState,
  hostPeerId,
  isMyTurn,
  isHost,
  showHitboxes = false,
  onToggleHitboxes,
  onOpenRules,
  onRestartGame,
  onExit,
}) => {
  const [showConfirmLobby, setShowConfirmLobby] = useState(false);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

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

  // Team Stats Calculations
  const teamStats = useMemo(() => {
    return gameState.teams.map((t) => {
      const teamSlugs = gameState.slugs.filter((s) => s.teamId === t.id);
      const aliveSlugs = teamSlugs.filter((s) => s.isAlive && s.hp > 0);
      const totalHp = aliveSlugs.reduce((sum, s) => sum + s.hp, 0);
      const maxHp = (gameState.config.slugsPerTeam || 2) * (gameState.config.slugHp || 100);
      const hpPercent = Math.max(0, Math.min(1, totalHp / Math.max(1, maxHp)));
      return {
        team: t,
        totalHp,
        maxHp,
        hpPercent,
        aliveSlugs: aliveSlugs.length,
        totalSlugs: teamSlugs.length,
        isActive: t.id === gameState.activeTeamId,
      };
    });
  }, [gameState.teams, gameState.slugs, gameState.activeTeamId, gameState.config]);

  const turnTime = gameState.turnTimer ?? 0;
  const isTimeUrgent = turnTime <= 10 && turnTime > 0;
  const activeSlugMaxHp = gameState.config.slugHp || 100;
  const activeSlugHpPercent = activeSlug ? Math.max(0, Math.min(1, activeSlug.hp / activeSlugMaxHp)) : 0;

  return (
    <>
      <header className="w-full flex items-start justify-between gap-4 pointer-events-none select-none px-4 pt-3">
        {/* ========================================================================= */}
        {/* 1. TOP-LEFT: ACTIVE OPERATIVE & SQUAD DOSSIER CARD                        */}
        {/* ========================================================================= */}
        <div className="pointer-events-auto flex items-center gap-3">
          {activeTeam && activeSlug && (
            <div
              className="bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 transition-all"
              style={{
                boxShadow: `0 8px 32px -4px rgba(0,0,0,0.8), 0 0 16px -2px ${activeTeam.color}33`,
                borderColor: `${activeTeam.color}55`,
              }}
            >
              {/* Squad Avatar with Glow Ring */}
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20"
                  style={{ backgroundColor: activeTeam.color }}
                >
                  {activeTeam.avatar || '🐌'}
                </div>
                {isMyTurn && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border border-zinc-950 text-[8px] font-black text-slate-950 items-center justify-center">
                      ⚡
                    </span>
                  </span>
                )}
              </div>

              {/* Slug Identity & Dynamic Health Gauge */}
              <div className="flex flex-col min-w-[130px] max-w-[180px]">
                <div className="flex items-center justify-between gap-2 leading-none">
                  <span className="text-xs font-black text-zinc-100 truncate">
                    {activeSlug.name}
                  </span>
                  <span className="font-mono text-xs font-black text-amber-400">
                    {activeSlug.hp} <span className="text-[10px] text-zinc-500 font-normal">/ {activeSlugMaxHp}</span>
                  </span>
                </div>

                {/* HP Bar */}
                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden mt-1.5 border border-zinc-800 shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${activeSlugHpPercent * 100}%`,
                      backgroundColor:
                        activeSlugHpPercent > 0.5
                          ? '#10b981'
                          : activeSlugHpPercent > 0.25
                          ? '#f59e0b'
                          : '#ef4444',
                    }}
                  />
                </div>

                {/* Team Tag / Turn Status */}
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className="text-[10px] font-bold text-zinc-400 truncate">
                    {activeTeam.name}
                  </span>
                  <span
                    className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm"
                    style={{
                      backgroundColor: isMyTurn ? '#8b5cf633' : `${activeTeam.color}22`,
                      borderColor: isMyTurn ? '#a78bfa' : `${activeTeam.color}66`,
                      color: isMyTurn ? '#c4b5fd' : activeTeam.color,
                    }}
                  >
                    {isMyTurn ? 'À ton tour !' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 2. TOP-CENTER: COMMAND HUB (HEX CHRONOMETER & WIND VANE)                   */}
        {/* ========================================================================= */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5">
          <div className="bg-zinc-950/90 backdrop-blur-2xl border border-violet-500/30 px-5 py-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)] flex flex-col items-center gap-1">
            {/* Phase & Turn Timer */}
            <div className="flex items-center gap-3">
              {gameState.phase === 'RETREAT' ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-950/90 border border-orange-500 rounded-xl text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse">
                  <Flame className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <span className="text-xs font-black uppercase tracking-wider">REPLI TACTIQUE</span>
                  <span className="font-mono text-sm font-black">{turnTime}s</span>
                </div>
              ) : isTimeUrgent ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/90 border border-red-500 rounded-xl text-red-300 shadow-[0_0_20px_#ef4444] animate-bounce">
                  <Clock className="w-4 h-4 text-red-400 animate-spin" />
                  <span className="text-xs font-black uppercase tracking-wider">TIR IMMINENT</span>
                  <span className="font-mono text-base font-black text-white">{turnTime}s</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400/80">
                    {gameState.phase === 'PLACEMENT'
                      ? 'PLACEMENT'
                      : gameState.phase === 'TURN_START'
                      ? 'PRÉPARATION'
                      : 'PHASE DE TIR'}
                  </span>
                  <div className="flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 px-2.5 py-0.5 rounded-lg shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono text-sm font-black text-amber-400">{turnTime}s</span>
                  </div>
                </div>
              )}
            </div>

            {/* Integrated Aerodynamic Wind Indicator */}
            <div className="w-full flex items-center justify-center pt-0.5 border-t border-zinc-800/80">
              <WindIndicator wind={gameState.wind} />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. TOP-RIGHT: SQUADS HEALTH BAROMETER & TOOL TRAY                          */}
        {/* ========================================================================= */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Multi-Team Scoreboard Barometer */}
          <div className="hidden lg:flex items-center gap-2 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 px-3 py-1.5 rounded-2xl shadow-2xl">
            {teamStats.map(({ team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs }) => (
              <div
                key={team.id}
                className={`flex items-center gap-2 px-2 py-1 rounded-xl transition-all ${
                  isActive
                    ? 'bg-zinc-900 border border-amber-500/60 shadow-md scale-105'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: team.color }} />
                <div className="flex flex-col min-w-[65px]">
                  <div className="flex items-center justify-between gap-1 leading-none">
                    <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[55px]">{team.name}</span>
                    <span className="text-[9px] font-mono text-zinc-400">({aliveSlugs}/{totalSlugs})</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1 border border-zinc-800">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${hpPercent * 100}%`,
                        backgroundColor: team.color,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] font-black text-amber-400">
                  {totalHp}
                </span>
              </div>
            ))}
          </div>

          {/* Quick Action Tray (Room Code + Fullscreen + Settings Menu) */}
          <div className="flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 p-1.5 rounded-2xl shadow-2xl">
            <RoomCodeBadge code={hostPeerId || ''} label="Salon" accentClassName="text-violet-400" />

            {/* Fullscreen Button */}
            {isFullscreenSupported && (
              <button
                type="button"
                onClick={toggleFullscreen}
                className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center shadow-sm ${
                  isFullscreen
                    ? 'bg-violet-950/80 border-violet-500 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.4)]'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700 active:scale-95'
                }`}
                title={isFullscreen ? 'Quitter le plein écran (F11)' : 'Plein écran immersif (F11)'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 text-violet-400" /> : <Maximize2 className="w-4 h-4 text-zinc-300" />}
              </button>
            )}

            {/* Settings & Rules Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setShowMenuPopover(!showMenuPopover)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
                  showMenuPopover
                    ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
                title="Options, règles et gestion de session"
              >
                <Settings className="w-4 h-4 text-zinc-300" />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown
                  className={`w-3 h-3 text-zinc-400 transition-transform ${showMenuPopover ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Menu Popover Dropdown */}
              {showMenuPopover && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950/95 border border-zinc-800/90 backdrop-blur-2xl rounded-2xl p-2 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100">
                  {/* Fullscreen Toggle in menu */}
                  {isFullscreenSupported && (
                    <button
                      type="button"
                      onClick={() => {
                        toggleFullscreen();
                        setShowMenuPopover(false);
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
                    >
                      <div className="flex items-center gap-2">
                        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-violet-400" /> : <Maximize2 className="w-3.5 h-3.5 text-violet-400" />}
                        <span>Plein écran</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${isFullscreen ? 'bg-violet-950 text-violet-300 border border-violet-700' : 'bg-zinc-800 text-zinc-500'}`}>
                        {isFullscreen ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* Hitboxes Toggle */}
                  {onToggleHitboxes && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleHitboxes();
                        setShowMenuPopover(false);
                      }}
                      className="w-full px-3 py-2 text-left rounded-xl text-xs font-semibold hover:bg-zinc-900 transition flex items-center justify-between text-zinc-200"
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Hitboxes tactiques</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${showHitboxes ? 'bg-cyan-950 text-cyan-300 border border-cyan-700' : 'bg-zinc-800 text-zinc-500'}`}>
                        {showHitboxes ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* Rules Modal Trigger */}
                  <button
                    type="button"
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
                      type="button"
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
                      type="button"
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
        </div>
      </header>

      {/* Return to Lobby Host Confirmation Modal */}
      {showConfirmLobby && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none">
          <div className="bg-zinc-900 border border-amber-500/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 pointer-events-auto">
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
                type="button"
                onClick={() => setShowConfirmLobby(false)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition active:scale-95 cursor-pointer pointer-events-auto"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmLobby(false);
                  onRestartGame?.();
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer pointer-events-auto"
              >
                <span>Confirmer le retour</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

DesktopTopHeader.displayName = 'DesktopTopHeader';

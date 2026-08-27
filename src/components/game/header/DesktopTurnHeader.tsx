import React, { useState } from 'react';
import { GameState, Team, Slug } from '../../../core/types';
import { getWeapon } from '../../../core/weapons/registry';
import { WindIndicator } from '../WindIndicator';
import { RoomCodeBadge } from 'p2play-core';
import { Crosshair, Maximize2, Minimize2 } from 'lucide-react';
import { TurnTimerBadge } from './TurnTimerBadge';
import { TeamStatsLeaderboard, TeamStatItem } from './TeamStatsLeaderboard';
import { HeaderOptionsMenu } from './HeaderOptionsMenu';
import { getWaterRiseBadgeText } from './turnHeaderUtils';

interface DesktopTurnHeaderProps {
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  activeTeam?: Team;
  activeSlug?: Slug;
  teamStats: TeamStatItem[];
  fpsHudActive: boolean;
  setFpsHudActive: (active: boolean) => void;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleFullscreen: () => void;
  isHost?: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenWeaponPicker: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
  onRequestConfirmLobby: () => void;
}

export const DesktopTurnHeader: React.FC<DesktopTurnHeaderProps> = ({
  gameState,
  hostPeerId,
  isMyTurn,
  activeTeam,
  activeSlug,
  teamStats,
  fpsHudActive,
  setFpsHudActive,
  isFullscreen,
  isFullscreenSupported,
  toggleFullscreen,
  isHost,
  showHitboxes,
  onToggleHitboxes,
  onOpenWeaponPicker,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
  onRequestConfirmLobby,
}) => {
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const activeWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
  const waterRiseText = getWaterRiseBadgeText(
    gameState.config.waterRiseSpeed,
    gameState.config.waterRiseFreq
  );

  return (
    <header className="h-9 min-h-[36px] max-h-[36px] bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-xl px-2.5 flex items-center justify-between gap-2 shadow-xl shrink-0 mx-1 mt-0.5 z-30 transition-all whitespace-nowrap">
      {/* Left: Active Player / Turn Status Card + Timer */}
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

        <TurnTimerBadge gameState={gameState} />
      </div>

      {/* Center: Team Health Leaderboard & Bars */}
      <TeamStatsLeaderboard teamStats={teamStats} />

      {/* Right: Tactical Sensors, Weapons & Menu Popover */}
      <div className="flex items-center gap-1.5 shrink-0">
        <WindIndicator wind={gameState.wind} />

        {/* Rising Water Active Badge */}
        {waterRiseText && (
          <div
            className="px-2 py-0.5 bg-sky-950/85 border border-sky-500/50 text-sky-300 text-[10px] font-black rounded-lg flex items-center gap-1 shadow-sm"
            title={`Montée des eaux : ${gameState.config.waterRiseSpeed}`}
          >
            <span className="animate-bounce">🌊</span>
            <span>{waterRiseText}</span>
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

        {/* Fullscreen Button on Desktop */}
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 shadow-sm bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:border-zinc-700 active:scale-95"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-zinc-300" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-zinc-300" />
            )}
          </button>
        )}

        <HeaderOptionsMenu
          showMenuPopover={showMenuPopover}
          setShowMenuPopover={setShowMenuPopover}
          fpsHudActive={fpsHudActive}
          setFpsHudActive={setFpsHudActive}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          toggleFullscreen={toggleFullscreen}
          isHost={isHost}
          showHitboxes={showHitboxes}
          onToggleHitboxes={onToggleHitboxes}
          onOpenRules={onOpenRules}
          onOpenMetrics={onOpenMetrics}
          onRestartGame={onRestartGame}
          onExit={onExit}
          onRequestConfirmLobby={onRequestConfirmLobby}
          isTouch={false}
        />
      </div>
    </header>
  );
};

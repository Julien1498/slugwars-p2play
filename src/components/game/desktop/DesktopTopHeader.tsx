import React, { useState, useEffect, useMemo } from 'react';
import { perfTracker } from '../../../core/perfTracker';
import { useFullscreen } from '../../../hooks/useFullscreen';
import {
  DesktopTopHeaderProps,
  computeDesktopTeamStats,
  desktopTopHeaderPropsAreEqual,
} from './topHeader/desktopHeaderUtils';
import { ActiveOperativeCard } from './topHeader/ActiveOperativeCard';
import { TacticalChronoHub } from './topHeader/TacticalChronoHub';
import { SquadsTelemetryBarometer } from './topHeader/SquadsTelemetryBarometer';
import { DesktopActionTray } from './topHeader/DesktopActionTray';
import { ConfirmReturnModal } from '../modals/ConfirmReturnModal';

export type { DesktopTopHeaderProps };

export const DesktopTopHeader: React.FC<DesktopTopHeaderProps> = React.memo(({
  gameState,
  hostPeerId,
  isMyTurn,
  isHost,
  showHitboxes = false,
  onToggleHitboxes,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
}) => {
  const [showConfirmLobby, setShowConfirmLobby] = useState(false);
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const [fpsHudActive, setFpsHudActive] = useState<boolean>(() => perfTracker.getFpsHudEnabled());
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    return perfTracker.onFpsHudToggle((enabled) => setFpsHudActive(enabled));
  }, []);

  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

  const teamStats = useMemo(() => {
    return computeDesktopTeamStats(gameState);
  }, [gameState.teams, gameState.slugs, gameState.activeTeamId, gameState.config]);

  const activeSlugMaxHp = gameState.config.slugHp || 100;
  const activeSlugHpPercent = activeSlug ? Math.max(0, Math.min(1, activeSlug.hp / activeSlugMaxHp)) : 0;

  return (
    <>
      <header className="w-full flex items-start justify-between gap-4 pointer-events-none select-none px-4 pt-3">
        {/* 1. TOP-LEFT: ACTIVE OPERATIVE & SQUAD DOSSIER CARD */}
        <ActiveOperativeCard
          activeTeam={activeTeam}
          activeSlug={activeSlug}
          isMyTurn={isMyTurn}
          activeSlugMaxHp={activeSlugMaxHp}
          activeSlugHpPercent={activeSlugHpPercent}
        />

        {/* 2. TOP-CENTER: UNIFIED TACTICAL HUB (CHRONO & WIND INDICATOR) */}
        <TacticalChronoHub gameState={gameState} />

        {/* 3. TOP-RIGHT: SQUADS HEALTH BAROMETER & UNIFIED ACTION TRAY */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Multi-Team Scoreboard Barometer */}
          <SquadsTelemetryBarometer teamStats={teamStats} />

          {/* Unified Quick Action Tray (Room Code + Fullscreen + Settings Dropdown Gear) */}
          <DesktopActionTray
            hostPeerId={hostPeerId}
            isFullscreen={isFullscreen}
            isFullscreenSupported={isFullscreenSupported}
            toggleFullscreen={toggleFullscreen}
            showHitboxes={showHitboxes}
            onToggleHitboxes={onToggleHitboxes}
            fpsHudActive={fpsHudActive}
            setFpsHudActive={setFpsHudActive}
            showMenuPopover={showMenuPopover}
            setShowMenuPopover={setShowMenuPopover}
            onOpenRules={onOpenRules}
            onOpenMetrics={onOpenMetrics}
            isHost={isHost}
            onRequestConfirmLobby={() => setShowConfirmLobby(true)}
            onExit={onExit}
          />
        </div>
      </header>

      {/* Confirmation Modal for Returning to Lobby */}
      <ConfirmReturnModal
        isOpen={showConfirmLobby}
        onClose={() => setShowConfirmLobby(false)}
        onConfirm={() => {
          setShowConfirmLobby(false);
          onRestartGame?.();
        }}
      />
    </>
  );
}, desktopTopHeaderPropsAreEqual);

DesktopTopHeader.displayName = 'DesktopTopHeader';

import React, { useState, useEffect, useMemo } from 'react';
import { perfTracker } from '../../../core/perfTracker';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { RoomCodeBadge } from 'p2play-core';
import { HeaderOptionsMenu } from '../header/HeaderOptionsMenu';
import {
  DesktopTopHeaderProps,
  computeDesktopTeamStats,
  desktopTopHeaderPropsAreEqual,
} from './header/desktopHeaderUtils';
import { ActiveOperativeCard } from './header/ActiveOperativeCard';
import { TacticalChronoHub } from './header/TacticalChronoHub';
import { SquadsTelemetryBarometer } from './header/SquadsTelemetryBarometer';
import { ConfirmReturnModal } from './header/ConfirmReturnModal';

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

        {/* 3. TOP-RIGHT: SQUADS HEALTH BAROMETER & TOOL TRAY */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Multi-Team Scoreboard Barometer */}
          <SquadsTelemetryBarometer teamStats={teamStats} />

          {/* Tactical Room Code Badge */}
          {hostPeerId && (
            <RoomCodeBadge
              code={hostPeerId}
              label="Salon"
              accentClassName="text-violet-400"
            />
          )}

          {/* Options & Settings Dropdown Menu */}
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
            onRequestConfirmLobby={() => setShowConfirmLobby(true)}
            isTouch={false}
          />
        </div>
      </header>

      {/* Confirmation Modal for Returning to Lobby */}
      <ConfirmReturnModal
        isOpen={showConfirmLobby}
        onClose={() => setShowConfirmLobby(false)}
        onConfirm={() => onRestartGame?.()}
      />
    </>
  );
}, desktopTopHeaderPropsAreEqual);

DesktopTopHeader.displayName = 'DesktopTopHeader';

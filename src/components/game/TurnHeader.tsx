import React, { useMemo, useState, useEffect } from 'react';
import { perfTracker } from '../../core/perfTracker';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { useFullscreen } from '../../hooks/useFullscreen';
import { TurnHeaderProps, computeTeamStats, turnHeaderPropsAreEqual } from './turnHeader/turnHeaderUtils';
import { MobileTurnHeader } from './turnHeader/MobileTurnHeader';
import { DesktopTurnHeader } from './turnHeader/DesktopTurnHeader';
import { ConfirmReturnModal } from './modals/ConfirmReturnModal';

export type { TurnHeaderProps };

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
  const [fpsHudActive, setFpsHudActive] = useState<boolean>(() => perfTracker.getFpsHudEnabled());
  const isTouch = useIsTouchDevice();
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  useEffect(() => {
    return perfTracker.onFpsHudToggle((enabled) => setFpsHudActive(enabled));
  }, []);

  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

  const teamStats = useMemo(() => {
    return computeTeamStats(gameState);
  }, [
    gameState.teams,
    gameState.slugs,
    gameState.config.slugsPerTeam,
    gameState.config.slugHp,
    gameState.activeTeamId,
  ]);

  return (
    <>
      {isTouch ? (
        <MobileTurnHeader
          gameState={gameState}
          activeTeam={activeTeam}
          activeSlug={activeSlug}
          teamStats={teamStats}
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
        />
      ) : (
        <DesktopTurnHeader
          gameState={gameState}
          hostPeerId={hostPeerId}
          isMyTurn={isMyTurn}
          activeTeam={activeTeam}
          activeSlug={activeSlug}
          teamStats={teamStats}
          fpsHudActive={fpsHudActive}
          setFpsHudActive={setFpsHudActive}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          toggleFullscreen={toggleFullscreen}
          isHost={isHost}
          showHitboxes={showHitboxes}
          onToggleHitboxes={onToggleHitboxes}
          onOpenWeaponPicker={onOpenWeaponPicker}
          onOpenRules={onOpenRules}
          onOpenMetrics={onOpenMetrics}
          onRestartGame={onRestartGame}
          onExit={onExit}
          onRequestConfirmLobby={() => setShowConfirmLobby(true)}
        />
      )}

      <ConfirmReturnModal
        isOpen={showConfirmLobby}
        onClose={() => setShowConfirmLobby(false)}
        onConfirm={() => onRestartGame?.()}
      />
    </>
  );
}, turnHeaderPropsAreEqual);

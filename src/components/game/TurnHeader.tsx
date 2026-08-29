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
  const [showMenuPopover, setShowMenuPopover] = useState(false);
  const isTouch = useIsTouchDevice();
  const { isFullscreen, toggleFullscreen, isFullscreenSupported } = useFullscreen();

  const [fps, setFps] = useState(() => Math.round(perfTracker.getFps()));
  useEffect(() => {
    const id = setInterval(() => {
      setFps(Math.round(perfTracker.getFps()));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const teamStats = useMemo(() => computeTeamStats(gameState), [gameState]);

  return (
    <>
      {isTouch ? (
        <MobileTurnHeader
          gameState={gameState}
          teamStats={teamStats}
          isMyTurn={isMyTurn}
          isHost={isHost}
          hostPeerId={hostPeerId}
          fps={fps}
          showHitboxes={showHitboxes}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          showMenuPopover={showMenuPopover}
          onToggleMenu={() => setShowMenuPopover((v) => !v)}
          onCloseMenu={() => setShowMenuPopover(false)}
          onToggleHitboxes={onToggleHitboxes}
          onToggleFullscreen={toggleFullscreen}
          onOpenWeaponPicker={onOpenWeaponPicker}
          onOpenRules={onOpenRules}
          onOpenMetrics={onOpenMetrics}
          onRestartGame={onRestartGame}
          onExit={onExit}
          onRequestConfirmLobby={() => setShowConfirmLobby(true)}
        />
      ) : (
        <DesktopTurnHeader
          gameState={gameState}
          teamStats={teamStats}
          isMyTurn={isMyTurn}
          isHost={isHost}
          hostPeerId={hostPeerId}
          fps={fps}
          showHitboxes={showHitboxes}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          showMenuPopover={showMenuPopover}
          onToggleMenu={() => setShowMenuPopover((v) => !v)}
          onCloseMenu={() => setShowMenuPopover(false)}
          onToggleHitboxes={onToggleHitboxes}
          onToggleFullscreen={toggleFullscreen}
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

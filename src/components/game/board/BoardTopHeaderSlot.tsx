import React, { Profiler } from 'react';
import { GameState, Team, Slug } from '../../../core/types';
import { DesktopTopHeader } from '../desktop/DesktopTopHeader';
import { MobileTurnHeader } from '../mobile/MobileTurnHeader';
import { TeamStatItem } from '../mobile/header/TeamStatsLeaderboard';
import { perfTracker } from '../../../core/perfTracker';

interface BoardTopHeaderSlotProps {
  isTouch: boolean;
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  isHost: boolean;
  activeTeam?: Team;
  activeSlug?: Slug;
  mobileTeamStats: TeamStatItem[];
  fpsHudActive: boolean;
  setFpsHudActive: (active: boolean) => void;
  isFullscreen: boolean;
  isFullscreenSupported: boolean;
  toggleFullscreen: () => void;
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  onOpenRules: () => void;
  onOpenMetrics: () => void;
  onRestartGame: () => void;
  onExit?: () => void;
  onRequestConfirmLobby: () => void;
}

export const BoardTopHeaderSlot: React.FC<BoardTopHeaderSlotProps> = ({
  isTouch,
  gameState,
  hostPeerId,
  isMyTurn,
  isHost,
  activeTeam,
  activeSlug,
  mobileTeamStats,
  fpsHudActive,
  setFpsHudActive,
  isFullscreen,
  isFullscreenSupported,
  toggleFullscreen,
  showHitboxes,
  onToggleHitboxes,
  onOpenRules,
  onOpenMetrics,
  onRestartGame,
  onExit,
  onRequestConfirmLobby,
}) => {
  return (
    <div
      className={
        isTouch
          ? 'absolute top-0 inset-x-0 z-30 pointer-events-none p-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]'
          : 'absolute top-0 inset-x-0 z-30 pointer-events-none'
      }
    >
      {isTouch ? (
        <Profiler id="MobileTurnHeader" onRender={perfTracker.onReactRender}>
          <MobileTurnHeader
            gameState={gameState}
            activeTeam={activeTeam}
            activeSlug={activeSlug}
            teamStats={mobileTeamStats}
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
          />
        </Profiler>
      ) : (
        <Profiler id="DesktopTopHeader" onRender={perfTracker.onReactRender}>
          <DesktopTopHeader
            gameState={gameState}
            hostPeerId={hostPeerId}
            isMyTurn={isMyTurn}
            isHost={isHost}
            showHitboxes={showHitboxes}
            onToggleHitboxes={onToggleHitboxes}
            onOpenRules={onOpenRules}
            onOpenMetrics={onOpenMetrics}
            onRestartGame={onRestartGame}
            onExit={onExit}
          />
        </Profiler>
      )}
    </div>
  );
};

import React, { Profiler } from 'react';
import { GameState, Team, Slug } from '../../../core/types';
import { GameOverStatsModal, WeaponPicker, RulesModal, MetricsModal } from '../modals';
import { perfTracker } from '../../../core/perfTracker';
import { sfx } from '../../../core/audio';

interface BoardModalsContainerProps {
  gameState: GameState;
  myTeam?: Team;
  activeSlug?: Slug;
  isHost: boolean;
  hostPeerId: string;
  showWeaponPicker: boolean;
  showRules: boolean;
  showMetrics: boolean;
  onRestartGame: () => void;
  onSelectWeapon: (weaponId: string) => void;
  onCloseWeaponPicker: () => void;
  onCloseRules: () => void;
  onCloseMetrics: () => void;
}

export const BoardModalsContainer: React.FC<BoardModalsContainerProps> = ({
  gameState,
  myTeam,
  activeSlug,
  isHost,
  hostPeerId,
  showWeaponPicker,
  showRules,
  showMetrics,
  onRestartGame,
  onSelectWeapon,
  onCloseWeaponPicker,
  onCloseRules,
  onCloseMetrics,
}) => {
  return (
    <>
      {gameState.phase === 'GAME_OVER' && (
        <Profiler id="GameOverStatsModal" onRender={perfTracker.onReactRender}>
          <GameOverStatsModal
            gameState={gameState}
            isHost={isHost}
            onRestartGame={onRestartGame}
          />
        </Profiler>
      )}

      {showWeaponPicker && myTeam && (
        <Profiler id="WeaponPicker" onRender={perfTracker.onReactRender}>
          <WeaponPicker
            inventory={myTeam.inventory}
            selectedWeaponId={activeSlug?.selectedWeaponId || 'bazooka'}
            turnCount={gameState.turnCount}
            teamsCount={gameState.teams.length}
            turnDelaysEnabled={gameState.config?.turnDelaysEnabled !== false}
            onSelectWeapon={(wId) => {
              sfx.play('tick');
              onSelectWeapon(wId);
            }}
            onClose={onCloseWeaponPicker}
          />
        </Profiler>
      )}

      {showRules && (
        <Profiler id="RulesModal" onRender={perfTracker.onReactRender}>
          <RulesModal onClose={onCloseRules} />
        </Profiler>
      )}

      {showMetrics && (
        <Profiler id="MetricsModal" onRender={perfTracker.onReactRender}>
          <MetricsModal
            isOpen={showMetrics}
            onClose={onCloseMetrics}
            gameState={gameState}
            hostPeerId={hostPeerId}
          />
        </Profiler>
      )}
    </>
  );
};

import React, { useState, useEffect, useCallback, Profiler } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { TurnHeader } from './TurnHeader';
import { SlugWarsCanvas } from './SlugWarsCanvas';
import { WeaponPicker } from './WeaponPicker';
import { RulesModal } from './RulesModal';
import { MetricsModal } from './MetricsModal';
import { GameOverStatsModal } from './GameOverStatsModal';
import { BoardFuseTimerWidget } from './board/BoardFuseTimerWidget';
import { BoardBottomDock } from './board/BoardBottomDock';
import { BoardChatDrawer } from './board/BoardChatDrawer';
import { useBoardKeyboardControls } from './board/useBoardKeyboardControls';
import { MobileTouchOverlay } from './mobile/MobileTouchOverlay';
import { OrientationLockPrompt } from './mobile/OrientationLockPrompt';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import type { ChatMessage, PeerManagerLike } from 'p2play-core';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';
import { getWeapon } from '../../core/weapons/registry';

interface SlugWarsBoardProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  peerManager: PeerManagerLike;
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
  myPeerId: string;
  hostPeerId: string;
  isHost: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onSelectWeapon: (weaponId: string) => void;
  onSetFuseTimer?: (seconds: number) => void;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onDetonate?: () => void;
  onEnterVehicle?: () => void;
  onExitVehicle?: () => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onRestartGame: () => void;
  onExit?: () => void;
}

export const SlugWarsBoard: React.FC<SlugWarsBoardProps> = ({
  gameState,
  terrain,
  chatMessages,
  sendChat,
  myPeerId,
  hostPeerId,
  isHost,
  onFire,
  onPlaceSlug,
  onUpdateAim,
  onSelectWeapon,
  onSetFuseTimer,
  onStartMove,
  onStopMove,
  onJump,
  onStartSteer,
  onStopSteer,
  onStartCharge,
  onReleaseCharge,
  onDetonate,
  onEnterVehicle,
  onExitVehicle,
  onSteerVehicle,
  onRestartGame,
  onExit,
}) => {
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [pendingPlacement, setPendingPlacement] = useState<Vector2D | null>(null);
  const isTouch = useIsTouchDevice();

  useEffect(() => {
    if (gameState.phase !== 'PLACEMENT') {
      setPendingPlacement(null);
    }
  }, [gameState.phase, gameState.activeSlugId]);

  useEffect(() => {
    if (gameState.phase !== 'AIMING') {
      setShowWeaponPicker(false);
    }
  }, [gameState.phase]);

  const handleOpenWeaponPicker = useCallback(() => {
    if (gameState.phase !== 'AIMING') return;
    setShowWeaponPicker(true);
  }, [gameState.phase]);
  const handleCloseWeaponPicker = useCallback(() => setShowWeaponPicker(false), []);
  const handleOpenRules = useCallback(() => setShowRules(true), []);
  const handleCloseRules = useCallback(() => setShowRules(false), []);
  const handleOpenMetrics = useCallback(() => setShowMetrics(true), []);
  const handleCloseMetrics = useCallback(() => setShowMetrics(false), []);
  const handleToggleHitboxes = useCallback(() => setShowHitboxes((prev) => !prev), []);

  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const myTeam = gameState.teams.find((t) => (t.isHost ? isHost : myPeerId === t.id)) || activeTeam;
  const isMyTurn = !!(activeTeam && (activeTeam.isHost ? isHost : myPeerId === activeTeam.id));
  const activeSheep = gameState.projectiles.find((p) => p.weaponId === 'super_sheep');
  const activeWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;

  useBoardKeyboardControls({
    isMyTurn,
    gameState,
    activeSlug,
    activeSheep,
    onSteerVehicle,
    onExitVehicle,
    onEnterVehicle,
    onStartSteer,
    onStopSteer,
    onDetonate,
    onSetFuseTimer,
    onUpdateAim,
    onStartMove,
    onStopMove,
    onJump,
    onFire,
    onStartCharge,
    onReleaseCharge,
    setShowWeaponPicker,
  });

  return (
    <div
      className={
        isTouch
          ? 'fixed inset-0 h-[100dvh] w-screen overflow-hidden overscroll-none touch-none bg-zinc-950 text-zinc-100 select-none'
          : 'flex flex-col h-screen max-h-screen overflow-hidden overscroll-none bg-zinc-950 p-1 md:p-1.5 text-zinc-100 relative'
      }
    >
      {/* Top Header - Floating transparent on mobile, standard flex row on PC */}
      <Profiler id="TurnHeader" onRender={perfTracker.onReactRender}>
        <div
          className={
            isTouch
              ? 'absolute top-0 inset-x-0 z-30 pointer-events-none p-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]'
              : 'relative z-30 shrink-0'
          }
        >
          <TurnHeader
            gameState={gameState}
            hostPeerId={hostPeerId}
            isMyTurn={isMyTurn}
            isHost={isHost}
            showHitboxes={showHitboxes}
            onToggleHitboxes={handleToggleHitboxes}
            onOpenWeaponPicker={handleOpenWeaponPicker}
            onSetFuseTimer={onSetFuseTimer}
            onOpenRules={handleOpenRules}
            onOpenMetrics={handleOpenMetrics}
            onRestartGame={onRestartGame}
            onExit={onExit}
          />
        </div>
      </Profiler>

      {/* Main Canvas Area - Fullscreen behind header on mobile, middle flex container on PC */}
      <div
        className={
          isTouch
            ? 'absolute inset-0 z-10 flex items-center justify-center overflow-hidden'
            : 'relative flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden my-0.5'
        }
      >
        {!isTouch && gameState.phase === 'PLACEMENT' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1 bg-amber-950/90 border border-amber-500/80 rounded-full text-xs font-black text-amber-300 shadow-xl backdrop-blur-md animate-pulse">
            📍 Cliquez sur le terrain pour placer votre limace ({activeSlug?.name})
          </div>
        )}

        {!isTouch && (
          <BoardFuseTimerWidget
            activeSlug={activeSlug}
            activeWeapon={activeWeapon}
            phase={gameState.phase}
            isMyTurn={isMyTurn}
            onSetFuseTimer={onSetFuseTimer}
          />
        )}

        <Profiler id="SlugWarsCanvas" onRender={perfTracker.onReactRender}>
          <SlugWarsCanvas
            gameState={gameState}
            terrain={terrain}
            isMyTurn={isMyTurn}
            showHitboxes={showHitboxes}
            onFire={onFire}
            onPlaceSlug={onPlaceSlug}
            onSelectPlacementPoint={isTouch ? setPendingPlacement : undefined}
            pendingPlacementPoint={pendingPlacement}
            onStartCharge={onStartCharge}
            onReleaseCharge={onReleaseCharge}
            onUpdateAim={onUpdateAim}
          />
        </Profiler>
      </div>

      {!isTouch && (
        <BoardBottomDock
          activeSlug={activeSlug}
          activeSheep={activeSheep}
          isMyTurn={isMyTurn}
          showDrawer={showDrawer}
          onToggleDrawer={() => setShowDrawer(!showDrawer)}
          onOpenWeaponPicker={handleOpenWeaponPicker}
          onExitVehicle={onExitVehicle}
          chatMessageCount={chatMessages.length}
        />
      )}

      <BoardChatDrawer
        showDrawer={showDrawer}
        onClose={() => setShowDrawer(false)}
        gameState={gameState}
        chatMessages={chatMessages}
        sendChat={sendChat}
      />

      <MobileTouchOverlay
        isMyTurn={isMyTurn}
        gameState={gameState}
        activeSlug={activeSlug}
        activeSheep={activeSheep}
        showDrawer={showDrawer}
        onToggleDrawer={() => setShowDrawer(!showDrawer)}
        chatMessageCount={chatMessages.length}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        onJump={onJump}
        onUpdateAim={onUpdateAim}
        onFire={onFire}
        onStartCharge={onStartCharge}
        onReleaseCharge={onReleaseCharge}
        onSetFuseTimer={onSetFuseTimer}
        onSteerVehicle={onSteerVehicle}
        onExitVehicle={onExitVehicle}
        onEnterVehicle={onEnterVehicle}
        onStartSteer={onStartSteer}
        onStopSteer={onStopSteer}
        onDetonate={onDetonate}
        setShowWeaponPicker={setShowWeaponPicker}
        pendingPlacement={pendingPlacement}
        onConfirmPlacement={() => {
          if (pendingPlacement) {
            onPlaceSlug?.(pendingPlacement);
            setPendingPlacement(null);
          }
        }}
      />

      <OrientationLockPrompt />

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
            onSelectWeapon={(wId) => {
              sfx.play('tick');
              onSelectWeapon(wId);
            }}
            onClose={handleCloseWeaponPicker}
          />
        </Profiler>
      )}

      {showRules && (
        <Profiler id="RulesModal" onRender={perfTracker.onReactRender}>
          <RulesModal onClose={handleCloseRules} />
        </Profiler>
      )}

      {showMetrics && (
        <Profiler id="MetricsModal" onRender={perfTracker.onReactRender}>
          <MetricsModal
            isOpen={showMetrics}
            onClose={handleCloseMetrics}
            gameState={gameState}
            hostPeerId={hostPeerId}
          />
        </Profiler>
      )}
    </div>
  );
};

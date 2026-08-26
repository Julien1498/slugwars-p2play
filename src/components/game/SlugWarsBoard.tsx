import React, { useState, useEffect, useCallback, Profiler } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { TurnHeader } from './TurnHeader';
import { DesktopTopHeader } from './desktop/DesktopTopHeader';
import { DesktopBottomDock } from './desktop/DesktopBottomDock';
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
  const isMyTurn = gameState.teams.length <= 1
    ? true
    : !!(activeTeam && (activeTeam.isHost ? isHost : myPeerId === activeTeam.id));
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
    <div className="fixed inset-0 h-[100dvh] w-screen overflow-hidden overscroll-none touch-none bg-zinc-950 text-zinc-100 select-none relative">
      {/* Top Header - Floating transparent on mobile, new edge-to-edge floating cluster on PC */}
      <div
        className={
          isTouch
            ? 'absolute top-0 inset-x-0 z-30 pointer-events-none p-1.5 pt-[max(0.35rem,env(safe-area-inset-top))] pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))]'
            : 'absolute top-0 inset-x-0 z-30 pointer-events-none'
        }
      >
        {isTouch ? (
          <Profiler id="TurnHeader" onRender={perfTracker.onReactRender}>
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
          </Profiler>
        ) : (
          <Profiler id="DesktopTopHeader" onRender={perfTracker.onReactRender}>
            <DesktopTopHeader
              gameState={gameState}
              hostPeerId={hostPeerId}
              isMyTurn={isMyTurn}
              isHost={isHost}
              showHitboxes={showHitboxes}
              onToggleHitboxes={handleToggleHitboxes}
              onOpenRules={handleOpenRules}
              onOpenMetrics={handleOpenMetrics}
              onRestartGame={onRestartGame}
              onExit={onExit}
            />
          </Profiler>
        )}
      </div>

      {/* Main Canvas Area - Fullscreen behind floating HUD on both mobile and PC */}
      <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden w-full h-full">
        {!isTouch && gameState.phase === 'PLACEMENT' && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-5 py-2 bg-amber-950/90 border border-amber-500/80 rounded-full text-xs font-black text-amber-300 shadow-2xl backdrop-blur-xl animate-pulse">
            📍 Cliquez sur le terrain pour déployer votre limace ({activeSlug?.name})
          </div>
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

      {/* Bottom Controls Area - Edge-to-edge floating dock on PC */}
      {!isTouch && (
        <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
          <DesktopBottomDock
            gameState={gameState}
            activeSlug={activeSlug}
            activeSheep={activeSheep}
            isMyTurn={isMyTurn}
            showDrawer={showDrawer}
            onToggleDrawer={() => setShowDrawer(!showDrawer)}
            onOpenWeaponPicker={handleOpenWeaponPicker}
            onSetFuseTimer={onSetFuseTimer}
            onUpdateAim={onUpdateAim}
            onExitVehicle={onExitVehicle}
            chatMessages={chatMessages}
            sendChat={sendChat}
          />
        </div>
      )}

      {isTouch && (
        <BoardChatDrawer
          showDrawer={showDrawer}
          onClose={() => setShowDrawer(false)}
          gameState={gameState}
          chatMessages={chatMessages}
          sendChat={sendChat}
        />
      )}

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

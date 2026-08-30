import React, { useState, useEffect, useMemo, Profiler } from 'react';
import { Vector2D } from '../../../core/types';
import { DesktopBottomDock } from '../desktop/DesktopBottomDock';
import { MobileTouchOverlay } from '../mobile/MobileTouchOverlay';
import { OrientationLockPrompt } from '../mobile/OrientationLockPrompt';
import { SlugWarsCanvas } from '../canvas/SlugWarsCanvas';
import { BoardTopHeaderSlot } from './BoardTopHeaderSlot';
import { BoardModalsContainer } from './BoardModalsContainer';
import { BoardChatDrawer } from './BoardChatDrawer';
import { useBoardKeyboardControls } from './useBoardKeyboardControls';
import { useBoardModals } from './useBoardModals';
import { ConfirmReturnModal } from '../modals/ConfirmReturnModal';
import { computeTeamStats } from '../mobile/header/turnHeaderUtils';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { useFullscreen } from '../../../hooks/useFullscreen';
import { perfTracker } from '../../../core/perfTracker';
import { SlugWarsBoardProps } from './boardTypes';

export type { SlugWarsBoardProps };

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
  const [fpsHudActive, setFpsHudActive] = useState<boolean>(() => perfTracker.getFpsHudEnabled());
  const [pendingPlacement, setPendingPlacement] = useState<Vector2D | null>(null);
  const isTouch = useIsTouchDevice();
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  const {
    showHitboxes,
    showDrawer,
    showWeaponPicker,
    showRules,
    showMetrics,
    showConfirmLobby,
    setShowConfirmLobby,
    setShowWeaponPicker,
    handleOpenWeaponPicker,
    handleCloseWeaponPicker,
    handleOpenRules,
    handleCloseRules,
    handleOpenMetrics,
    handleCloseMetrics,
    handleToggleHitboxes,
    handleToggleDrawer,
    handleCloseDrawer,
  } = useBoardModals(gameState.phase);

  useEffect(() => {
    return perfTracker.onFpsHudToggle((enabled) => setFpsHudActive(enabled));
  }, []);

  useEffect(() => {
    if (gameState.phase !== 'PLACEMENT') {
      setPendingPlacement(null);
    }
  }, [gameState.phase, gameState.activeSlugId]);

  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const myTeam = gameState.teams.find((t) => (t.isHost ? isHost : myPeerId === t.id)) || activeTeam;
  const isMyTurn = gameState.teams.length <= 1
    ? true
    : !!(activeTeam && (activeTeam.isHost ? isHost : myPeerId === activeTeam.id));
  const activeSheep = gameState.projectiles.find((p) => p.weaponId === 'super_sheep' || p.weaponId === 'sheep');

  const mobileTeamStats = useMemo(() => {
    return computeTeamStats(gameState);
  }, [
    gameState.teams,
    gameState.slugs,
    gameState.config.slugsPerTeam,
    gameState.config.slugHp,
    gameState.activeTeamId,
  ]);

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
      {/* Top Header Slot */}
      <BoardTopHeaderSlot
        isTouch={isTouch}
        gameState={gameState}
        hostPeerId={hostPeerId}
        isMyTurn={isMyTurn}
        isHost={isHost}
        activeTeam={activeTeam}
        activeSlug={activeSlug}
        mobileTeamStats={mobileTeamStats}
        fpsHudActive={fpsHudActive}
        setFpsHudActive={setFpsHudActive}
        isFullscreen={isFullscreen}
        isFullscreenSupported={isFullscreenSupported}
        toggleFullscreen={toggleFullscreen}
        showHitboxes={showHitboxes}
        onToggleHitboxes={handleToggleHitboxes}
        onOpenRules={handleOpenRules}
        onOpenMetrics={handleOpenMetrics}
        onRestartGame={onRestartGame}
        onExit={onExit}
        onRequestConfirmLobby={() => setShowConfirmLobby(true)}
      />

      {/* Main Canvas Area */}
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
            onDetonate={onDetonate}
          />
        </Profiler>
      </div>

      {/* Bottom Controls Area - Desktop Dock */}
      {!isTouch && (
        <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
          <DesktopBottomDock
            gameState={gameState}
            activeSlug={activeSlug}
            activeSheep={activeSheep}
            isMyTurn={isMyTurn}
            showDrawer={showDrawer}
            onToggleDrawer={handleToggleDrawer}
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
          onClose={handleCloseDrawer}
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
        onToggleDrawer={handleToggleDrawer}
        chatMessageCount={chatMessages.length}
        onStartMove={onStartMove}
        onStopMove={onStopMove}
        onJump={onJump}
        onUpdateAim={onUpdateAim}
        onFire={onFire}
        onStartCharge={onStartCharge}
        onReleaseCharge={onReleaseCharge}
        onStartSteer={onStartSteer}
        onStopSteer={onStopSteer}
        onDetonate={onDetonate}
        onEnterVehicle={onEnterVehicle}
        onExitVehicle={onExitVehicle}
        onSteerVehicle={onSteerVehicle}
        setShowWeaponPicker={setShowWeaponPicker}
        onSetFuseTimer={onSetFuseTimer}
        pendingPlacement={pendingPlacement}
        onConfirmPlacement={() => {
          if (pendingPlacement && onPlaceSlug) {
            onPlaceSlug(pendingPlacement);
            setPendingPlacement(null);
          }
        }}
      />

      <OrientationLockPrompt />

      {/* Modals & Dialogs Container */}
      <BoardModalsContainer
        gameState={gameState}
        myTeam={myTeam}
        activeSlug={activeSlug}
        isHost={isHost}
        hostPeerId={hostPeerId}
        showWeaponPicker={showWeaponPicker}
        showRules={showRules}
        showMetrics={showMetrics}
        onRestartGame={onRestartGame}
        onSelectWeapon={onSelectWeapon}
        onCloseWeaponPicker={handleCloseWeaponPicker}
        onCloseRules={handleCloseRules}
        onCloseMetrics={handleCloseMetrics}
      />

      {showConfirmLobby && (
        <ConfirmReturnModal
          isOpen={showConfirmLobby}
          onClose={() => setShowConfirmLobby(false)}
          onConfirm={() => {
            setShowConfirmLobby(false);
            if (isHost && onRestartGame) {
              onRestartGame();
            } else if (onExit) {
              onExit();
            }
          }}
        />
      )}
    </div>
  );
};

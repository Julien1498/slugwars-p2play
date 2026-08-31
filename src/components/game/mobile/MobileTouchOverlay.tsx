import React, { useRef, useEffect } from 'react';
import { GameState, Slug, ActiveProjectile, Vector2D } from '../../../core/types';
import { getWeapon } from '../../../core/weapons/registry';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { MessageSquare } from 'lucide-react';
import { triggerHaptic, findNearbyHelicopter } from './touchControlsUtils';
import { PlacementTouchBar } from './PlacementTouchBar';
import { LeftThumbCluster } from './LeftThumbCluster';
import { RightThumbCluster } from './RightThumbCluster';

interface MobileTouchOverlayProps {
  isMyTurn: boolean;
  gameState: GameState;
  activeSlug: Slug | undefined;
  activeSheep: ActiveProjectile | undefined;
  showDrawer?: boolean;
  onToggleDrawer?: () => void;
  chatMessageCount?: number;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onStopJump?: () => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onFire?: (targetPoint?: Vector2D) => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onSetFuseTimer?: (seconds: number) => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onExitVehicle?: () => void;
  onEnterVehicle?: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onDetonate?: () => void;
  setShowWeaponPicker: React.Dispatch<React.SetStateAction<boolean>>;
  pendingPlacement?: Vector2D | null;
  onConfirmPlacement?: () => void;
}

export const MobileTouchOverlay: React.FC<MobileTouchOverlayProps> = ({
  isMyTurn,
  gameState,
  activeSlug,
  activeSheep,
  showDrawer,
  onToggleDrawer,
  chatMessageCount = 0,
  onStartMove,
  onStopMove,
  onJump,
  onStopJump,
  onUpdateAim,
  onFire,
  onStartCharge,
  onReleaseCharge,
  onSetFuseTimer,
  onSteerVehicle,
  onExitVehicle,
  onEnterVehicle,
  onStartSteer,
  onStopSteer,
  onDetonate,
  setShowWeaponPicker,
  pendingPlacement,
  onConfirmPlacement,
}) => {
  const isTouch = useIsTouchDevice();
  const isHoldingFireRef = useRef<boolean>(false);
  const lastDirectFireTimeRef = useRef<number>(0);

  // Window-level safety fallback: guarantees shot release even if finger drifts off-screen
  useEffect(() => {
    const handleGlobalRelease = () => {
      if (isHoldingFireRef.current) {
        isHoldingFireRef.current = false;
        triggerHaptic(25);
        onReleaseCharge?.(activeSlug?.currentTargetPoint);
      }
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
    };
  }, [onReleaseCharge, activeSlug?.currentTargetPoint]);

  if (!isTouch) return null;

  const isPlacementPhase = gameState.phase === 'PLACEMENT';
  const isAimingPhase = gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME';
  const currentWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
  const inVehicle = !!activeSlug?.inVehicleId;

  const nearbyHeli =
    activeSlug && !inVehicle && isAimingPhase
      ? findNearbyHelicopter(activeSlug, gameState.helicopters, 65)
      : null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none p-2 sm:p-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-end justify-between select-none">
      {isPlacementPhase ? (
        <PlacementTouchBar
          pendingPlacement={pendingPlacement}
          onConfirmPlacement={onConfirmPlacement}
        />
      ) : (
        <>
          {/* 1. Left Thumb Cluster */}
          <LeftThumbCluster
            isMyTurn={isMyTurn}
            activeSlug={activeSlug}
            activeSheep={activeSheep}
            nearbyHeli={nearbyHeli}
            onStartMove={onStartMove}
            onStopMove={onStopMove}
            onJump={onJump}
            onStopJump={onStopJump}
            onSteerVehicle={onSteerVehicle}
            onExitVehicle={onExitVehicle}
            onEnterVehicle={onEnterVehicle}
            onStartSteer={onStartSteer}
            onStopSteer={onStopSteer}
            onDetonate={onDetonate}
          />

          {/* 2. Center Cluster: Chat Drawer Toggle */}
          <div className="pointer-events-auto flex items-end gap-1.5 pb-1">
            {onToggleDrawer && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onToggleDrawer();
                }}
                className={`p-2.5 rounded-2xl border flex items-center gap-1.5 shadow-xl backdrop-blur-md active:scale-95 transition-all ${
                  showDrawer
                    ? 'bg-violet-950/90 border-violet-500 text-white'
                    : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300'
                }`}
                title="Journal et Tchat"
              >
                <MessageSquare className="w-5 h-5 text-violet-400" />
                {chatMessageCount > 0 && !showDrawer && (
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                )}
              </button>
            )}
          </div>

          {/* 3. Right Thumb Cluster */}
          <RightThumbCluster
            isMyTurn={isMyTurn}
            gameState={gameState}
            activeSlug={activeSlug}
            currentWeapon={currentWeapon}
            onUpdateAim={onUpdateAim}
            onFire={onFire}
            onStartCharge={onStartCharge}
            onReleaseCharge={onReleaseCharge}
            onSetFuseTimer={onSetFuseTimer}
            setShowWeaponPicker={setShowWeaponPicker}
            isHoldingFireRef={isHoldingFireRef}
            lastDirectFireTimeRef={lastDirectFireTimeRef}
          />
        </>
      )}
    </div>
  );
};

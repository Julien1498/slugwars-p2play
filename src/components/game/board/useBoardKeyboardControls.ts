import { useEffect, useRef } from 'react';
import { GameState, Slug, ActiveProjectile, Vector2D } from '../../../core/types';
import { getWeapon, isWeaponChargeable } from '../../../core/weapons/registry';
import { sfx } from '../../../core/audio';
import {
  resolveInputContext,
  resolveKeyToAction,
  getFuseSecondsFromAction,
  InputAction,
} from '../../../core/input';

interface KeyboardControlsProps {
  isMyTurn: boolean;
  gameState: GameState;
  activeSlug: Slug | undefined;
  activeSheep: ActiveProjectile | undefined;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onExitVehicle?: () => void;
  onEnterVehicle?: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onDetonate?: () => void;
  onSetFuseTimer?: (seconds: number) => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onStopJump?: () => void;
  onFire?: (targetPoint?: Vector2D) => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  setShowWeaponPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useBoardKeyboardControls({
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
  onStopJump,
  onFire,
  onStartCharge,
  onReleaseCharge,
  setShowWeaponPicker,
}: KeyboardControlsProps) {
  const activeMovingKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMyTurn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;
      if (e.repeat) return;

      const context = resolveInputContext(gameState, activeSlug, activeSheep);
      const action = resolveKeyToAction(e.key, context);
      if (!action) return;

      e.preventDefault();

      // 1. Vehicle Pilot Context
      if (context === 'VEHICLE_PILOT') {
        if (action === 'VEHICLE_LEFT') onSteerVehicle?.('left');
        else if (action === 'VEHICLE_RIGHT') onSteerVehicle?.('right');
        else if (action === 'VEHICLE_UP') onSteerVehicle?.('up');
        else if (action === 'VEHICLE_DOWN') onSteerVehicle?.('down');
        else if (action === 'EXIT_VEHICLE') onExitVehicle?.();
        return;
      }

      // 2. Steerable Projectile (Super Sheep) Context
      if (context === 'STEERABLE_PROJECTILE') {
        if (action === 'STEER_LEFT') {
          activeMovingKeyRef.current = e.key.toLowerCase();
          onStartSteer?.('left');
        } else if (action === 'STEER_RIGHT') {
          activeMovingKeyRef.current = e.key.toLowerCase();
          onStartSteer?.('right');
        } else if (action === 'DETONATE') {
          onDetonate?.();
        }
        return;
      }

      // 3. Rope Swing Context
      if (context === 'ROPE_SWING') {
        if (action === 'MOVE_LEFT') onStartMove('left');
        else if (action === 'MOVE_RIGHT') onStartMove('right');
        else if (action === 'WINCH_UP') onStartSteer?.('left');
        else if (action === 'WINCH_DOWN') onStartSteer?.('right');
        else if (action === 'JUMP') onJump();
        return;
      }

      // 4. Standard Slug Ground Context
      if (action === 'TOGGLE_WEAPON_PICKER' && gameState.phase === 'AIMING') {
        setShowWeaponPicker((prev) => !prev);
        return;
      }

      if (action === 'ENTER_VEHICLE' && activeSlug && !activeSlug.inVehicleId && gameState.phase === 'AIMING') {
        const nearbyHeli = gameState.helicopters?.find(
          (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
        );
        if (nearbyHeli) onEnterVehicle?.();
        return;
      }

      const fuseSec = getFuseSecondsFromAction(action);
      if (fuseSec !== null && gameState.phase !== 'RETREAT') {
        const currentWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
        if (currentWeapon?.allowCustomFuse) {
          onSetFuseTimer?.(fuseSec);
          sfx.play('tick');
        }
        return;
      }

      if (action === 'ROTATE_GIRDER' && activeSlug?.selectedWeaponId === 'girder') {
        const nextAngle = (activeSlug.aimAngle + 45) % 360;
        onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
        sfx.play('tick');
        return;
      }

      if (action === 'MOVE_LEFT') {
        activeMovingKeyRef.current = e.key.toLowerCase();
        onStartMove('left');
      } else if (action === 'MOVE_RIGHT') {
        activeMovingKeyRef.current = e.key.toLowerCase();
        onStartMove('right');
      } else if (action === 'JUMP') {
        onJump();
      } else if (action === 'AIM_UP' && activeSlug && gameState.phase !== 'RETREAT') {
        if (activeSlug.jetpackState) {
          onJump();
        } else if (activeSlug.selectedWeaponId === 'girder') {
          const nextAngle = (activeSlug.aimAngle + 5) % 360;
          onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
          sfx.play('tick');
        } else {
          onUpdateAim(Math.min(85, activeSlug.aimAngle + 5), activeSlug.aimPower, activeSlug.facing);
        }
      } else if (action === 'AIM_DOWN' && activeSlug && gameState.phase !== 'RETREAT') {
        if (activeSlug.selectedWeaponId === 'girder') {
          let nextAngle = (activeSlug.aimAngle - 5) % 360;
          if (nextAngle < 0) nextAngle += 360;
          onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
          sfx.play('tick');
        } else {
          onUpdateAim(Math.max(-85, activeSlug.aimAngle - 5), activeSlug.aimPower, activeSlug.facing);
        }
      } else if (action === 'FIRE_OR_CHARGE' && gameState.phase !== 'RETREAT') {
        if (activeSlug?.selectedWeaponId === 'blowtorch') {
          if (!activeSlug.isBlowtorching) onFire?.();
        } else {
          const weapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
          if (weapon && !isWeaponChargeable(weapon)) {
            onFire?.();
          } else {
            onStartCharge?.();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;

      const context = resolveInputContext(gameState, activeSlug, activeSheep);
      const action = resolveKeyToAction(e.key, context);
      if (!action) return;

      if (action === 'STEER_LEFT' || action === 'STEER_RIGHT') {
        onStopSteer?.();
        activeMovingKeyRef.current = null;
      } else if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT') {
        onStopMove();
        activeMovingKeyRef.current = null;
      } else if (action === 'WINCH_UP' || action === 'WINCH_DOWN') {
        if (activeSlug?.ropeState) onStopSteer?.();
      } else if (action === 'JUMP') {
        onStopJump?.();
      } else if (action === 'AIM_UP') {
        if (activeSlug?.jetpackState) onStopJump?.();
      } else if (action === 'FIRE_OR_CHARGE' && !activeSheep && gameState.phase === 'AIMING') {
        onReleaseCharge?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isMyTurn,
    gameState.phase,
    activeSlug,
    activeSheep,
    onStartMove,
    onStopMove,
    onJump,
    onStopJump,
    onFire,
    onStartSteer,
    onStopSteer,
    onStartCharge,
    onReleaseCharge,
    onDetonate,
    onUpdateAim,
    onSetFuseTimer,
    onSteerVehicle,
    onExitVehicle,
    onEnterVehicle,
    setShowWeaponPicker,
  ]);
}

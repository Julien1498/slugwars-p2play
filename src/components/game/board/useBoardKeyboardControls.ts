import { useEffect, useRef } from 'react';
import { GameState, Slug, ActiveProjectile, Vector2D } from '../../../core/types';
import { getWeapon, isWeaponChargeable } from '../../../core/weapons/registry';
import { sfx } from '../../../core/audio';

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

      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's', 'q', 'z', 'e', 'enter'].includes(key)) {
        e.preventDefault();
      }


      // Helicopter controls
      if (activeSlug && activeSlug.inVehicleId && (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT')) {
        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          onSteerVehicle?.('left');
        } else if (key === 'arrowright' || key === 'd') {
          onSteerVehicle?.('right');
        } else if (key === 'arrowup' || key === 'w' || key === 'z') {
          onSteerVehicle?.('up');
        } else if (key === 'arrowdown' || key === 's') {
          onSteerVehicle?.('down');
        } else if (key === 'e') {
          onExitVehicle?.();
        }
        return;
      }

      // Board helicopter
      if (key === 'e' && activeSlug && !activeSlug.inVehicleId && gameState.phase === 'AIMING') {
        const nearbyHeli = gameState.helicopters?.find(
          (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
        );
        if (nearbyHeli) {
          onEnterVehicle?.();
          return;
        }
      }

      // Super sheep steering
      if (activeSheep) {
        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          activeMovingKeyRef.current = key;
          onStartSteer?.('left');
        } else if (key === 'arrowright' || key === 'd') {
          activeMovingKeyRef.current = key;
          onStartSteer?.('right');
        } else if (key === ' ' || key === 'enter') {
          onDetonate?.();
        }
        return;
      }

      // Normal movement & actions
      if (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT') {
        if ((key === 'i' || key === 'tab') && gameState.phase !== 'RETREAT') {
          e.preventDefault();
          setShowWeaponPicker((prev) => !prev);
          return;
        }

        const fuseKeyMap: Record<string, number> = {
          '1': 1, '&': 1,
          '2': 2, 'é': 2,
          '3': 3, '"': 3,
          '4': 4, '\'': 4,
          '5': 5, '(': 5,
        };
        if (fuseKeyMap[key] !== undefined && gameState.phase !== 'RETREAT') {
          const currentWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
          if (currentWeapon?.allowCustomFuse) {
            e.preventDefault();
            onSetFuseTimer?.(fuseKeyMap[key]);
            sfx.play('tick');
            return;
          }
        }

        if (key === 'r' && activeSlug && activeSlug.selectedWeaponId === 'girder') {
          const nextAngle = (activeSlug.aimAngle + 45) % 360;
          onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
          sfx.play('tick');
          return;
        }

        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          activeMovingKeyRef.current = key;
          onStartMove('left');
        } else if (key === 'arrowright' || key === 'd') {
          activeMovingKeyRef.current = key;
          onStartMove('right');
        } else if (key === ' ' || key === 'spacebar') {
          onJump();
        } else if (key === 'w' || key === 'z') {
          if (activeSlug?.ropeState) {
            onStartSteer?.('left');
          } else {
            onJump();
          }
        } else if (key === 's') {
          if (activeSlug?.ropeState) {
            onStartSteer?.('right');
          }
        } else if (key === 'arrowup') {
          if (activeSlug) {
            if (activeSlug.ropeState) {
              onStartSteer?.('left');
            } else if (gameState.phase !== 'RETREAT') {
              if (activeSlug.selectedWeaponId === 'girder') {
                let nextAngle = (activeSlug.aimAngle + 5) % 360;
                if (nextAngle < 0) nextAngle += 360;
                onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
                sfx.play('tick');
              } else {
                const newAngle = Math.min(85, activeSlug.aimAngle + 5);
                onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing);
              }
            }
          }
        } else if (key === 'arrowdown') {
          if (activeSlug) {
            if (activeSlug.ropeState) {
              onStartSteer?.('right');
            } else if (gameState.phase !== 'RETREAT') {
              if (activeSlug.selectedWeaponId === 'girder') {
                let nextAngle = (activeSlug.aimAngle - 5) % 360;
                if (nextAngle < 0) nextAngle += 360;
                onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
                sfx.play('tick');
              } else {
                const newAngle = Math.max(-85, activeSlug.aimAngle - 5);
                onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing);
              }
            }
          }
        }
 else if (key === 'enter' && gameState.phase !== 'RETREAT') {
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
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) return;

      const key = e.key.toLowerCase();

      if (['arrowleft', 'arrowright', 'q', 'a', 'd'].includes(key)) {
        if (activeSheep) {
          onStopSteer?.();
        } else {
          onStopMove();
        }
        activeMovingKeyRef.current = null;
      } else if (['arrowup', 'arrowdown', 'w', 's', 'z'].includes(key)) {
        if (activeSlug?.ropeState) {
          onStopSteer?.();
        }
      } else if (key === 'enter' && !activeSheep && gameState.phase === 'AIMING') {
        onReleaseCharge?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMyTurn, gameState.phase, activeSlug, activeSheep, onStartMove, onStopMove, onJump, onFire, onStartSteer, onStopSteer, onStartCharge, onReleaseCharge, onDetonate, onUpdateAim, onSetFuseTimer, onSteerVehicle, onExitVehicle, onEnterVehicle, setShowWeaponPicker]);
}

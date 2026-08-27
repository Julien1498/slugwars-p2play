import { useRef, useEffect } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { getWeapon } from '../../../core/weapons/registry';
import { sfx } from '../../../core/audio';
import { screenToWorldCoords, clampPanOffset } from '../../../rendering/cameraUtils';
import { calculateAimAngleAndFacing } from '../../../rendering/interactionUtils';

export interface UseCanvasTouchGesturesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  terrain: DestructibleTerrain;
  gameStateRef: React.MutableRefObject<GameState>;
  isMyTurnRef: React.MutableRefObject<boolean>;
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<Vector2D>;
  cameraModeRef: React.MutableRefObject<'FOLLOW_SLUG' | 'FOLLOW_PROJECTILE' | 'FREE_LOOK'>;
  targetCameraPanRef: React.MutableRefObject<Vector2D | null>;
  mousePosRef: React.MutableRefObject<Vector2D>;
  lockedTargetRef: React.MutableRefObject<Vector2D | null>;
  lastTouchTimeRef: React.MutableRefObject<number>;
  onPlaceSlugRef: React.MutableRefObject<((pos: Vector2D) => void) | undefined>;
  onSelectPlacementPointRef: React.MutableRefObject<((pos: Vector2D) => void) | undefined>;
  onUpdateAimRef: React.MutableRefObject<((angle: number, power: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void) | undefined>;
}

export function useCanvasTouchGestures({
  containerRef,
  terrain,
  gameStateRef,
  isMyTurnRef,
  zoomRef,
  panRef,
  cameraModeRef,
  targetCameraPanRef,
  mousePosRef,
  lockedTargetRef,
  lastTouchTimeRef,
  onPlaceSlugRef,
  onSelectPlacementPointRef,
  onUpdateAimRef,
}: UseCanvasTouchGesturesProps) {
  const lastPlacementTimeRef = useRef<number>(0);

  const touchGestureRef = useRef({
    gestureInitialDist: 0,
    gestureInitialMid: { x: 0, y: 0 } as Vector2D,
    gestureInitialZoom: 1.0,
    gestureInitialPan: { x: 0, y: 0 } as Vector2D,
    isPinching: false,
    singleTouchStart: { x: 0, y: 0 } as Vector2D,
    singleTouchPanStart: { x: 0, y: 0 } as Vector2D,
    singleTouchMoved: false,
    singleTouchStartTime: 0,
    touchIsAiming: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const g = touchGestureRef.current;
    const getDist = (t1: Touch, t2: Touch) => Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const getMid = (t1: Touch, t2: Touch) => ({ x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 });

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      lastTouchTimeRef.current = Date.now();
      targetCameraPanRef.current = null;

      if (e.touches.length >= 2) {
        g.isPinching = true;
        g.touchIsAiming = false;
        g.gestureInitialDist = Math.max(10, getDist(e.touches[0], e.touches[1]));
        g.gestureInitialMid = getMid(e.touches[0], e.touches[1]);
        g.gestureInitialZoom = zoomRef.current;
        g.gestureInitialPan = { ...panRef.current };
        return;
      }

      if (e.touches.length === 1) {
        g.isPinching = false;
        const touch = e.touches[0];
        g.singleTouchStart = { x: touch.clientX, y: touch.clientY };
        g.singleTouchPanStart = { ...panRef.current };
        g.singleTouchMoved = false;
        g.singleTouchStartTime = Date.now();

        const rect = container.getBoundingClientRect();
        const pos = screenToWorldCoords(
          touch.clientX,
          touch.clientY,
          rect,
          terrain.data.width,
          terrain.data.height,
          zoomRef.current,
          panRef.current
        );
        mousePosRef.current = pos;

        // Check if touch is near active slug to start direct aiming drag
        const curGameState = gameStateRef.current;
        const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
        if (isMyTurnRef.current && curGameState.phase === 'AIMING' && activeSlug) {
          const distToSlug = Math.hypot(pos.x - activeSlug.x, pos.y - activeSlug.y);
          const weapon = getWeapon(activeSlug.selectedWeaponId);
          const allowsTouchAim = !weapon.requiresTarget || weapon.id === 'homing_missile';
          if (distToSlug < 90 && allowsTouchAim && weapon.id !== 'girder') {
            g.touchIsAiming = true;
            const { aimAngle, facing } = calculateAimAngleAndFacing(pos, activeSlug);
            if (aimAngle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
              activeSlug.aimAngle = aimAngle;
              activeSlug.facing = facing;
              onUpdateAimRef.current?.(aimAngle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
            }
          } else {
            g.touchIsAiming = false;
          }
        } else {
          g.touchIsAiming = false;
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      lastTouchTimeRef.current = Date.now();
      const rect = container.getBoundingClientRect();

      if (e.touches.length >= 2 && g.isPinching && g.gestureInitialDist > 0) {
        const currDist = Math.max(10, getDist(e.touches[0], e.touches[1]));
        const currMid = getMid(e.touches[0], e.touches[1]);
        const scale = currDist / g.gestureInitialDist;
        const newZoom = Math.max(0.75, Math.min(3.0, g.gestureInitialZoom * scale));

        const dx = currMid.x - g.gestureInitialMid.x;
        const dy = currMid.y - g.gestureInitialMid.y;
        const clamped = clampPanOffset(
          { x: g.gestureInitialPan.x + dx, y: g.gestureInitialPan.y + dy },
          newZoom,
          rect.width,
          rect.height,
          terrain.data.width,
          terrain.data.height
        );

        zoomRef.current = newZoom;
        panRef.current = clamped;
        return;
      }

      if (e.touches.length === 1 && !g.isPinching) {
        const touch = e.touches[0];
        const dx = touch.clientX - g.singleTouchStart.x;
        const dy = touch.clientY - g.singleTouchStart.y;
        if (Math.hypot(dx, dy) > 8) {
          g.singleTouchMoved = true;
        }

        const pos = screenToWorldCoords(
          touch.clientX,
          touch.clientY,
          rect,
          terrain.data.width,
          terrain.data.height,
          zoomRef.current,
          panRef.current
        );
        mousePosRef.current = pos;

        const curGameState = gameStateRef.current;
        if (g.touchIsAiming && isMyTurnRef.current && curGameState.phase === 'AIMING') {
          const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
          if (activeSlug) {
            const { aimAngle, facing } = calculateAimAngleAndFacing(pos, activeSlug);
            if (aimAngle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
              activeSlug.aimAngle = aimAngle;
              activeSlug.facing = facing;
              onUpdateAimRef.current?.(aimAngle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
            }
          }
        } else {
          // Smooth 1-finger camera drag
          const clamped = clampPanOffset(
            { x: g.singleTouchPanStart.x + dx, y: g.singleTouchPanStart.y + dy },
            zoomRef.current,
            rect.width,
            rect.height,
            terrain.data.width,
            terrain.data.height
          );
          cameraModeRef.current = 'FREE_LOOK';
          panRef.current = clamped;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      lastTouchTimeRef.current = Date.now();

      if (e.touches.length === 0) {
        if (!g.isPinching && !g.singleTouchMoved && Date.now() - g.singleTouchStartTime < 350) {
          const rect = container.getBoundingClientRect();
          const pos = screenToWorldCoords(
            g.singleTouchStart.x,
            g.singleTouchStart.y,
            rect,
            terrain.data.width,
            terrain.data.height,
            zoomRef.current,
            panRef.current
          );

          const curGameState = gameStateRef.current;
          if (curGameState.phase === 'PLACEMENT' && isMyTurnRef.current) {
            if (Date.now() - lastPlacementTimeRef.current > 200) {
              lastPlacementTimeRef.current = Date.now();
              const clampedX = Math.max(20, Math.min(terrain.data.width - 20, pos.x));
              const clampedY = Math.max(20, Math.min(terrain.data.waterLevel - 15, pos.y));
              const targetPoint = { x: clampedX, y: clampedY };
              mousePosRef.current = targetPoint;
              if (onSelectPlacementPointRef.current) {
                onSelectPlacementPointRef.current(targetPoint);
              } else {
                onPlaceSlugRef.current?.(targetPoint);
              }
            }
          } else if (isMyTurnRef.current && curGameState.phase === 'AIMING') {
            const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
            if (activeSlug) {
              const weapon = getWeapon(activeSlug.selectedWeaponId);
              const distToSlug = Math.hypot(pos.x - activeSlug.x, pos.y - activeSlug.y);

              if (weapon.id === 'homing_missile') {
                if (distToSlug < 85) {
                  const { aimAngle, facing } = calculateAimAngleAndFacing(pos, activeSlug);
                  activeSlug.aimAngle = aimAngle;
                  activeSlug.facing = facing;
                  sfx.play('tick');
                  onUpdateAimRef.current?.(aimAngle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
                } else {
                  lockedTargetRef.current = pos;
                  activeSlug.currentTargetPoint = pos;
                  sfx.play('tick');
                  onUpdateAimRef.current?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
                }
              } else if (weapon.requiresTarget || weapon.id === 'girder') {
                lockedTargetRef.current = pos;
                activeSlug.currentTargetPoint = pos;
                sfx.play('tick');
                onUpdateAimRef.current?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
              } else {
                const { aimAngle, facing } = calculateAimAngleAndFacing(pos, activeSlug);
                activeSlug.aimAngle = aimAngle;
                activeSlug.facing = facing;
                sfx.play('tick');
                onUpdateAimRef.current?.(aimAngle, activeSlug.aimPower, facing);
              }
            }
          }
        }
        g.isPinching = false;
        g.touchIsAiming = false;
      } else if (e.touches.length === 1) {
        g.isPinching = false;
        g.touchIsAiming = false;
        const touch = e.touches[0];
        g.singleTouchStart = { x: touch.clientX, y: touch.clientY };
        g.singleTouchPanStart = { ...panRef.current };
        g.singleTouchMoved = false;
        g.singleTouchStartTime = Date.now();
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: false });
    container.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [containerRef, terrain.data.width, terrain.data.height, terrain.data.waterLevel]);

  return { touchGestureRef };
}

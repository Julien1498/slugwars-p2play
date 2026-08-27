import React, { useRef, useCallback } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { getWeapon, isWeaponChargeable } from '../../../core/weapons/registry';
import { sfx } from '../../../core/audio';
import { screenToWorldCoords, clampPanOffset } from '../../../rendering/cameraUtils';
import { calculateAimAngleAndFacing, calculateGirderAngle } from '../../../rendering/interactionUtils';

export interface UseCanvasMouseControlsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  terrain: DestructibleTerrain;
  gameStateRef: React.MutableRefObject<GameState>;
  isMyTurnRef: React.MutableRefObject<boolean>;
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<Vector2D>;
  cameraModeRef: React.MutableRefObject<'FOLLOW_SLUG' | 'FOLLOW_PROJECTILE' | 'FREE_LOOK'>;
  targetCameraPanRef: React.MutableRefObject<Vector2D | null>;
  isDraggingCameraRef: React.MutableRefObject<boolean>;
  didDragCameraRef: React.MutableRefObject<boolean>;
  dragStartMouseRef: React.MutableRefObject<Vector2D>;
  dragStartPanRef: React.MutableRefObject<Vector2D>;
  mousePosRef: React.MutableRefObject<Vector2D>;
  lockedTargetRef: React.MutableRefObject<Vector2D | null>;
  lastTouchTimeRef: React.MutableRefObject<number>;
  onFire: (params: { x: number; y: number; aimAngle: number; aimPower: number; facing: 'left' | 'right' }) => void;
  onPlaceSlug?: (pos: Vector2D) => void;
  onStartCharge?: (target: Vector2D) => void;
  onReleaseCharge?: (params: { x: number; y: number; aimAngle: number; aimPower: number; facing: 'left' | 'right' }) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
}

export function useCanvasMouseControls({
  containerRef,
  terrain,
  gameStateRef,
  isMyTurnRef,
  zoomRef,
  panRef,
  cameraModeRef,
  targetCameraPanRef,
  isDraggingCameraRef,
  didDragCameraRef,
  dragStartMouseRef,
  dragStartPanRef,
  mousePosRef,
  lockedTargetRef,
  lastTouchTimeRef,
  onFire,
  onPlaceSlug,
  onStartCharge,
  onReleaseCharge,
  onUpdateAim,
}: UseCanvasMouseControlsProps) {
  const lastPlacementTimeRef = useRef<number>(0);
  const girderDragOriginRef = useRef<Vector2D | null>(null);
  const isGirderDraggingRef = useRef<boolean>(false);

  const getCanvasMousePos = useCallback(
    (e: React.MouseEvent<HTMLElement> | MouseEvent): Vector2D => {
      const container = containerRef.current;
      if (!container) return { x: 700, y: 350 };
      const rect = container.getBoundingClientRect();
      return screenToWorldCoords(
        e.clientX,
        e.clientY,
        rect,
        terrain.data.width,
        terrain.data.height,
        zoomRef.current,
        panRef.current
      );
    },
    [containerRef, terrain.data.width, terrain.data.height, zoomRef, panRef]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        const dx = e.clientX - dragStartMouseRef.current.x;
        const dy = e.clientY - dragStartMouseRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          didDragCameraRef.current = true;
        }
        const container = containerRef.current;
        const rect = container ? container.getBoundingClientRect() : { width: 1400, height: 700 };
        const clamped = clampPanOffset(
          { x: dragStartPanRef.current.x + dx, y: dragStartPanRef.current.y + dy },
          zoomRef.current,
          rect.width,
          rect.height,
          terrain.data.width,
          terrain.data.height
        );
        cameraModeRef.current = 'FREE_LOOK';
        panRef.current = clamped;
        return;
      }

      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      const curGameState = gameStateRef.current;
      const isMyTurn = isMyTurnRef.current;

      if (!isMyTurn || curGameState.phase !== 'AIMING') return;
      const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
      if (!activeSlug) return;

      if (activeSlug.selectedWeaponId === 'girder') {
        if (lockedTargetRef.current) {
          const angle = calculateGirderAngle(pos, lockedTargetRef.current);
          const dx = pos.x - lockedTargetRef.current.x;
          const dy = pos.y - lockedTargetRef.current.y;
          if (Math.hypot(dx, dy) > 6) {
            activeSlug.aimAngle = angle;
            onUpdateAim?.(angle, activeSlug.aimPower, activeSlug.facing, lockedTargetRef.current);
          }
        } else {
          onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
        }
        return;
      }

      const { aimAngle, facing } = calculateAimAngleAndFacing(pos, activeSlug);
      if (aimAngle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        activeSlug.aimAngle = aimAngle;
        activeSlug.facing = facing;
        onUpdateAim?.(aimAngle, activeSlug.aimPower, facing);
      }
    },
    [getCanvasMousePos, onUpdateAim, isDraggingCameraRef, dragStartMouseRef, dragStartPanRef, didDragCameraRef, containerRef, zoomRef, terrain.data.width, terrain.data.height, cameraModeRef, panRef, mousePosRef, gameStateRef, isMyTurnRef, lockedTargetRef]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (didDragCameraRef.current) {
        didDragCameraRef.current = false;
        return;
      }
      const curGameState = gameStateRef.current;
      const isMyTurn = isMyTurnRef.current;

      if (!isMyTurn || curGameState.phase !== 'AIMING') return;
      const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.id === 'girder' || weapon.requiresTarget) {
        const pos = getCanvasMousePos(e);
        lockedTargetRef.current = pos;
        activeSlug.currentTargetPoint = pos;
        sfx.play('tick');
        onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
      }
    },
    [didDragCameraRef, gameStateRef, isMyTurnRef, getCanvasMousePos, lockedTargetRef, onUpdateAim]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      targetCameraPanRef.current = null;
      if (Date.now() - lastTouchTimeRef.current < 450) return;

      if (e.button === 1 || e.button === 2) {
        isDraggingCameraRef.current = true;
        didDragCameraRef.current = false;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartPanRef.current = { ...panRef.current };
        cameraModeRef.current = 'FREE_LOOK';
        return;
      }

      const isMyTurn = isMyTurnRef.current;
      if (!isMyTurn || e.button !== 0) return;
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);
      const curGameState = gameStateRef.current;

      if (curGameState.phase === 'PLACEMENT') {
        if (Date.now() - lastPlacementTimeRef.current > 400) {
          lastPlacementTimeRef.current = Date.now();
          onPlaceSlug?.({ x: mouseX, y: mouseY });
        }
        return;
      }

      if (curGameState.phase !== 'AIMING') return;
      const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.id === 'girder') {
        if (!lockedTargetRef.current) {
          lockedTargetRef.current = { x: mouseX, y: mouseY };
          activeSlug.currentTargetPoint = { x: mouseX, y: mouseY };
          onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, { x: mouseX, y: mouseY });
        }
        return;
      }

      const { aimAngle, facing } = calculateAimAngleAndFacing({ x: mouseX, y: mouseY }, activeSlug);
      onUpdateAim?.(aimAngle, activeSlug.aimPower, facing);

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';
      const usesTargetPoint = weapon.requiresTarget;
      const targetPt = (usesTargetPoint ? lockedTargetRef.current : null) || { x: mouseX, y: mouseY };

      if (weapon.id === 'blowtorch') {
        if (!activeSlug.isBlowtorching) {
          onFire({ ...targetPt, aimAngle, aimPower: 5, facing });
        }
        return;
      }

      const isChargeable = isWeaponChargeable(weapon);
      if (isInstantTarget || !isChargeable) {
        onFire({ ...targetPt, aimAngle, aimPower: 100, facing });
      } else {
        onStartCharge?.(targetPt);
      }
    },
    [targetCameraPanRef, lastTouchTimeRef, isDraggingCameraRef, didDragCameraRef, dragStartMouseRef, dragStartPanRef, panRef, cameraModeRef, isMyTurnRef, getCanvasMousePos, gameStateRef, onPlaceSlug, onUpdateAim, onFire, onStartCharge, lockedTargetRef]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (Date.now() - lastTouchTimeRef.current < 450) return;

      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        cameraModeRef.current = 'FREE_LOOK';
        if (e.button === 1 || e.button === 2) return;
      }

      const isMyTurn = isMyTurnRef.current;
      const curGameState = gameStateRef.current;
      if (!isMyTurn || curGameState.phase !== 'AIMING' || e.button !== 0) return;
      const { x: clickX, y: clickY } = getCanvasMousePos(e);
      const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.id === 'girder') {
        const placementPt = lockedTargetRef.current || { x: clickX, y: clickY };
        onFire({ ...placementPt, aimAngle: activeSlug.aimAngle, aimPower: 5, facing: activeSlug.facing });
        lockedTargetRef.current = null;
        girderDragOriginRef.current = null;
        isGirderDraggingRef.current = false;
        return;
      }

      const usesTargetPoint = weapon.requiresTarget;
      const targetPt = (usesTargetPoint ? lockedTargetRef.current : null) || { x: clickX, y: clickY };

      if (weapon.id === 'blowtorch') {
        if (activeSlug.isBlowtorching) {
          onReleaseCharge?.({ ...targetPt, aimAngle: activeSlug.aimAngle, aimPower: activeSlug.aimPower, facing: activeSlug.facing });
        }
        return;
      }

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (isInstantTarget) {
        onFire({ ...targetPt, aimAngle: activeSlug.aimAngle, aimPower: activeSlug.aimPower, facing: activeSlug.facing });
        lockedTargetRef.current = null;
      } else {
        const { aimAngle, facing } = calculateAimAngleAndFacing({ x: clickX, y: clickY }, activeSlug);
        onUpdateAim?.(aimAngle, activeSlug.aimPower, facing);
        onReleaseCharge?.({ ...targetPt, aimAngle, aimPower: activeSlug.aimPower, facing });
        lockedTargetRef.current = null;
      }
    },
    [lastTouchTimeRef, isDraggingCameraRef, cameraModeRef, isMyTurnRef, gameStateRef, getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim, lockedTargetRef]
  );

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    getCanvasMousePos,
  };
}

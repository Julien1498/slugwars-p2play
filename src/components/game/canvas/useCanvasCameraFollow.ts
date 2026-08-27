import { GameState, Vector2D } from '../../../core/types';
import { clampPanOffset } from '../../../rendering/cameraUtils';
import { ClientExplosion } from '../../../rendering/renderEffects';

export interface UpdateCameraFollowParams {
  curState: GameState;
  cameraModeRef: React.MutableRefObject<'FOLLOW_SLUG' | 'FOLLOW_PROJECTILE' | 'FREE_LOOK'>;
  panRef: React.MutableRefObject<Vector2D>;
  targetCameraPanRef: React.MutableRefObject<Vector2D | null>;
  zoomRef: React.MutableRefObject<number>;
  isUserDraggingNow: boolean;
  clientExplosions: ClientExplosion[];
  cRect: { width: number; height: number };
  terrainWidth: number;
  terrainHeight: number;
}

export function updateCameraFollow({
  curState,
  cameraModeRef,
  panRef,
  targetCameraPanRef,
  zoomRef,
  isUserDraggingNow,
  clientExplosions,
  cRect,
  terrainWidth,
  terrainHeight,
}: UpdateCameraFollowParams) {
  if (isUserDraggingNow) {
    cameraModeRef.current = 'FREE_LOOK';
  }

  const currentActiveSlug = curState?.slugs.find((s) => s.id === curState.activeSlugId);
  const isSlugMoving = currentActiveSlug && currentActiveSlug.isAlive && (
    currentActiveSlug.movingDir !== null ||
    Math.abs(currentActiveSlug.vx) > 0.15 ||
    Math.abs(currentActiveSlug.vy) > 0.5 ||
    currentActiveSlug.inVehicleId !== null
  );

  if (isSlugMoving && !isUserDraggingNow) {
    cameraModeRef.current = 'FOLLOW_SLUG';
  }

  if (curState && curState.projectiles && curState.projectiles.length > 0) {
    if (!isUserDraggingNow) {
      cameraModeRef.current = 'FOLLOW_PROJECTILE';
    }
  }

  if (curState && (curState.phase === 'RETREAT' || curState.phase === 'TURN_START' || curState.phase === 'RESOLVING')) {
    if (!isUserDraggingNow && cameraModeRef.current !== 'FOLLOW_PROJECTILE') {
      cameraModeRef.current = 'FOLLOW_SLUG';
    }
  }

  let actionTarget: { x: number; y: number } | null = null;
  let followSpeed = 0.08;

  if (cameraModeRef.current === 'FREE_LOOK') {
    actionTarget = null;
  } else if (cameraModeRef.current === 'FOLLOW_PROJECTILE') {
    if (curState && curState.projectiles && curState.projectiles.length > 0) {
      const proj = curState.projectiles[0];
      actionTarget = { x: proj.x, y: proj.y };
      followSpeed = 0.16;
    } else if (clientExplosions && clientExplosions.length > 0) {
      const latestEx = clientExplosions[clientExplosions.length - 1];
      const nowMs = performance.now();
      if (nowMs - latestEx.startTime < 450) {
        actionTarget = { x: latestEx.x, y: latestEx.y };
        followSpeed = 0.12;
      } else {
        cameraModeRef.current = 'FOLLOW_SLUG';
      }
    } else {
      cameraModeRef.current = 'FOLLOW_SLUG';
    }
  }

  if (cameraModeRef.current === 'FOLLOW_SLUG') {
    if (currentActiveSlug && currentActiveSlug.isAlive && currentActiveSlug.isPlaced) {
      actionTarget = { x: currentActiveSlug.x, y: currentActiveSlug.y };
      followSpeed = curState.phase === 'RETREAT' ? 0.12 : 0.08;
    }
  }

  if (actionTarget && !isUserDraggingNow && cRect.width > 0 && cRect.height > 0) {
    const fitScale = Math.min(cRect.width / terrainWidth, cRect.height / terrainHeight);
    const totalScale = fitScale * zoomRef.current;
    const targetPanX = -(actionTarget.x - terrainWidth / 2) * totalScale;
    const targetPanY = -(actionTarget.y - terrainHeight / 2) * totalScale;
    const clampedTarget = clampPanOffset(
      { x: targetPanX, y: targetPanY },
      zoomRef.current,
      cRect.width,
      cRect.height,
      terrainWidth,
      terrainHeight
    );

    panRef.current.x += (clampedTarget.x - panRef.current.x) * followSpeed;
    panRef.current.y += (clampedTarget.y - panRef.current.y) * followSpeed;
  } else if (targetCameraPanRef.current) {
    const dx = targetCameraPanRef.current.x - panRef.current.x;
    const dy = targetCameraPanRef.current.y - panRef.current.y;
    if (Math.hypot(dx, dy) < 0.6) {
      panRef.current = { ...targetCameraPanRef.current };
      targetCameraPanRef.current = null;
    } else {
      panRef.current.x += dx * 0.12;
      panRef.current.y += dy * 0.12;
    }
  }
}

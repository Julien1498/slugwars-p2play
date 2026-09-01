import { useRef, useEffect, useCallback } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { perfTracker } from '../../../core/perfTracker';
import { createInterpolationCache, interpolateVisualState } from '../../../rendering/interpolationUtils';
import { createTerrainBuffers, redrawOffscreenTerrain, TerrainBuffers } from '../../../rendering/renderTerrain';
import { useCanvasEffects } from './useCanvasEffects';
import { updateCameraFollow } from './useCanvasCameraFollow';
import { renderBackgroundLayer } from './renderBackgroundLayer';
import { renderForegroundLayer } from './renderForegroundLayer';

export interface UseCanvasRenderLoopProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  actionCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  containerRectRef: React.RefObject<{ width: number; height: number }>;
  terrain: DestructibleTerrain;
  gameStateRef: React.MutableRefObject<GameState>;
  isMyTurnRef: React.MutableRefObject<boolean>;
  showHitboxesRef: React.MutableRefObject<boolean>;
  zoomRef: React.MutableRefObject<number>;
  panRef: React.MutableRefObject<Vector2D>;
  cameraModeRef: React.MutableRefObject<'FOLLOW_SLUG' | 'FOLLOW_PROJECTILE' | 'FREE_LOOK'>;
  targetCameraPanRef: React.MutableRefObject<Vector2D | null>;
  isDraggingCameraRef: React.MutableRefObject<boolean>;
  touchGestureRef: React.MutableRefObject<any>;
  mousePosRef: React.MutableRefObject<Vector2D>;
  lockedTargetRef: React.MutableRefObject<Vector2D | null>;
  pendingPlacementPoint?: Vector2D | null;
  updateFpsHud: () => void;
}

export function useCanvasRenderLoop({
  canvasRef,
  actionCanvasRef,
  containerRectRef,
  terrain,
  gameStateRef,
  isMyTurnRef,
  showHitboxesRef,
  zoomRef,
  panRef,
  cameraModeRef,
  targetCameraPanRef,
  isDraggingCameraRef,
  touchGestureRef,
  mousePosRef,
  lockedTargetRef,
  pendingPlacementPoint,
  updateFpsHud,
}: UseCanvasRenderLoopProps) {
  const buffersRef = useRef<TerrainBuffers | null>(null);
  const lastSeedRef = useRef<string | null>(null);
  const lastTerrainRevisionRef = useRef<number>(-1);
  const prevTerrainRef = useRef<DestructibleTerrain | null>(null);

  const interpolationCacheRef = useRef(createInterpolationCache());
  const lastRenderTimeRef = useRef<number>(0);

  const getBuffers = useCallback(() => {
    if (!buffersRef.current) {
      buffersRef.current = createTerrainBuffers(terrain.data.width, terrain.data.height);
    }
    return buffersRef.current;
  }, [terrain.data.width, terrain.data.height]);

  const redrawTerrain = useCallback(
    (dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }) => {
      const buffers = getBuffers();
      redrawOffscreenTerrain(terrain, buffers, dirtyBox);
    },
    [terrain, getBuffers]
  );

  const {
    clientParticlesRef,
    clientExplosionsRef,
    clientFloatingDamagesRef,
    currentRenderWaterYRef,
    clientWaterSplashesRef,
    clientWaterRipplesRef,
    clientWaterBubblesRef,
    slugDeathTimestampsRef,
    processFrameEffects,
    resetEffectsCache,
  } = useCanvasEffects({ terrain, getBuffers });

  useEffect(() => {
    const matchKey = `${terrain.data.seed}_${terrain.data.theme}_${terrain.data.width}_${terrain.data.height}`;
    const terrainChanged =
      lastSeedRef.current !== matchKey ||
      lastTerrainRevisionRef.current !== terrain.revision ||
      prevTerrainRef.current !== terrain;

    if (terrainChanged) {
      lastSeedRef.current = matchKey;
      lastTerrainRevisionRef.current = terrain.revision;
      prevTerrainRef.current = terrain;
      buffersRef.current = null;
      resetEffectsCache();
      lockedTargetRef.current = null;
      redrawTerrain();
    }

    const canvas = canvasRef.current;
    const actionCanvas = actionCanvasRef.current;
    if (!canvas || !actionCanvas) return;
    const ctx = (canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d')) as CanvasRenderingContext2D | null;
    const actionCtx = actionCanvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx || !actionCtx) return;

    let animId: number;

    const render = () => {
      animId = requestAnimationFrame(render);
      const renderStart = performance.now();

      if (terrain.lastDirtyBox) {
        lastTerrainRevisionRef.current = terrain.revision;
        const dirtyBox = terrain.lastDirtyBox;
        terrain.lastDirtyBox = undefined;
        redrawTerrain(dirtyBox);
      }

      const curState = gameStateRef.current;
      const { width, height, waterLevel } = terrain.data;

      // Dynamic Resolution Scaling (DRS) with native HiDPI / Retina devicePixelRatio support
      const deviceDpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
      const baseDpr = Math.min(2.0, Math.max(1.0, deviceDpr));
      const bgDpr = Math.round(baseDpr * Math.min(1.0, Math.max(0.75, zoomRef.current * 0.4 + 0.6)) * 100) / 100;
      const actionDpr = Math.round(baseDpr * Math.min(1.0, Math.max(0.90, zoomRef.current * 0.2 + 0.8)) * 100) / 100;
      perfTracker.setLiveDprs(bgDpr, actionDpr);
      const cRect = containerRectRef.current;

      const targetW_bg = Math.max(100, Math.round(cRect.width * bgDpr));
      const targetH_bg = Math.max(100, Math.round(cRect.height * bgDpr));
      if (canvas.width !== targetW_bg || canvas.height !== targetH_bg) {
        canvas.width = targetW_bg;
        canvas.height = targetH_bg;
      }

      const targetW_act = Math.max(100, Math.round(cRect.width * actionDpr));
      const targetH_act = Math.max(100, Math.round(cRect.height * actionDpr));
      if (actionCanvas.width !== targetW_act || actionCanvas.height !== targetH_act) {
        actionCanvas.width = targetW_act;
        actionCanvas.height = targetH_act;
      }

      // Camera follow logic
      const isUserDraggingNow = isDraggingCameraRef.current || touchGestureRef.current.isPinching || (touchGestureRef.current.singleTouchMoved && !touchGestureRef.current.touchIsAiming);
      updateCameraFollow({
        curState,
        cameraModeRef,
        panRef,
        targetCameraPanRef,
        zoomRef,
        isUserDraggingNow,
        clientExplosions: clientExplosionsRef.current,
        cRect,
        terrainWidth: width,
        terrainHeight: height,
      });

      const fitScale = Math.min(cRect.width / width, cRect.height / height);
      const totalScale = fitScale * zoomRef.current;

      const targetWaterLevel = curState?.waterLevel ?? waterLevel;
      if (Math.abs(currentRenderWaterYRef.current - targetWaterLevel) > 0.05) {
        currentRenderWaterYRef.current += (targetWaterLevel - currentRenderWaterYRef.current) * 0.08;
      } else {
        currentRenderWaterYRef.current = targetWaterLevel;
      }
      const waterY = currentRenderWaterYRef.current;

      processFrameEffects(curState, waterY);

      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      const viewLeft = width / 2 - (cRect.width / 2 + panRef.current.x) / totalScale;
      const viewRight = viewLeft + cRect.width / totalScale;
      const viewTop = height / 2 - (cRect.height / 2 + panRef.current.y) / totalScale;
      const viewBottom = viewTop + cRect.height / totalScale;

      const buffers = getBuffers();
      const viewBounds = { viewLeft, viewRight, viewTop, viewBottom };

      // 1. Render Background Layer
      renderBackgroundLayer({
        ctx,
        canvas,
        containerRect: cRect,
        terrain,
        buffers,
        gameState: curState,
        bgDpr,
        totalScale,
        pan: panRef.current,
        waterY,
        animTime,
        slowTime,
        viewBounds,
        isMyTurn: isMyTurnRef.current,
      });

      // 2. Visual State 144 FPS Interpolation
      const now = performance.now();
      const lastTime = lastRenderTimeRef.current || now;
      const dtSec = Math.min(0.1, (now - lastTime) / 1000);
      lastRenderTimeRef.current = now;
      const alpha = 1 - Math.exp(-24.0 * dtSec);

      const visualState = interpolateVisualState(curState, interpolationCacheRef.current, alpha);

      // 3. Render Foreground Layer
      renderForegroundLayer({
        actionCtx,
        actionCanvas,
        containerRect: cRect,
        terrain,
        buffers,
        visualState,
        curState,
        actionDpr,
        totalScale,
        pan: panRef.current,
        waterY,
        animTime,
        slowTime,
        viewBounds,
        slugDeathTimestamps: slugDeathTimestampsRef.current,
        clientParticles: clientParticlesRef.current,
        clientExplosions: clientExplosionsRef.current,
        clientFloatingDamages: clientFloatingDamagesRef.current,
        clientWaterBubbles: clientWaterBubblesRef.current,
        clientWaterRipples: clientWaterRipplesRef.current,
        clientWaterSplashes: clientWaterSplashesRef.current,
        mousePos: mousePosRef.current,
        lockedTarget: lockedTargetRef.current,
        pendingPlacementPoint,
        isMyTurn: isMyTurnRef.current,
        showHitboxes: showHitboxesRef.current,
      });

      const dt = performance.now() - renderStart;
      perfTracker.markFrame(dt, {
        slugs: curState.slugs.length,
        livingSlugs: curState.slugs.filter((s) => s.isAlive).length,
        projectiles: curState.projectiles?.length || 0,
        explosions: clientExplosionsRef.current.length,
        particles: clientParticlesRef.current.length,
        mines: curState.mines?.length || 0,
        crates: curState.supplyCrates?.length || 0,
      });

      updateFpsHud();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    terrain,
    redrawTerrain,
    resetEffectsCache,
    processFrameEffects,
    getBuffers,
    canvasRef,
    actionCanvasRef,
    containerRectRef,
    gameStateRef,
    isMyTurnRef,
    showHitboxesRef,
    zoomRef,
    panRef,
    cameraModeRef,
    targetCameraPanRef,
    isDraggingCameraRef,
    touchGestureRef,
    mousePosRef,
    lockedTargetRef,
    pendingPlacementPoint,
    updateFpsHud,
    currentRenderWaterYRef,
    clientExplosionsRef,
    clientParticlesRef,
    clientFloatingDamagesRef,
    clientWaterBubblesRef,
    clientWaterRipplesRef,
    clientWaterSplashesRef,
    slugDeathTimestampsRef,
  ]);
}

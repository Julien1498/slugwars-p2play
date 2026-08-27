import { useRef, useEffect, useCallback } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { sfx } from '../../../core/audio';
import { perfTracker } from '../../../core/perfTracker';
import { clampPanOffset } from '../../../rendering/cameraUtils';
import { createInterpolationCache, interpolateVisualState } from '../../../rendering/interpolationUtils';
import { createTerrainBuffers, redrawOffscreenTerrain, TerrainBuffers } from '../../../rendering/renderTerrain';
import { WaterBubble, WaterRipple, WaterSplash } from '../../../rendering/renderWater';
import { ClientParticle, ClientExplosion, ClientFloatingDamage } from '../../../rendering/renderEffects';
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
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownCraterIdsCanvasRef = useRef<Set<string>>(new Set());
  const slugDeathTimestampsRef = useRef<Map<string, number>>(new Map());

  const clientParticlesRef = useRef<ClientParticle[]>([]);
  const clientExplosionsRef = useRef<ClientExplosion[]>([]);
  const clientFloatingDamagesRef = useRef<ClientFloatingDamage[]>([]);
  const prevSlugHpsRef = useRef<Map<string, number>>(new Map());
  const prevSlugWaterStateRef = useRef<Map<string, { y: number; isAlive: boolean }>>(new Map());
  const splashCooldownsRef = useRef<Map<string, number>>(new Map());
  const currentRenderWaterYRef = useRef<number>(terrain.data.waterLevel);
  const clientWaterSplashesRef = useRef<WaterSplash[]>([]);
  const clientWaterRipplesRef = useRef<WaterRipple[]>([]);
  const clientWaterBubblesRef = useRef<WaterBubble[]>([]);

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

  const carveOffscreenCrater = useCallback(
    (x: number, y: number, radius: number) => {
      const safeRadius = Math.max(0, radius || 0);
      if (safeRadius <= 0) return;

      terrain.carveExplosion(x, y, safeRadius);

      const buffers = getBuffers();
      if (buffers.offscreenCanvas) {
        const offCtx = buffers.offscreenCanvas.getContext('2d');
        if (offCtx) {
          offCtx.save();
          offCtx.globalCompositeOperation = 'destination-out';
          offCtx.beginPath();
          offCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
          offCtx.fill();
          offCtx.restore();
        }
      }
    },
    [terrain, getBuffers]
  );

  const triggerWaterSplash = useCallback((x: number, y: number, scale = 1.0) => {
    clientWaterRipplesRef.current.push(
      { x, radius: 4 * scale, life: 1.0, color: 'rgba(255, 255, 255, 0.95)' },
      { x, radius: 9 * scale, life: 0.90, color: 'rgba(56, 189, 248, 0.80)' }
    );

    const count = Math.round(22 * scale);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = (Math.random() * 5.0 + 3.0) * scale;
      clientWaterSplashesRef.current.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * speed * 0.75,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3.5 + 2.0,
        life: 1.0,
        color: Math.random() < 0.5 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(56, 189, 248, 0.9)',
      });
    }

    for (let i = 0; i < 8; i++) {
      clientWaterBubblesRef.current.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + Math.random() * 10 + 2,
        vx: (Math.random() - 0.5) * 1.4,
        vy: -Math.random() * 1.8 - 0.8,
        size: Math.random() * 2.5 + 1.5,
        life: 1.0,
      });
    }

    sfx.play('splash');
  }, []);

  const triggerClientExplosion = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(10, radius || 30);
    clientExplosionsRef.current.push({
      id: `cex_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: safeRadius,
      startTime: performance.now(),
      duration: 450,
    });

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.7 + 0.3) * (safeRadius / 7);
      clientParticlesRef.current.push({
        x: x + Math.cos(angle) * (safeRadius * 0.15),
        y: y + Math.sin(angle) * (safeRadius * 0.15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: i % 3 === 0 ? '#ef4444' : i % 3 === 1 ? '#f59e0b' : '#3f3f46',
        size: Math.random() * 4 + 2,
        life: 1.0,
      });
    }
  }, []);

  useEffect(() => {
    const matchKey = `${terrain.data.seed}_${terrain.data.theme}`;
    if (lastSeedRef.current !== matchKey || lastTerrainRevisionRef.current > terrain.revision) {
      lastSeedRef.current = matchKey;
      lastTerrainRevisionRef.current = terrain.revision;
      carvedExplosionsRef.current.clear();
      knownCraterIdsCanvasRef.current.clear();
      slugDeathTimestampsRef.current.clear();
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

      const curState = gameStateRef.current;
      const { width, height, waterLevel } = terrain.data;

      // Process new craters & explosions
      if (curState.craters && curState.craters.length > 0) {
        for (const c of curState.craters) {
          if (!knownCraterIdsCanvasRef.current.has(c.id)) {
            knownCraterIdsCanvasRef.current.add(c.id);
            carveOffscreenCrater(c.x, c.y, c.radius);
          }
        }
      }

      if (curState.explosions && curState.explosions.length > 0) {
        for (const ex of curState.explosions) {
          if (!carvedExplosionsRef.current.has(ex.id)) {
            carvedExplosionsRef.current.add(ex.id);
            carveOffscreenCrater(ex.x, ex.y, ex.radius);
            triggerClientExplosion(ex.x, ex.y, ex.radius);
          }
        }
      }

      // Dynamic Resolution Scaling (DRS)
      const bgDpr = Math.min(1.0, Math.max(0.70, Math.round((zoomRef.current + 0.16) * 100) / 100));
      const actionDpr = Math.min(1.0, Math.max(0.90, Math.round((zoomRef.current + 0.27) * 100) / 100));
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
        } else if (clientExplosionsRef.current && clientExplosionsRef.current.length > 0) {
          const latestEx = clientExplosionsRef.current[clientExplosionsRef.current.length - 1];
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
        const fitScale = Math.min(cRect.width / width, cRect.height / height);
        const totalScale = fitScale * zoomRef.current;
        const targetPanX = -(actionTarget.x - width / 2) * totalScale;
        const targetPanY = -(actionTarget.y - height / 2) * totalScale;
        const clampedTarget = clampPanOffset(
          { x: targetPanX, y: targetPanY },
          zoomRef.current,
          cRect.width,
          cRect.height,
          width,
          height
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

      const fitScale = Math.min(cRect.width / width, cRect.height / height);
      const totalScale = fitScale * zoomRef.current;

      // Damage detection
      if (curState && curState.slugs) {
        for (const slug of curState.slugs) {
          const prevHp = prevSlugHpsRef.current.get(slug.id);
          if (prevHp !== undefined && prevHp !== slug.hp && slug.isAlive) {
            clientFloatingDamagesRef.current.push({
              id: `${slug.id}_${Date.now()}`,
              x: slug.x,
              y: slug.y - 20,
              damage: prevHp - slug.hp,
              startTime: performance.now(),
              duration: 800,
            });
            if (prevHp > slug.hp) sfx.play('ouch');
          }
          prevSlugHpsRef.current.set(slug.id, slug.hp);
        }
      }

      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      const targetWaterLevel = curState?.waterLevel ?? waterLevel;
      if (Math.abs(currentRenderWaterYRef.current - targetWaterLevel) > 0.05) {
        currentRenderWaterYRef.current += (targetWaterLevel - currentRenderWaterYRef.current) * 0.08;
      } else {
        currentRenderWaterYRef.current = targetWaterLevel;
      }
      const waterY = currentRenderWaterYRef.current;

      // Water entry splashes
      if (curState && curState.slugs) {
        for (const slug of curState.slugs) {
          const prevState = prevSlugWaterStateRef.current.get(slug.id);
          const isNowUnderwater = slug.y >= waterY - 4;
          const wasAbove = !prevState || prevState.y < waterY - 4;
          const wasAlive = !prevState || prevState.isAlive;

          if (isNowUnderwater && (wasAbove || (wasAlive && !slug.isAlive))) {
            const nowMs = performance.now();
            const lastSplash = splashCooldownsRef.current.get(slug.id) || 0;
            if (nowMs - lastSplash > 400) {
              splashCooldownsRef.current.set(slug.id, nowMs);
              triggerWaterSplash(slug.x, waterY, 1.4);
            }
          }
          prevSlugWaterStateRef.current.set(slug.id, { y: slug.y, isAlive: slug.isAlive });

          if (!slug.isAlive) {
            if (!slugDeathTimestampsRef.current.has(slug.id)) {
              slugDeathTimestampsRef.current.set(slug.id, performance.now());
            }
            const deathTime = slugDeathTimestampsRef.current.get(slug.id) || performance.now();
            const timeSinceDeath = performance.now() - deathTime;
            if (slug.y >= waterY && timeSinceDeath < 2500 && Math.random() < 0.3 && clientWaterBubblesRef.current.length < 25) {
              clientWaterBubblesRef.current.push({
                x: slug.x + (Math.random() - 0.5) * 12,
                y: slug.y - 4,
                vx: (Math.random() - 0.5) * 0.4,
                vy: -1.8 - Math.random() * 1.0,
                size: 2 + Math.random() * 2.2,
                life: 1.0,
              });
            }
          }
        }
      }

      if (curState && curState.projectiles) {
        for (const p of curState.projectiles) {
          if (p.y >= waterY - 6 && p.y <= waterY + 30) {
            const pKey = `proj_${p.id}`;
            const nowMs = performance.now();
            const lastSplash = splashCooldownsRef.current.get(pKey) || 0;
            if (nowMs - lastSplash > 400) {
              splashCooldownsRef.current.set(pKey, nowMs);
              triggerWaterSplash(p.x, waterY, 1.1);
            }
          }
        }
      }

      const viewLeft = width / 2 - (cRect.width / 2 + panRef.current.x) / totalScale;
      const viewRight = viewLeft + cRect.width / totalScale;
      const viewTop = height / 2 - (cRect.height / 2 + panRef.current.y) / totalScale;
      const viewBottom = viewTop + cRect.height / totalScale;

      const buffers = getBuffers();
      const viewBounds = { viewLeft, viewRight, viewTop, viewBottom };

      // 1. Render Background Layer (Sky, Terrain Buffer, Props, Foliage, Mines, Helis, Tombs)
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

      // 3. Render Foreground Layer (Slugs, Ninja Ropes, Crates, Projectiles, Particles, Waves, Hitboxes)
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

      // Update in-game FPS HUD
      updateFpsHud();
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    terrain,
    redrawTerrain,
    carveOffscreenCrater,
    triggerClientExplosion,
    triggerWaterSplash,
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
  ]);
}

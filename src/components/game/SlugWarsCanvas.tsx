import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon, isWeaponChargeable } from '../../core/weapons/registry';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';
import { useIsTouchDevice } from '../../hooks/useIsTouchDevice';
import { screenToWorldCoords, clampPanOffset } from '../../rendering/cameraUtils';
import { renderHDDestructibleGirder, renderHDDestructibleProp } from '../../rendering/renderProps';
import { renderSkyAndAtmosphere } from '../../rendering/renderSky';
import { renderForegroundOcean, WaterBubble, WaterRipple, WaterSplash } from '../../rendering/renderWater';
import { createTerrainBuffers, redrawOffscreenTerrain, TerrainBuffers } from '../../rendering/renderTerrain';
import { renderAllSlugs } from '../../rendering/renderSlugs';
import { renderProjectiles } from '../../rendering/renderProjectiles';
import { renderAimGuides } from '../../rendering/renderAimGuides';
import { renderPlacementGhost } from '../../rendering/renderPlacementGhost';
import { renderHitboxDebugOverlay } from '../../rendering/renderHitboxes';
import { renderDecorItems } from '../../rendering/renderDecorItems';
import {
  renderParticles,
  renderClientExplosions,
  renderFloatingDamages,
  renderNinjaRopes,
  renderSupplyCrates,
  renderMines,
  renderHelicopters,
  renderTombstones,
  ClientParticle,
  ClientExplosion,
  ClientFloatingDamage,
} from '../../rendering/renderEffects';

export interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire: (params: { x: number; y: number; aimAngle: number; aimPower: number; facing: 'left' | 'right' }) => void;
  onPlaceSlug?: (pos: Vector2D) => void;
  onSelectPlacementPoint?: (pos: Vector2D) => void;
  pendingPlacementPoint?: Vector2D | null;
  onStartCharge?: (target: Vector2D) => void;
  onReleaseCharge?: (params: { x: number; y: number; aimAngle: number; aimPower: number; facing: 'left' | 'right' }) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
}

const SlugWarsCanvasComponent: React.FC<SlugWarsCanvasProps> = ({
  gameState,
  terrain,
  isMyTurn,
  showHitboxes = false,
  onFire,
  onPlaceSlug,
  onSelectPlacementPoint,
  pendingPlacementPoint,
  onStartCharge,
  onReleaseCharge,
  onUpdateAim,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerRectRef = useRef<{ width: number; height: number }>({ width: 1400, height: 700 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const actionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const buffersRef = useRef<TerrainBuffers | null>(null);

  const lastSeedRef = useRef<string | null>(null);
  const lastTerrainRevisionRef = useRef<number>(-1);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsCanvasRef = useRef<Set<string>>(new Set());
  const knownCraterIdsCanvasRef = useRef<Set<string>>(new Set());
  const slugDeathTimestampsRef = useRef<Map<string, number>>(new Map());
  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const lockedTargetRef = useRef<Vector2D | null>(null);
  const girderDragOriginRef = useRef<Vector2D | null>(null);
  const isGirderDraggingRef = useRef<boolean>(false);

  const gameStateRef = useRef(gameState);

  gameStateRef.current = gameState;
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;
  const showHitboxesRef = useRef(showHitboxes);
  showHitboxesRef.current = showHitboxes;

  useEffect(() => {
    (SlugWarsCanvas as any)._updateExternalState = (nextState: GameState) => {
      gameStateRef.current = nextState;
    };
    return () => {
      delete (SlugWarsCanvas as any)._updateExternalState;
    };
  }, []);

  useEffect(() => {
    const unsub1 = perfTracker.onFpsHudToggle((enabled) => {
      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.style.display = enabled ? 'flex' : 'none';
      }
    });
    const unsub2 = perfTracker.onFpsHudAdvancedToggle((advanced) => {
      if (fpsDetailsRef.current) {
        fpsDetailsRef.current.style.display = advanced ? 'inline' : 'none';
      }
      if (fpsPassesRef.current) {
        fpsPassesRef.current.style.display = advanced ? 'block' : 'none';
      }
      if (fpsBadgeRef.current) {
        if (advanced) {
          fpsBadgeRef.current.classList.remove('px-2.5', 'py-1', 'rounded-xl', 'flex-row', 'items-center');
          fpsBadgeRef.current.classList.add('px-3', 'py-1.5', 'rounded-2xl', 'flex-col', 'gap-0.5');
        } else {
          fpsBadgeRef.current.classList.remove('px-3', 'py-1.5', 'rounded-2xl', 'flex-col', 'gap-0.5');
          fpsBadgeRef.current.classList.add('px-2.5', 'py-1', 'rounded-xl', 'flex-row', 'items-center');
        }
      }
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // Zero-Reflow Container Resize Observer (Eliminates layout thrashing in 60 FPS RAF loop)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateRect = () => {
      const r = container.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        containerRectRef.current = { width: r.width, height: r.height };
      }
    };

    updateRect();

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            for (const entry of entries) {
              const cr = entry.contentRect;
              if (cr.width > 0 && cr.height > 0) {
                containerRectRef.current = { width: cr.width, height: cr.height };
              }
            }
          })
        : null;

    if (ro) ro.observe(container);
    window.addEventListener('resize', updateRect);

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateRect);
    };
  }, []);

  const isTouch = useIsTouchDevice();

  // Smooth Camera Pan & Cursor-Centered Zoom Refs (0 React Re-renders)
  const zoomRef = useRef<number>(
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth ? 1.6 : 1.0
  );
  const panRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isDraggingCameraRef = useRef<boolean>(false);
  const didDragCameraRef = useRef<boolean>(false);
  const dragStartMouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragStartPanRef = useRef<Vector2D>({ x: 0, y: 0 });
  const targetCameraPanRef = useRef<Vector2D | null>(null);
  const cameraModeRef = useRef<'FOLLOW_SLUG' | 'FOLLOW_PROJECTILE' | 'FREE_LOOK'>('FOLLOW_SLUG');

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
  const visualSlugPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const renderedSlugsCacheRef = useRef<any[]>([]);
  const visualCratePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const renderedCratesCacheRef = useRef<any[]>([]);
  const visualProjectilePositionsRef = useRef<Map<string, { x: number; y: number; angle: number }>>(new Map());
  const renderedProjectilesCacheRef = useRef<any[]>([]);
  const visualStateRef = useRef<GameState | null>(null);
  const lastRenderTimeRef = useRef<number>(0);

  // Zero-Overhead In-Game Permanent FPS HUD Refs
  const fpsBadgeRef = useRef<HTMLDivElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);
  const fpsDetailsRef = useRef<HTMLSpanElement | null>(null);
  const fpsPassesRef = useRef<HTMLDivElement | null>(null);
  const fpsDotRef = useRef<HTMLSpanElement | null>(null);
  const fpsCounterFramesRef = useRef(0);
  const lastFpsHudUpdateRef = useRef(performance.now());

  useEffect(() => {
    const unsub = perfTracker.onFpsHudToggle((enabled) => {
      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.style.display = enabled ? 'flex' : 'none';
      }
    });
    return unsub;
  }, []);

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

      // 1. Synchronize grid array & mark overlapping solidProps destroyed
      terrain.carveExplosion(x, y, safeRadius);

      // 2. Cut crater directly out of offscreen terrain canvas (erases terrain pixels and prop drawings)
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
    // 1. Expanding surface ripples
    clientWaterRipplesRef.current.push(
      { x, radius: 4 * scale, life: 1.0, color: 'rgba(255, 255, 255, 0.95)' },
      { x, radius: 9 * scale, life: 0.90, color: 'rgba(56, 189, 248, 0.80)' }
    );

    // 2. Upward fountain splash droplets
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

    // 3. Submerged bubbles
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

    // Spawn fiery debris and smoke particles (capped for 60fps)
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
    [terrain.data.width, terrain.data.height]
  );

  // Mouse wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const minZoom = isTouch ? 0.75 : 0.5;
      const newZoom = Math.max(minZoom, Math.min(3.0, zoomRef.current * zoomFactor));


      const rect = container.getBoundingClientRect();
      const mouseRelX = e.clientX - rect.left - rect.width / 2;
      const mouseRelY = e.clientY - rect.top - rect.height / 2;

      const scaleChange = newZoom / zoomRef.current;
      const newPanX = mouseRelX - (mouseRelX - panRef.current.x) * scaleChange;
      const newPanY = mouseRelY - (mouseRelY - panRef.current.y) * scaleChange;

      const clamped = clampPanOffset(
        { x: newPanX, y: newPanY },
        newZoom,
        rect.width,
        rect.height,
        terrain.data.width,
        terrain.data.height
      );
      targetCameraPanRef.current = null;
      cameraModeRef.current = 'FREE_LOOK';
      zoomRef.current = newZoom;
      panRef.current = clamped;
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const lastTouchTimeRef = useRef<number>(0);
  const lastPlacementTimeRef = useRef<number>(0);
  const lastCenteredSlugIdRef = useRef<string | null>(null);

  // Auto-center camera only when active slug actually changes to a newly placed slug
  useEffect(() => {
    if (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT') {
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && activeSlug.isPlaced && activeSlug.x > 0 && activeSlug.y > 0) {
        if (lastCenteredSlugIdRef.current !== activeSlug.id) {
          lastCenteredSlugIdRef.current = activeSlug.id;
          cameraModeRef.current = 'FOLLOW_SLUG';
          if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const fitScale = Math.min(rect.width / terrain.data.width, rect.height / terrain.data.height);
            const totalScale = fitScale * zoomRef.current;
            const targetPanX = -(activeSlug.x - terrain.data.width / 2) * totalScale;
            const targetPanY = -(activeSlug.y - terrain.data.height / 2) * totalScale;
            const clamped = clampPanOffset(
              { x: targetPanX, y: targetPanY },
              zoomRef.current,
              rect.width,
              rect.height,
              terrain.data.width,
              terrain.data.height
            );
            targetCameraPanRef.current = clamped;
          }
        }
      }
    } else if (gameState.phase === 'PLACEMENT') {
      // In placement phase, do not reset camera
      lastCenteredSlugIdRef.current = null;
      targetCameraPanRef.current = null;
    }
  }, [gameState.activeSlugId, gameState.phase, terrain.data.width, terrain.data.height]);

  // Global shortcut 'c' or 'C' to instantly re-center camera on active slug, and movement key detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      const key = e.key.toLowerCase();

      // If player starts walking, jumping, or controlling slug, immediately return to FOLLOW_SLUG mode!
      if (['a', 'd', 'q', 'z', 'w', 's', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'enter'].includes(key)) {
        cameraModeRef.current = 'FOLLOW_SLUG';
      }

      if (key === 'c') {
        e.preventDefault();
        cameraModeRef.current = 'FOLLOW_SLUG';
        const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
        if (activeSlug && activeSlug.isPlaced && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const fitScale = Math.min(rect.width / terrain.data.width, rect.height / terrain.data.height);
          const totalScale = fitScale * zoomRef.current;
          const targetPanX = -(activeSlug.x - terrain.data.width / 2) * totalScale;
          const targetPanY = -(activeSlug.y - terrain.data.height / 2) * totalScale;
          const clamped = clampPanOffset(
            { x: targetPanX, y: targetPanY },
            zoomRef.current,
            rect.width,
            rect.height,
            terrain.data.width,
            terrain.data.height
          );
          targetCameraPanRef.current = clamped;
        }
      }
    };

    const handleRecenterEvent = () => {
      cameraModeRef.current = 'FOLLOW_SLUG';
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && activeSlug.isPlaced && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const fitScale = Math.min(rect.width / terrain.data.width, rect.height / terrain.data.height);
        const totalScale = fitScale * zoomRef.current;
        const targetPanX = -(activeSlug.x - terrain.data.width / 2) * totalScale;
        const targetPanY = -(activeSlug.y - terrain.data.height / 2) * totalScale;
        const clamped = clampPanOffset(
          { x: targetPanX, y: targetPanY },
          zoomRef.current,
          rect.width,
          rect.height,
          terrain.data.width,
          terrain.data.height
        );
        targetCameraPanRef.current = clamped;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('slugwars:recenter-camera', handleRecenterEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('slugwars:recenter-camera', handleRecenterEvent);
    };
  }, [gameState.slugs, gameState.activeSlugId, terrain.data.width, terrain.data.height]);



  const onPlaceSlugRef = useRef(onPlaceSlug);
  onPlaceSlugRef.current = onPlaceSlug;
  const onSelectPlacementPointRef = useRef(onSelectPlacementPoint);
  onSelectPlacementPointRef.current = onSelectPlacementPoint;
  const onUpdateAimRef = useRef(onUpdateAim);
  onUpdateAimRef.current = onUpdateAim;

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

  // Native Multi-Touch Gestures (Pinch-to-zoom, 2-finger Pan, 1-finger drag/aim/pan/placement)
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
            const dx = pos.x - activeSlug.x;
            const dy = pos.y - activeSlug.y;
            let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
            angle = Math.max(-85, Math.min(85, angle));
            const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
            if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
              activeSlug.aimAngle = angle;
              activeSlug.facing = facing;
              onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
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
            const slugDx = pos.x - activeSlug.x;
            const slugDy = pos.y - activeSlug.y;
            let angle = Math.round(Math.atan2(-slugDy, Math.abs(slugDx)) * (180 / Math.PI));
            angle = Math.max(-85, Math.min(85, angle));
            const facing: 'left' | 'right' = slugDx >= 0 ? 'right' : 'left';
            if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
              activeSlug.aimAngle = angle;
              activeSlug.facing = facing;
              onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
            }
          }
        } else {
          // Smooth 1-finger camera drag - completely stable and accurate!
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
                  // Tap near slug: aim rocket launch angle and facing direction
                  const dx = pos.x - activeSlug.x;
                  const dy = pos.y - activeSlug.y;
                  let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
                  angle = Math.max(-85, Math.min(85, angle));
                  const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
                  activeSlug.aimAngle = angle;
                  activeSlug.facing = facing;
                  sfx.play('tick');
                  onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing, activeSlug.currentTargetPoint);
                } else {
                  // Tap on terrain: place target crosshair
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
                const dx = pos.x - activeSlug.x;
                const dy = pos.y - activeSlug.y;
                let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
                angle = Math.max(-85, Math.min(85, angle));
                const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
                activeSlug.aimAngle = angle;
                activeSlug.facing = facing;
                sfx.play('tick');
                onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing);
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
  }, [terrain.data.width, terrain.data.height, terrain.data.waterLevel]);

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
          const dx = pos.x - lockedTargetRef.current.x;
          const dy = pos.y - lockedTargetRef.current.y;
          if (Math.hypot(dx, dy) > 6) {
            let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
            if (angle < 0) angle += 360;
            activeSlug.aimAngle = angle;
            onUpdateAim?.(angle, activeSlug.aimPower, activeSlug.facing, lockedTargetRef.current);
          }
        } else {
          onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
        }
        return;
      }

      const dx = pos.x - activeSlug.x;
      const dy = pos.y - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

      if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        activeSlug.aimAngle = angle;
        activeSlug.facing = facing;
        onUpdateAim?.(angle, activeSlug.aimPower, facing);
      }
    },
    [getCanvasMousePos, onUpdateAim]
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

      if (weapon.id === 'girder') {
        const pos = getCanvasMousePos(e);
        lockedTargetRef.current = pos;
        activeSlug.currentTargetPoint = pos;
        sfx.play('tick');
        onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
        return;
      }

      if (!weapon.requiresTarget) {
        return;
      }
      const pos = getCanvasMousePos(e);
      lockedTargetRef.current = pos;
      activeSlug.currentTargetPoint = pos;
      sfx.play('tick');
      onUpdateAim?.(activeSlug.aimAngle, activeSlug.aimPower, activeSlug.facing, pos);
    },
    [getCanvasMousePos, onUpdateAim]
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

      const dx = mouseX - activeSlug.x;
      const dy = mouseY - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
      onUpdateAim?.(angle, activeSlug.aimPower, facing);

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';
      const usesTargetPoint = weapon.requiresTarget;
      const targetPt = (usesTargetPoint ? lockedTargetRef.current : null) || { x: mouseX, y: mouseY };

      if (weapon.id === 'blowtorch') {
        if (!activeSlug.isBlowtorching) {
          onFire({ ...targetPt, aimAngle: angle, aimPower: 5, facing });
        }
        return;
      }

      const isChargeable = isWeaponChargeable(weapon);
      if (isInstantTarget || !isChargeable) {
        onFire({ ...targetPt, aimAngle: angle, aimPower: 100, facing });
      } else {
        onStartCharge?.(targetPt);
      }
    },
    [getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim, onFire]
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
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
        angle = Math.max(-85, Math.min(85, angle));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, activeSlug.aimPower, facing);
        onReleaseCharge?.({ ...targetPt, aimAngle: angle, aimPower: activeSlug.aimPower, facing });
        lockedTargetRef.current = null;
      }
    },
    [getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim]
  );


  // Render loop
  useEffect(() => {
    const matchKey = `${terrain.data.seed}_${terrain.data.theme}`;
    if (lastSeedRef.current !== matchKey || lastTerrainRevisionRef.current > terrain.revision) {
      lastSeedRef.current = matchKey;
      lastTerrainRevisionRef.current = terrain.revision;
      carvedExplosionsRef.current.clear();
      knownGirderIdsCanvasRef.current.clear();
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
      // 1. Professional Game Engine Standard: Schedule next frame IMMEDIATELY at the start of RAF
      // to latch onto Chromium's very next VSync cycle without missing the compositor deadline.
      animId = requestAnimationFrame(render);

      const renderStart = performance.now();

      const curState = gameStateRef.current;
      const { width, height, waterLevel, decorItems } = terrain.data;

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

      // Dynamic Resolution Scaling (DRS):
      // Layer 1 - Background Canvas (Sky, Mountains, Terrain, Props): DRS DPR scales with zoom + 0.05 (clamped between 0.70 and 1.00)
      const bgDpr = Math.min(1.0, Math.max(0.70, Math.round((zoomRef.current + 0.05) * 100) / 100));
      perfTracker.setLiveDpr(bgDpr);
      const cRect = containerRectRef.current;

      const targetW_bg = Math.max(100, Math.round(cRect.width * bgDpr));
      const targetH_bg = Math.max(100, Math.round(cRect.height * bgDpr));
      if (canvas.width !== targetW_bg || canvas.height !== targetH_bg) {
        canvas.width = targetW_bg;
        canvas.height = targetH_bg;
      }

      // Layer 2 - Foreground Action Canvas (Slugs, Weapons, Aiming, Particles, Water waves): Crisp 1.0x DPR
      const actionDpr = 1.0;
      const targetW_act = Math.max(100, Math.round(cRect.width * actionDpr));
      const targetH_act = Math.max(100, Math.round(cRect.height * actionDpr));
      if (actionCanvas.width !== targetW_act || actionCanvas.height !== targetH_act) {
        actionCanvas.width = targetW_act;
        actionCanvas.height = targetH_act;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      actionCtx.save();
      actionCtx.setTransform(1, 0, 0, 1, 0, 0);
      actionCtx.clearRect(0, 0, actionCanvas.width, actionCanvas.height);

      // Dynamic Action Camera Follow (Projectiles, Explosions, Supply Crates, Moving Slugs, Retreat)
      const isUserDraggingNow = isDraggingCameraRef.current || touchGestureRef.current.isPinching || (touchGestureRef.current.singleTouchMoved && !touchGestureRef.current.touchIsAiming);
      if (isUserDraggingNow) {
        cameraModeRef.current = 'FREE_LOOK';
      }

      // If active slug is actively moving (walking, jumping, falling, or steering vehicle), automatically refocus to FOLLOW_SLUG!
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

      // Check for active projectiles in flight
      if (curState && curState.projectiles && curState.projectiles.length > 0) {
        if (!isUserDraggingNow) {
          cameraModeRef.current = 'FOLLOW_PROJECTILE';
        }
      }

      // Check for phase transitions (retreat or turn intro or resolving)
      if (curState && (curState.phase === 'RETREAT' || curState.phase === 'TURN_START' || curState.phase === 'RESOLVING')) {
        if (!isUserDraggingNow && cameraModeRef.current !== 'FOLLOW_PROJECTILE') {
          cameraModeRef.current = 'FOLLOW_SLUG';
        }
      }

      let actionTarget: { x: number; y: number } | null = null;
      let followSpeed = 0.08;

      if (cameraModeRef.current === 'FREE_LOOK') {
        // In Free Look Mode, do NOT follow any target! The camera remains frozen at the user's manual pan position!
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

      // Smooth camera follow interpolation
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

      // Setup Background Context Transform
      ctx.scale(bgDpr, bgDpr);
      ctx.translate(cRect.width / 2 + panRef.current.x, cRect.height / 2 + panRef.current.y);
      ctx.scale(totalScale, totalScale);
      ctx.translate(-width / 2, -height / 2);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'low';

      // Setup Foreground Action Context Transform
      actionCtx.scale(actionDpr, actionDpr);
      actionCtx.translate(cRect.width / 2 + panRef.current.x, cRect.height / 2 + panRef.current.y);
      actionCtx.scale(totalScale, totalScale);
      actionCtx.translate(-width / 2, -height / 2);
      actionCtx.imageSmoothingEnabled = true;
      actionCtx.imageSmoothingQuality = 'low';


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

      const theme = curState?.config?.mapTheme || 'ISLAND';
      const isDay = (curState?.config?.dayNightCycle || 'DAY') === 'DAY';
      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      const worldLeft = -3500;
      const worldRight = width + 3500;
      const worldTop = -2500;
      const worldBottom = height + 3500;

      const targetWaterLevel = curState?.waterLevel ?? waterLevel;
      if (Math.abs(currentRenderWaterYRef.current - targetWaterLevel) > 0.05) {
        currentRenderWaterYRef.current += (targetWaterLevel - currentRenderWaterYRef.current) * 0.08;
      } else {
        currentRenderWaterYRef.current = targetWaterLevel;
      }
      const waterY = currentRenderWaterYRef.current;

      // Water entry splash & bubble detectors
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

      // 1. Sky, Atmosphere & Deep Background Ocean Swell (Granular sub-passes recorded inside renderSkyAndAtmosphere)
      renderSkyAndAtmosphere({
        ctx,
        width,
        height,
        waterY,
        theme,
        isDay,
        animTime,
        slowTime,
        worldLeft,
        worldRight,
        worldTop,
        worldBottom,
        viewLeft,
        viewRight,
        viewTop,
        viewBottom,
      });

      // 2. Offscreen Terrain Buffer
      const pTerrainStart = performance.now();
      const buffers = getBuffers();
      if (buffers.offscreenCanvas) {
        ctx.drawImage(buffers.offscreenCanvas, 0, 0);
      }
      perfTracker.recordRenderPass('terrain_buffer', performance.now() - pTerrainStart);

      // 3. Destructible Girders & Solid Props (with Viewport Culling)
      const { grid, solidProps } = terrain.data;
      const pGirdersStart = performance.now();
      if (curState.girders) {
        for (const g of curState.girders) {
          if (!g.destroyed) {
            if (viewLeft !== undefined && viewRight !== undefined) {
              if (g.x < viewLeft - 100 || g.x > viewRight + 100) continue;
            }
            renderHDDestructibleGirder(ctx, g, curState.craters, curState.explosions, grid, width, terrain.revision);
          }
        }
      }
      perfTracker.recordRenderPass('props_girders', performance.now() - pGirdersStart);

      const pSolidsStart = performance.now();
      if (solidProps) {
        for (const sprop of solidProps) {
          if (!sprop.destroyed) {
            if (viewLeft !== undefined && viewRight !== undefined) {
              if (sprop.x < viewLeft - 80 || sprop.x > viewRight + 80) continue;
            }
            renderHDDestructibleProp(ctx, sprop, curState.craters, curState.explosions, animTime, grid, width, terrain.revision);
          }
        }
      }
      perfTracker.recordRenderPass('props_solids', performance.now() - pSolidsStart);

      // 4. Decor Items (Butterflies & Foliage), Landmines, Helicopters & Tombstones
      const pDecorStart = performance.now();
      renderDecorItems(ctx, terrain, decorItems, animTime, viewLeft, viewRight);
      perfTracker.recordRenderPass('decor_foliage', performance.now() - pDecorStart);

      const pMinesStart = performance.now();
      if (curState.mines) {
        renderMines(ctx, curState.mines, viewLeft, viewRight);
      }
      perfTracker.recordRenderPass('decor_mines', performance.now() - pMinesStart);

      const pHelisStart = performance.now();
      if (curState.helicopters) {
        renderHelicopters(ctx, curState.helicopters, curState, animTime, isMyTurnRef.current, viewLeft, viewRight);
      }
      perfTracker.recordRenderPass('decor_helicopters', performance.now() - pHelisStart);

      const pTombsStart = performance.now();
      renderTombstones(ctx, curState.slugs, waterLevel, viewLeft, viewRight);
      perfTracker.recordRenderPass('decor_tombstones', performance.now() - pTombsStart);

      // Frame-rate independent visual interpolation for buttery smooth 60/144/240 FPS slug rendering (0 GC allocations)
      const now = performance.now();
      const lastTime = lastRenderTimeRef.current || now;
      const dtSec = Math.min(0.1, (now - lastTime) / 1000);
      lastRenderTimeRef.current = now;
      const alpha = 1 - Math.exp(-24.0 * dtSec);

      const renderedSlugs = renderedSlugsCacheRef.current;
      renderedSlugs.length = curState.slugs.length;
      for (let i = 0; i < curState.slugs.length; i++) {
        const slug = curState.slugs[i];
        let visualPos = visualSlugPositionsRef.current.get(slug.id);
        if (!visualPos) {
          visualPos = { x: slug.x, y: slug.y };
          visualSlugPositionsRef.current.set(slug.id, visualPos);
        } else {
          const dist = Math.hypot(slug.x - visualPos.x, slug.y - visualPos.y);
          if (dist > 64) {
            visualPos.x = slug.x;
            visualPos.y = slug.y;
          } else {
            visualPos.x += (slug.x - visualPos.x) * alpha;
            visualPos.y += (slug.y - visualPos.y) * alpha;
          }
        }
        renderedSlugs[i] = {
          ...slug,
          x: visualPos.x,
          y: visualPos.y,
        };
      }

      // Frame-rate independent visual interpolation for buttery smooth 60/144/240 FPS supply crates on guest
      const renderedCrates = renderedCratesCacheRef.current;
      const rawCrates = curState.supplyCrates || [];
      renderedCrates.length = rawCrates.length;
      for (let i = 0; i < rawCrates.length; i++) {
        const crate = rawCrates[i];
        let visualPos = visualCratePositionsRef.current.get(crate.id);
        if (!visualPos) {
          visualPos = { x: crate.x, y: crate.y };
          visualCratePositionsRef.current.set(crate.id, visualPos);
        } else {
          const dist = Math.hypot(crate.x - visualPos.x, crate.y - visualPos.y);
          if (dist > 64) {
            visualPos.x = crate.x;
            visualPos.y = crate.y;
          } else {
            visualPos.x += (crate.x - visualPos.x) * alpha;
            visualPos.y += (crate.y - visualPos.y) * alpha;
          }
        }
        renderedCrates[i] = {
          ...crate,
          x: visualPos.x,
          y: visualPos.y,
        };
      }

      // Frame-rate independent visual interpolation for buttery smooth 60/120/144/240 FPS projectiles (Pigeon, Sheep, Missiles, etc.)
      const rawProjectiles = curState.projectiles || [];
      const renderedProjectiles = renderedProjectilesCacheRef.current;
      renderedProjectiles.length = rawProjectiles.length;
      const currentProjIds = new Set<string>();

      for (let i = 0; i < rawProjectiles.length; i++) {
        const proj = rawProjectiles[i];
        currentProjIds.add(proj.id);
        let visualPos = visualProjectilePositionsRef.current.get(proj.id);
        const targetAngle = Math.atan2(proj.vy, proj.vx);

        if (!visualPos) {
          visualPos = { x: proj.x, y: proj.y, angle: Number.isFinite(targetAngle) ? targetAngle : 0 };
          visualProjectilePositionsRef.current.set(proj.id, visualPos);
        } else {
          const dist = Math.hypot(proj.x - visualPos.x, proj.y - visualPos.y);
          if (dist > 90) {
            visualPos.x = proj.x;
            visualPos.y = proj.y;
            visualPos.angle = Number.isFinite(targetAngle) ? targetAngle : visualPos.angle;
          } else {
            // Smooth position lerp
            visualPos.x += (proj.x - visualPos.x) * alpha;
            visualPos.y += (proj.y - visualPos.y) * alpha;

            // Shortest-arc smooth angle lerp
            if (Number.isFinite(targetAngle)) {
              let angleDiff = targetAngle - visualPos.angle;
              while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
              while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
              visualPos.angle += angleDiff * alpha;
            }
          }
        }

        renderedProjectiles[i] = {
          ...proj,
          x: visualPos.x,
          y: visualPos.y,
          interpolatedAngle: visualPos.angle,
        };
      }

      // Cleanup visual positions for dead projectiles
      for (const id of visualProjectilePositionsRef.current.keys()) {
        if (!currentProjIds.has(id)) {
          visualProjectilePositionsRef.current.delete(id);
        }
      }

      visualStateRef.current = {
        ...curState,
        slugs: renderedSlugs,
        supplyCrates: renderedCrates,
        projectiles: renderedProjectiles,
      };
      const visualState = visualStateRef.current;

      // 6. Slugs & Ninja Ropes (Rendered on Action Layer at Crisp 1.0x DPR)
      const pRopesStart = performance.now();
      renderNinjaRopes(actionCtx, renderedSlugs);
      perfTracker.recordRenderPass('ninja_ropes', performance.now() - pRopesStart);

      const pSlugsStart = performance.now();
      renderAllSlugs({
        ctx: actionCtx,
        gameState: visualState,
        animTime,
        slugDeathTimestamps: slugDeathTimestampsRef.current,
        viewLeft,
        viewRight,
      });
      perfTracker.recordRenderPass('slugs_rendering', performance.now() - pSlugsStart);

      // 7. Supply Crates, Projectiles & Particles FX (With Viewport Culling, 0 GC Array Allocations)
      const pCratesStart = performance.now();
      renderSupplyCrates(actionCtx, renderedCrates, animTime, viewLeft, viewRight);
      perfTracker.recordRenderPass('supply_crates', performance.now() - pCratesStart);

      const pProjStart = performance.now();
      renderProjectiles({ ctx: actionCtx, projectiles: renderedProjectiles, animTime, viewLeft, viewRight });
      perfTracker.recordRenderPass('projectiles', performance.now() - pProjStart);

      const pPartsStart = performance.now();
      // Spawn projectile smoke & fire trail particles
      if (renderedProjectiles.length > 0) {
        for (const proj of renderedProjectiles) {
          if (Math.hypot(proj.vx, proj.vy) > 0.5 && clientParticlesRef.current.length < 60) {
            clientParticlesRef.current.push({
              x: proj.x - proj.vx * 0.8,
              y: proj.y - proj.vy * 0.8,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6,
              color: Math.random() < 0.4 ? '#f59e0b' : '#71717a',
              size: 2.5 + Math.random() * 3,
              life: 1.0,
            });
          }
        }
      }
      renderParticles(actionCtx, clientParticlesRef.current, viewLeft, viewRight);
      perfTracker.recordRenderPass('particles_fx', performance.now() - pPartsStart);

      const pExplosionsStart = performance.now();
      renderClientExplosions(actionCtx, clientExplosionsRef.current, viewLeft, viewRight);
      perfTracker.recordRenderPass('explosions_fx', performance.now() - pExplosionsStart);

      const pDamagesStart = performance.now();
      renderFloatingDamages(actionCtx, clientFloatingDamagesRef.current, viewLeft, viewRight);
      perfTracker.recordRenderPass('floating_damages', performance.now() - pDamagesStart);

      // 8. Aim Guides, Holograms & Placement Preview
      const pAimStart = performance.now();
      const activeSlug = renderedSlugs.find((s) => s.id === curState.activeSlugId);
      if (activeSlug && (curState.phase === 'AIMING' || curState.phase === 'TURN_TIME')) {
        renderAimGuides({
          ctx: actionCtx,
          activeSlug,
          isMyTurn: isMyTurnRef.current,
          terrain,
          mousePos: mousePosRef.current,
          lockedTarget: lockedTargetRef.current || activeSlug.currentTargetPoint || null,
          animTime,
        });
      }
      perfTracker.recordRenderPass('aim_guides', performance.now() - pAimStart);

      if (curState.phase === 'PLACEMENT' && isMyTurnRef.current) {
        const pGhostStart = performance.now();
        renderPlacementGhost(
          actionCtx,
          curState,
          terrain,
          pendingPlacementPoint || mousePosRef.current,
          isMyTurnRef.current,
          animTime
        );
        perfTracker.recordRenderPass('placement_ghost', performance.now() - pGhostStart);
      }

      // 9. Foreground Ocean & Rolling Water Waves (With visible screen culling)
      const pOceanStart = performance.now();

      renderForegroundOcean({
        ctx: actionCtx,
        height,
        waterY,
        theme,
        isDay,
        slowTime,
        animTime,
        worldLeft,
        worldRight,
        worldBottom,
        viewLeft,
        viewRight,
        viewTop,
        viewBottom,
        bubbles: clientWaterBubblesRef.current,
        ripples: clientWaterRipplesRef.current,
        splashes: clientWaterSplashesRef.current,
      });
      perfTracker.recordRenderPass('ocean_waves', performance.now() - pOceanStart);

      // 10. Comprehensive Debug Hitboxes Overlay
      if (showHitboxesRef.current) {
        const pHitboxStart = performance.now();
        renderHitboxDebugOverlay({
          ctx: actionCtx,
          gameState: curState,
          terrain,
          terrainHitboxCanvas: buffers.terrainHitboxCanvas,
          waterLevel,
          width,
          height,
        });
        perfTracker.recordRenderPass('debug_hitboxes', performance.now() - pHitboxStart);
      }

      ctx.restore();
      actionCtx.restore();

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

      // Update in-game FPS HUD if enabled
      if (fpsTextRef.current && perfTracker.getFpsHudEnabled()) {
        fpsCounterFramesRef.current++;
        const nowFps = performance.now();
        if (nowFps - lastFpsHudUpdateRef.current >= 200) {
          const instantFps = Math.round((fpsCounterFramesRef.current * 1000) / (nowFps - lastFpsHudUpdateRef.current));
          fpsCounterFramesRef.current = 0;
          lastFpsHudUpdateRef.current = nowFps;
          fpsTextRef.current.textContent = `${instantFps} FPS`;

          const isAdvanced = perfTracker.getFpsHudAdvancedEnabled();

          if (fpsDetailsRef.current) {
            if (isAdvanced) {
              fpsDetailsRef.current.style.display = 'inline';
              fpsDetailsRef.current.textContent = `(${perfTracker.currentFrameTimeMs}ms) · Dessin: ${perfTracker.currentRenderDurationMs}ms · Phys: ${perfTracker.currentPhysicsDurationMs}ms`;
            } else {
              fpsDetailsRef.current.style.display = 'none';
            }
          }

          if (fpsPassesRef.current) {
            if (isAdvanced) {
              fpsPassesRef.current.style.display = 'block';
              const top = perfTracker.liveTopPasses;
              if (top && top.length > 0) {
                fpsPassesRef.current.textContent = top.map((p) => `${p.label.split(' ')[0]} ${p.ms}ms`).join(' · ');
              }
            } else {
              fpsPassesRef.current.style.display = 'none';
            }
          }

          if (fpsDotRef.current) {
            fpsDotRef.current.className = `w-2 h-2 rounded-full shrink-0 ${
              instantFps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : instantFps >= 30 ? 'bg-amber-400' : 'bg-red-400'
            }`;
          }
          if (fpsBadgeRef.current) {
            fpsBadgeRef.current.className = `absolute top-16 right-4 pointer-events-none ${
              isAdvanced ? 'px-3 py-1.5 rounded-2xl flex-col gap-0.5' : 'px-2.5 py-1 rounded-xl flex-row items-center gap-1.5'
            } bg-zinc-950/90 backdrop-blur-md border text-xs font-mono shadow-2xl flex select-none z-20 ${
              instantFps >= 50 ? 'text-emerald-400 border-emerald-500/30' : instantFps >= 30 ? 'text-amber-300 border-amber-500/30' : 'text-red-400 border-red-500/30'
            }`;
          }
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [terrain, redrawTerrain, carveOffscreenCrater, triggerClientExplosion, triggerWaterSplash, getBuffers]);

  const handleCenterCamera = () => {
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
  };

  const handleZoomIn = () => {
    zoomRef.current = Math.min(3.0, zoomRef.current * 1.25);
  };

  const handleZoomOut = () => {
    zoomRef.current = Math.max(0.5, zoomRef.current / 1.25);
  };

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none', contain: 'layout paint size' }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
    >
      {/* Zero-Overhead In-Game Hardware Profiler & FPS Counter HUD */}
      <div
        ref={fpsBadgeRef}
        style={{ display: perfTracker.getFpsHudEnabled() ? 'flex' : 'none' }}
        className={`absolute top-16 right-4 pointer-events-none ${
          perfTracker.getFpsHudAdvancedEnabled()
            ? 'px-3 py-1.5 rounded-2xl flex-col gap-0.5'
            : 'px-2.5 py-1 rounded-xl flex-row items-center gap-1.5'
        } bg-zinc-950/90 backdrop-blur-md border border-emerald-500/30 text-xs font-mono text-emerald-400 shadow-2xl flex select-none z-20`}
      >
        <div className="flex items-center gap-1.5">
          <span ref={fpsDotRef} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          <span ref={fpsTextRef} className="font-bold text-white">60 FPS</span>
          <span
            ref={fpsDetailsRef}
            style={{ display: perfTracker.getFpsHudAdvancedEnabled() ? 'inline' : 'none' }}
            className="text-[10px] text-zinc-400 font-normal"
          >
            (16.6ms) · Dessin: 1.0ms
          </span>
        </div>
        <div
          ref={fpsPassesRef}
          style={{ display: perfTracker.getFpsHudAdvancedEnabled() ? 'block' : 'none' }}
          className="text-[10px] text-cyan-300/90 font-mono tracking-tight"
        >
          Chargement des passes...
        </div>
      </div>

      {/* Layer 1: Background Canvas (Sky, Mountains, Distant Ocean, Offscreen Terrain, Props & Foliage - Dynamic DRS DPR) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          contain: 'strict',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        className="block w-full h-full"
      />

      {/* Layer 2: Action Canvas (Slugs, Weapons, Aiming, Particles, Explosions, Floating HP, Water Waves - Crisp 1.0x DPR) */}
      <canvas
        ref={actionCanvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          contain: 'strict',
          pointerEvents: 'none',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
        className="block w-full h-full"
      />
    </div>
  );
};

export const SlugWarsCanvas = React.memo(SlugWarsCanvasComponent, (prev, next) => {
  // Always update latest game state directly into canvas ref (0ms latency, zero JSX DOM overhead)
  (SlugWarsCanvas as any)._updateExternalState?.(next.gameState);

  // Skip React JSX re-rendering when canvas DOM container props haven't changed
  return (
    prev.terrain === next.terrain &&
    prev.isMyTurn === next.isMyTurn &&
    prev.showHitboxes === next.showHitboxes &&
    prev.pendingPlacementPoint?.x === next.pendingPlacementPoint?.x &&
    prev.pendingPlacementPoint?.y === next.pendingPlacementPoint?.y &&
    prev.onFire === next.onFire &&
    prev.onPlaceSlug === next.onPlaceSlug &&
    prev.onSelectPlacementPoint === next.onSelectPlacementPoint &&
    prev.onStartCharge === next.onStartCharge &&
    prev.onReleaseCharge === next.onReleaseCharge &&
    prev.onUpdateAim === next.onUpdateAim
  );
});

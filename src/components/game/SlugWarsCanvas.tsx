import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';
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
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = React.memo(({
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const buffersRef = useRef<TerrainBuffers | null>(null);

  const lastSeedRef = useRef<string | null>(null);
  const lastTerrainRevisionRef = useRef<number>(-1);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsCanvasRef = useRef<Set<string>>(new Set());
  const knownCraterIdsCanvasRef = useRef<Set<string>>(new Set());
  const slugDeathTimestampsRef = useRef<Map<string, number>>(new Map());
  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const lockedTargetRef = useRef<Vector2D | null>(null);

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const isMyTurnRef = useRef(isMyTurn);
  isMyTurnRef.current = isMyTurn;
  const showHitboxesRef = useRef(showHitboxes);
  showHitboxesRef.current = showHitboxes;

  // Smooth Camera Pan & Cursor-Centered Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  const [, setPanOffset] = useState<Vector2D>({ x: 0, y: 0 });
  const panRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isDraggingCameraRef = useRef<boolean>(false);
  const dragStartMouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragStartPanRef = useRef<Vector2D>({ x: 0, y: 0 });

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

  // Zero-Overhead In-Game Permanent FPS HUD Refs
  const fpsBadgeRef = useRef<HTMLDivElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);
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

      // 3. Cut crater out of subterranean shadow occlusion canvas
      if (buffers.occlusionCanvas) {
        const occCtx = buffers.occlusionCanvas.getContext('2d');
        if (occCtx) {
          occCtx.save();
          occCtx.globalCompositeOperation = 'destination-out';
          occCtx.beginPath();
          occCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
          occCtx.fill();
          occCtx.restore();
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
      const newZoom = Math.max(0.5, Math.min(3.0, zoomRef.current * zoomFactor));

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
      zoomRef.current = newZoom;
      panRef.current = clamped;
      setZoomLevel(newZoom);
      setPanOffset(clamped);
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
            panRef.current = clamped;
            setPanOffset(clamped);
          }
        }
      }
    } else if (gameState.phase === 'PLACEMENT') {
      // In placement phase, keep battlefield center fixed at 0, 0
      lastCenteredSlugIdRef.current = null;
      panRef.current = { x: 0, y: 0 };
      setPanOffset({ x: 0, y: 0 });
    }
  }, [gameState.activeSlugId, gameState.phase, terrain.data.width, terrain.data.height]);

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
      lastTouchTimeRef.current = Date.now();

      if (e.touches.length >= 2) {
        e.preventDefault();
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

        // Check if touch is near active slug to start direct aiming
        const curGameState = gameStateRef.current;
        const activeSlug = curGameState.slugs.find((s) => s.id === curGameState.activeSlugId);
        if (isMyTurnRef.current && curGameState.phase === 'AIMING' && activeSlug) {
          const distToSlug = Math.hypot(pos.x - activeSlug.x, pos.y - activeSlug.y);
          const weapon = getWeapon(activeSlug.selectedWeaponId);
          if (distToSlug < 90 && !weapon.requiresTarget && weapon.id !== 'girder') {
            g.touchIsAiming = true;
            const dx = pos.x - activeSlug.x;
            const dy = pos.y - activeSlug.y;
            let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
            angle = Math.max(-85, Math.min(85, angle));
            const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
            if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
              onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing);
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
      lastTouchTimeRef.current = Date.now();
      const rect = container.getBoundingClientRect();

      if (e.touches.length >= 2 && g.isPinching && g.gestureInitialDist > 0) {
        e.preventDefault();
        const currDist = Math.max(10, getDist(e.touches[0], e.touches[1]));
        const currMid = getMid(e.touches[0], e.touches[1]);
        const scale = currDist / g.gestureInitialDist;
        const newZoom = Math.max(0.5, Math.min(3.0, g.gestureInitialZoom * scale));

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
        setZoomLevel(newZoom);
        setPanOffset(clamped);
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
              onUpdateAimRef.current?.(angle, activeSlug.aimPower, facing);
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
          panRef.current = clamped;
          setPanOffset(clamped);
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
              if (weapon.requiresTarget || weapon.id === 'girder') {
                lockedTargetRef.current = pos;
                sfx.play('tick');
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
        panRef.current = clamped;
        setPanOffset(clamped);
        return;
      }

      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const dx = pos.x - activeSlug.x;
      const dy = pos.y - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

      if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        onUpdateAim?.(angle, activeSlug.aimPower, facing);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onUpdateAim]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);
      if (!weapon.requiresTarget && weapon.id !== 'girder') {
        return;
      }
      const pos = getCanvasMousePos(e);
      lockedTargetRef.current = pos;
      sfx.play('tick');
    },
    [isMyTurn, gameState, getCanvasMousePos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (Date.now() - lastTouchTimeRef.current < 450) return;

      if (e.button === 1 || e.button === 2) {
        isDraggingCameraRef.current = true;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartPanRef.current = { ...panRef.current };
        return;
      }

      if (!isMyTurn || e.button !== 0) return;
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

      if (gameState.phase === 'PLACEMENT') {
        if (Date.now() - lastPlacementTimeRef.current > 400) {
          lastPlacementTimeRef.current = Date.now();
          onPlaceSlug?.({ x: mouseX, y: mouseY });
        }
        return;
      }

      if (gameState.phase !== 'AIMING') return;
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const dx = mouseX - activeSlug.x;
      const dy = mouseY - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(-85, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
      onUpdateAim?.(angle, activeSlug.aimPower, facing);

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';
      const usesTargetPoint = weapon.requiresTarget || weapon.id === 'girder';
      if (!isInstantTarget) {
        const targetPt = (usesTargetPoint ? lockedTargetRef.current : null) || { x: mouseX, y: mouseY };
        onStartCharge?.(targetPt);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (Date.now() - lastTouchTimeRef.current < 450) return;

      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (e.button === 1 || e.button === 2) return;
      }

      if (!isMyTurn || gameState.phase !== 'AIMING' || e.button !== 0) return;
      const { x: clickX, y: clickY } = getCanvasMousePos(e);
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const usesTargetPoint = weapon.requiresTarget || weapon.id === 'girder';
      const targetPt = (usesTargetPoint ? lockedTargetRef.current : null) || { x: clickX, y: clickY };
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
    [isMyTurn, gameState, getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim]
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
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

      const container = containerRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cRect = container ? container.getBoundingClientRect() : { width, height };

      const targetW = Math.max(100, Math.round(cRect.width * dpr));
      const targetH = Math.max(100, Math.round(cRect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(dpr, dpr);
      const fitScale = Math.min(cRect.width / width, cRect.height / height);
      const totalScale = fitScale * zoomRef.current;

      ctx.translate(cRect.width / 2 + panRef.current.x, cRect.height / 2 + panRef.current.y);
      ctx.scale(totalScale, totalScale);
      ctx.translate(-width / 2, -height / 2);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

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
              slugDeathTimestampsRef.current.set(slug.id, Date.now());
            }
            const deathTime = slugDeathTimestampsRef.current.get(slug.id) || Date.now();
            const timeSinceDeath = Date.now() - deathTime;
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

      // 1. Sky, Atmosphere & Deep Background Ocean Swell
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
      });

      // 2. Offscreen Terrain Buffer
      const buffers = getBuffers();
      if (buffers.offscreenCanvas) {
        ctx.drawImage(buffers.offscreenCanvas, 0, 0);
      }

      // 3. Destructible Girders & Solid Props
      const { grid, solidProps } = terrain.data;
      if (curState.girders) {
        for (const g of curState.girders) {
          if (!g.destroyed) {
            renderHDDestructibleGirder(ctx, g, curState.craters, curState.explosions, grid, width);
          }
        }
      }
      if (solidProps) {
        for (const sprop of solidProps) {
          if (!sprop.destroyed) {
            renderHDDestructibleProp(ctx, sprop, curState.craters, curState.explosions, animTime, grid, width);
          }
        }
      }

      // 4. Subterranean Occlusion Mask
      if (buffers.occlusionCanvas) {
        ctx.drawImage(buffers.occlusionCanvas, 0, 0);
      }

      // 5. Decor Items (Butterflies & Hanging Leaf Roots) & Landmines & Helicopters
      renderDecorItems(ctx, terrain, decorItems, animTime);
      renderMines(ctx, curState.mines);
      renderHelicopters(ctx, curState.helicopters, curState, animTime, isMyTurnRef.current);
      renderTombstones(ctx, curState.slugs, waterLevel);

      // 6. Slugs, Ropes, Crates, Projectiles & Particles
      renderNinjaRopes(ctx, curState.slugs);
      renderAllSlugs({ ctx, gameState: curState, animTime, slugDeathTimestamps: slugDeathTimestampsRef.current });
      renderSupplyCrates(ctx, curState.supplyCrates);
      renderProjectiles({ ctx, projectiles: curState.projectiles || [], animTime });

      // Spawn projectile smoke & fire trail particles
      if (curState.projectiles && curState.projectiles.length > 0) {
        for (const proj of curState.projectiles) {
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

      renderParticles(ctx, clientParticlesRef.current);
      renderClientExplosions(ctx, clientExplosionsRef.current);
      renderFloatingDamages(ctx, clientFloatingDamagesRef.current);

      // 7. Aim Guides, Holograms & Placement Preview
      const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);
      if (activeSlug && (curState.phase === 'AIMING' || curState.phase === 'TURN_TIME')) {
        renderAimGuides({
          ctx,
          activeSlug,
          isMyTurn: isMyTurnRef.current,
          terrain,
          mousePos: mousePosRef.current,
          lockedTarget: lockedTargetRef.current,
          animTime,
        });
      }

      renderPlacementGhost(
        ctx,
        curState,
        terrain,
        pendingPlacementPoint || mousePosRef.current,
        isMyTurnRef.current,
        animTime
      );

      // 8. Foreground Ocean & Rolling Water Waves
      renderForegroundOcean({
        ctx,
        height,
        waterY,
        theme,
        isDay,
        slowTime,
        animTime,
        worldLeft,
        worldRight,
        worldBottom,
        bubbles: clientWaterBubblesRef.current,
        ripples: clientWaterRipplesRef.current,
        splashes: clientWaterSplashesRef.current,
      });

      // 9. Comprehensive Debug Hitboxes Overlay
      if (showHitboxesRef.current) {
        renderHitboxDebugOverlay({
          ctx,
          gameState: curState,
          terrain,
          terrainHitboxCanvas: buffers.terrainHitboxCanvas,
          waterLevel,
          width,
          height,
        });
      }

      ctx.restore();

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
        if (nowFps - lastFpsHudUpdateRef.current >= 250) {
          const instantFps = Math.round((fpsCounterFramesRef.current * 1000) / (nowFps - lastFpsHudUpdateRef.current));
          fpsCounterFramesRef.current = 0;
          lastFpsHudUpdateRef.current = nowFps;
          fpsTextRef.current.textContent = `${instantFps} FPS`;
          if (fpsDotRef.current) {
            fpsDotRef.current.className = `w-2 h-2 rounded-full ${
              instantFps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : instantFps >= 30 ? 'bg-amber-400' : 'bg-red-400'
            }`;
          }
          if (fpsBadgeRef.current) {
            fpsBadgeRef.current.className = `absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border rounded-lg text-xs font-mono font-black shadow-lg flex items-center gap-2 select-none z-20 ${
              instantFps >= 50 ? 'text-emerald-400 border-emerald-500/30' : instantFps >= 30 ? 'text-amber-300 border-amber-500/30' : 'text-red-400 border-red-500/30'
            }`;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [terrain, redrawTerrain, carveOffscreenCrater, triggerClientExplosion, triggerWaterSplash, getBuffers]);

  const handleCenterCamera = () => {
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(3.0, zoomRef.current * 1.25);
    zoomRef.current = newZoom;
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoomRef.current / 1.25);
    zoomRef.current = newZoom;
    setZoomLevel(newZoom);
  };

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
    >
      {/* Zero-Overhead In-Game Permanent FPS Counter HUD */}
      <div
        ref={fpsBadgeRef}
        style={{ display: perfTracker.getFpsHudEnabled() ? 'flex' : 'none' }}
        className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border border-emerald-500/30 rounded-lg text-xs font-mono font-black text-emerald-400 shadow-lg flex items-center gap-2 select-none z-20"
      >
        <span ref={fpsDotRef} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span ref={fpsTextRef}>60 FPS</span>
      </div>

      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Zoom & Pan Controls Widget in Bottom Right */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute right-3 bottom-3 z-20 flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 px-2 py-1 rounded-xl shadow-lg"
      >
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-black text-xs flex items-center justify-center transition active:scale-95"
          title="Dézoomer (- / Molette Bas)"
        >
          -
        </button>
        <button
          type="button"
          onClick={handleCenterCamera}
          className="px-2 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-bold text-[10px] flex items-center justify-center transition active:scale-95"
          title="Recentrer la vue & Zoom 100% (Touche C)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-6 h-6 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 font-black text-xs flex items-center justify-center transition active:scale-95"
          title="Zoomer (+ / Molette Haut)"
        >
          +
        </button>
      </div>
    </div>
  );
});

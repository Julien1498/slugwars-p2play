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
    (cx: number, cy: number, radius: number) => {
      const { width, height } = terrain.data;
      const r = Math.ceil(radius) + 8;
      const minX = Math.max(0, Math.floor(cx - r));
      const maxX = Math.min(width - 1, Math.ceil(cx + r));
      const minY = Math.max(0, Math.floor(cy - r));
      const maxY = Math.min(height - 1, Math.ceil(cy + r));
      redrawTerrain({ minX, maxX, minY, maxY });
    },
    [terrain.data, redrawTerrain]
  );

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

      const clamped = clampPanOffset({ x: newPanX, y: newPanY }, newZoom, rect.width, rect.height);
      zoomRef.current = newZoom;
      panRef.current = clamped;
      setZoomLevel(newZoom);
      setPanOffset(clamped);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

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
          rect.height
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
      const pos = getCanvasMousePos(e);
      lockedTargetRef.current = pos;
      sfx.play('tick');
    },
    [isMyTurn, gameState, getCanvasMousePos]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.button === 1 || e.button === 2) {
        isDraggingCameraRef.current = true;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartPanRef.current = { ...panRef.current };
        return;
      }

      if (!isMyTurn || e.button !== 0) return;
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

      if (gameState.phase === 'PLACEMENT') {
        onPlaceSlug?.({ x: mouseX, y: mouseY });
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
      if (!isInstantTarget) {
        const targetPt = lockedTargetRef.current || { x: mouseX, y: mouseY };
        onStartCharge?.(targetPt);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (e.button === 1 || e.button === 2) return;
      }

      if (!isMyTurn || gameState.phase !== 'AIMING' || e.button !== 0) return;
      const { x: clickX, y: clickY } = getCanvasMousePos(e);
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const targetPt = lockedTargetRef.current || { x: clickX, y: clickY };
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

    if (gameState.craters && gameState.craters.length > 0) {
      for (const c of gameState.craters) {
        if (!knownCraterIdsCanvasRef.current.has(c.id)) {
          knownCraterIdsCanvasRef.current.add(c.id);
          carveOffscreenCrater(c.x, c.y, c.radius);
        }
      }
    }

    for (const ex of gameState.explosions) {
      if (!carvedExplosionsRef.current.has(ex.id)) {
        carvedExplosionsRef.current.add(ex.id);
        carveOffscreenCrater(ex.x, ex.y, ex.radius);
        clientExplosionsRef.current.push({
          id: ex.id,
          x: ex.x,
          y: ex.y,
          radius: ex.radius,
          startTime: performance.now(),
          duration: 450,
        });
      }
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

      // 1. Sky & Atmosphere
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

      // 5. Decor Items & Landmines & Helicopters
      if (decorItems) {
        for (const item of decorItems) {
          if (item.destroyed) continue;
          if (item.type === 'hanging_leaf') {
            const topSolid = terrain.isSolid(item.x, item.y - 1) || terrain.isSolid(item.x, item.y - 2);
            if (!topSolid) {
              item.destroyed = true;
              continue;
            }
          }
        }
      }

      renderMines(ctx, curState.mines);
      renderHelicopters(ctx, curState.helicopters, curState, animTime, isMyTurnRef.current);
      renderTombstones(ctx, curState.slugs, waterLevel);

      // 6. Slugs, Ropes, Crates, Projectiles & Particles
      renderNinjaRopes(ctx, curState.slugs);
      renderAllSlugs({ ctx, gameState: curState, animTime, slugDeathTimestamps: slugDeathTimestampsRef.current });
      renderSupplyCrates(ctx, curState.supplyCrates);
      renderProjectiles({ ctx, projectiles: curState.projectiles || [], animTime });
      renderParticles(ctx, clientParticlesRef.current);
      renderClientExplosions(ctx, clientExplosionsRef.current);
      renderFloatingDamages(ctx, clientFloatingDamagesRef.current);

      // 7. Aim Guides & Holograms
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

      // 8. Foreground Ocean & Waves
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

      // 9. Debug Hitboxes
      if (showHitboxesRef.current && buffers.terrainHitboxCanvas) {
        ctx.drawImage(buffers.terrainHitboxCanvas, 0, 0);
      }

      ctx.restore();

      const renderDuration = performance.now() - renderStart;
      perfTracker.markFrame(renderDuration, {
        slugs: curState?.slugs?.length || 0,
        livingSlugs: curState?.slugs?.filter((s) => s.isAlive).length || 0,
        projectiles: curState?.projectiles?.length || 0,
        explosions: curState?.explosions?.length || 0,
        particles: curState?.particles?.length || 0,
        mines: curState?.mines?.length || 0,
        crates: curState?.supplyCrates?.length || 0,
      });

      // Permanent FPS HUD updater
      if (fpsTextRef.current && perfTracker.getFpsHudEnabled()) {
        const now = performance.now();
        fpsCounterFramesRef.current++;
        if (now - lastFpsHudUpdateRef.current >= 250) {
          const fps = Math.round((fpsCounterFramesRef.current * 1000) / (now - lastFpsHudUpdateRef.current));
          fpsCounterFramesRef.current = 0;
          lastFpsHudUpdateRef.current = now;
          fpsTextRef.current.textContent = `${fps} FPS`;
          if (fpsDotRef.current) {
            fpsDotRef.current.className = `w-2 h-2 rounded-full ${
              fps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : fps >= 30 ? 'bg-amber-400' : 'bg-red-400'
            }`;
          }
          if (fpsBadgeRef.current) {
            fpsBadgeRef.current.className = `absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border rounded-lg text-xs font-mono font-black shadow-lg flex items-center gap-2 select-none z-20 ${
              fps >= 50 ? 'text-emerald-400 border-emerald-500/30' : fps >= 30 ? 'text-amber-300 border-amber-500/30' : 'text-red-400 border-red-500/30'
            }`;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [terrain, redrawTerrain, carveOffscreenCrater, getBuffers]);

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl select-none"
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

      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-crosshair pointer-events-none" />

      {/* Modern Tactical Floating Camera Zoom & Center Widget */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 px-1.5 py-1 rounded-xl shadow-2xl select-none z-10 text-xs"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.max(0.5, Math.round((zoomLevel - 0.2) * 10) / 10);
            const container = containerRef.current;
            const rect = container ? container.getBoundingClientRect() : { width: 1400, height: 700 };
            const clamped = clampPanOffset(panRef.current, newZ, rect.width, rect.height);
            zoomRef.current = newZ;
            panRef.current = clamped;
            setZoomLevel(newZ);
            setPanOffset(clamped);
          }}
          className="w-6 h-6 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-white rounded-lg text-sm font-black border border-zinc-800 transition shadow-sm"
          title="Dézoomer (- / Molette Bas)"
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomRef.current = 1.0;
            panRef.current = { x: 0, y: 0 };
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2 h-6 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-cyan-300 hover:text-cyan-200 font-bold rounded-lg border border-zinc-800 transition text-[11px] font-mono shadow-sm"
          title="Recentrer la vue & Zoom 100% (Touche C)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.min(2.5, Math.round((zoomLevel + 0.2) * 10) / 10);
            const container = containerRef.current;
            const rect = container ? container.getBoundingClientRect() : { width: 1400, height: 700 };
            const clamped = clampPanOffset(panRef.current, newZ, rect.width, rect.height);
            zoomRef.current = newZ;
            panRef.current = clamped;
            setZoomLevel(newZ);
            setPanOffset(clamped);
          }}
          className="w-6 h-6 flex items-center justify-center bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 text-zinc-300 hover:text-white rounded-lg text-sm font-black border border-zinc-800 transition shadow-sm"
          title="Zoomer (+ / Molette Haut)"
        >
          +
        </button>
      </div>
    </div>
  );
});

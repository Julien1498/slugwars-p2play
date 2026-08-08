import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { sfx } from '../../core/audio';
import { renderBackground } from './canvas/renderBackground';
import { renderEntities } from './canvas/renderEntities';
import { renderLightmap } from './canvas/renderLightmap';

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire?: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onUpdateAim?: (aimAngle: number, aimPower: number, facing: 'left' | 'right') => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = ({
  gameState,
  terrain,
  isMyTurn,
  showHitboxes = false,
  onFire,
  onPlaceSlug,
  onUpdateAim,
  onStartCharge,
  onReleaseCharge,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const occlusionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef<Vector2D>({ x: 0, y: 0 });
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const lastAimTimeRef = useRef<number>(0);

  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);

  useEffect(() => {
    zoomRef.current = zoomLevel;
  }, [zoomLevel]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoomLevel((z) => Math.max(0.5, Math.min(1.5, Math.round((z + delta) * 10) / 10)));
  }, []);

  const rectRef = useRef<DOMRect | null>(null);

  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      rectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    updateCanvasRect();
    window.addEventListener('resize', updateCanvasRect);
    window.addEventListener('scroll', updateCanvasRect, true);
    return () => {
      window.removeEventListener('resize', updateCanvasRect);
      window.removeEventListener('scroll', updateCanvasRect, true);
    };
  }, [updateCanvasRect]);

  const getCanvasMousePos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Vector2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      if (!rectRef.current) {
        rectRef.current = canvas.getBoundingClientRect();
      }
      const rect = rectRef.current;

      const canvasWidth = terrain.data.width;
      const canvasHeight = terrain.data.height;

      const canvasAspect = canvasWidth / canvasHeight;
      const rectAspect = rect.width / rect.height;

      let drawWidth = rect.width;
      let drawHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (rectAspect > canvasAspect) {
        drawWidth = rect.height * canvasAspect;
        offsetX = (rect.width - drawWidth) / 2;
      } else {
        drawHeight = rect.width / canvasAspect;
        offsetY = (rect.height - drawHeight) / 2;
      }

      const clientX = e.clientX - rect.left - offsetX;
      const clientY = e.clientY - rect.top - offsetY;

      const mouseX = Math.max(0, Math.min(canvasWidth, (clientX / drawWidth) * canvasWidth));
      const mouseY = Math.max(0, Math.min(canvasHeight, (clientY / drawHeight) * canvasHeight));

      return { x: Math.round(mouseX), y: Math.round(mouseY) };
    },
    [terrain]
  );

  const redrawOffscreenTerrain = useCallback(() => {
    const { width, height } = terrain.data;
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    if (offCanvas.width !== width || offCanvas.height !== height) {
      offCanvas.width = width;
      offCanvas.height = height;
    }
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    terrain.drawTerrainToCanvas(offCtx);
  }, [terrain]);

  useEffect(() => {
    redrawOffscreenTerrain();
  }, [redrawOffscreenTerrain]);

  const carveOffscreenCrater = useCallback(
    (x: number, y: number, radius: number) => {
      const offCanvas = offscreenCanvasRef.current;
      if (!offCanvas) return;
      const offCtx = offCanvas.getContext('2d');
      if (!offCtx) return;

      offCtx.save();
      offCtx.globalCompositeOperation = 'destination-out';
      offCtx.beginPath();
      offCtx.arc(x, y, radius, 0, Math.PI * 2);
      offCtx.fill();
      offCtx.restore();

      terrain.carveExplosion(x, y, radius);
      redrawOffscreenTerrain();
    },
    [terrain, redrawOffscreenTerrain]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      if (!isMyTurn || (gameState.phase !== 'AIMING' && gameState.phase !== 'TURN_TIME')) return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const now = Date.now();
      if (now - lastAimTimeRef.current < 33) return;

      const dx = pos.x - activeSlug.x;
      const dy = pos.y - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(5, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

      if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        lastAimTimeRef.current = now;
        onUpdateAim?.(angle, activeSlug.aimPower, facing);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onUpdateAim]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || e.button !== 0) return;
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

      if (gameState.phase === 'PLACEMENT') {
        onPlaceSlug?.({ x: mouseX, y: mouseY });
        return;
      }

      if (gameState.phase !== 'AIMING' && gameState.phase !== 'TURN_TIME') return;
      onStartCharge?.({ x: mouseX, y: mouseY });
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || (gameState.phase !== 'AIMING' && gameState.phase !== 'TURN_TIME') || e.button !== 0) return;
      const { x: clickX, y: clickY } = getCanvasMousePos(e);
      onReleaseCharge?.({ x: clickX, y: clickY });
    },
    [isMyTurn, gameState, getCanvasMousePos, onReleaseCharge]
  );

  useEffect(() => {
    if (gameState.explosions.length === 0 && carvedExplosionsRef.current.size > 0) {
      carvedExplosionsRef.current.clear();
      redrawOffscreenTerrain();
    }

    for (const ex of gameState.explosions) {
      if (!carvedExplosionsRef.current.has(ex.id)) {
        carvedExplosionsRef.current.add(ex.id);
        carveOffscreenCrater(ex.x, ex.y, ex.radius);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const { width, height } = terrain.data;
      ctx.clearRect(0, 0, width, height);

      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      renderBackground(ctx, gameState, terrain.data, animTime, slowTime);

      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      renderLightmap(ctx, gameState, terrain.data, lightmapCanvasRef, occlusionCanvasRef);
      renderEntities(ctx, gameState, terrain.data, animTime, isMyTurn, mousePosRef.current, showHitboxes ?? false);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState, terrain, isMyTurn, showHitboxes, redrawOffscreenTerrain, carveOffscreenCrater]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={terrain.data.width}
        height={terrain.data.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.15s ease-out',
        }}
        className="w-full h-full object-contain cursor-crosshair block shadow-2xl"
      />

      <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1.5 rounded-xl shadow-xl backdrop-blur select-none z-10">
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Dézoomer"
        >
          -
        </button>
        <button
          onClick={() => setZoomLevel(1.0)}
          className="px-2 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 font-mono text-xs font-bold rounded-lg border border-zinc-600/50 transition"
          title="Zoom 100%"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.5, Math.round((z + 0.1) * 10) / 10))}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Zoomer"
        >
          +
        </button>
      </div>
    </div>
  );
};

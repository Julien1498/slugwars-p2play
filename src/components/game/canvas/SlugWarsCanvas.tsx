import React, { useRef, useEffect } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { perfTracker } from '../../../core/perfTracker';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { useFpsHud } from './useFpsHud';
import { useCanvasCamera } from './useCanvasCamera';
import { useCanvasTouchGestures } from './useCanvasTouchGestures';
import { useCanvasMouseControls } from './useCanvasMouseControls';
import { useCanvasRenderLoop } from './useCanvasRenderLoop';
import { screenToWorldCoords } from '../../../rendering/cameraUtils';

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
  onDetonate?: () => void;
  onDevClick?: (pos: Vector2D) => void;
  activeDevTool?: string | null;
}

const SlugWarsCanvasComponent: React.FC<SlugWarsCanvasProps> = ({
  gameState, terrain, isMyTurn, showHitboxes = false, onFire, onPlaceSlug,
  onSelectPlacementPoint, pendingPlacementPoint, onStartCharge, onReleaseCharge,
  onUpdateAim, onDetonate, onDevClick, activeDevTool,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const containerRectRef = useRef<{ width: number; height: number }>({ width: 1400, height: 700 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const actionCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const gameStateRef = useRef(gameState); gameStateRef.current = gameState;
  const isMyTurnRef = useRef(isMyTurn); isMyTurnRef.current = isMyTurn;
  const showHitboxesRef = useRef(showHitboxes); showHitboxesRef.current = showHitboxes;
  const onPlaceSlugRef = useRef(onPlaceSlug); onPlaceSlugRef.current = onPlaceSlug;
  const onSelectPlacementPointRef = useRef(onSelectPlacementPoint); onSelectPlacementPointRef.current = onSelectPlacementPoint;
  const onUpdateAimRef = useRef(onUpdateAim); onUpdateAimRef.current = onUpdateAim;

  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const lockedTargetRef = useRef<Vector2D | null>(null);
  const isDevPaintingRef = useRef<boolean>(false);
  const lastDevPaintPosRef = useRef<Vector2D | null>(null);
  const isTouch = useIsTouchDevice();

  // Zero-Reflow Container Resize Observer
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

  // 1. Hardware Profiler & FPS HUD Hook
  const { fpsBadgeRef, fpsTextRef, fpsDetailsRef, fpsPassesRef, fpsDotRef, updateFpsHud } = useFpsHud();

  // 2. Action Camera & Zoom Hook
  const {
    zoomRef,
    panRef,
    isDraggingCameraRef,
    didDragCameraRef,
    dragStartMouseRef,
    dragStartPanRef,
    targetCameraPanRef,
    cameraModeRef,
    lastTouchTimeRef,
  } = useCanvasCamera({
    containerRef,
    terrain,
    gameState,
    isTouch,
  });

  // 3. Multi-Touch Gestures Hook
  const { touchGestureRef } = useCanvasTouchGestures({
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
  });

  // 4. Mouse Controls Hook
  const {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
  } = useCanvasMouseControls({
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
    onDetonate,
  });

  // 5. Canvas Render Loop Hook
  useCanvasRenderLoop({
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
  });

  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none', contain: 'layout paint size' }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair select-none"
      onMouseDown={(e) => {
        if (activeDevTool && onDevClick && e.button === 0) {
          isDevPaintingRef.current = true;
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const worldPos = screenToWorldCoords(e.clientX, e.clientY, rect, terrain.data.width, terrain.data.height, zoomRef.current, panRef.current);
            lastDevPaintPosRef.current = worldPos;
            onDevClick(worldPos);
            return;
          }
        }
        handleMouseDown(e);
      }}
      onMouseUp={(e) => {
        isDevPaintingRef.current = false;
        lastDevPaintPosRef.current = null;
        if (activeDevTool && e.button === 0) return;
        handleMouseUp(e);
      }}
      onMouseLeave={() => {
        isDevPaintingRef.current = false;
        lastDevPaintPosRef.current = null;
      }}
      onMouseMove={(e) => {
        if (isDevPaintingRef.current && (activeDevTool === 'dig_terrain' || activeDevTool === 'build_terrain') && onDevClick) {
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const worldPos = screenToWorldCoords(e.clientX, e.clientY, rect, terrain.data.width, terrain.data.height, zoomRef.current, panRef.current);
            const lastPos = lastDevPaintPosRef.current;
            if (!lastPos || Math.hypot(worldPos.x - lastPos.x, worldPos.y - lastPos.y) >= 6) {
              lastDevPaintPosRef.current = worldPos;
              onDevClick(worldPos);
            }
          }
        }
        handleMouseMove(e);
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Zero-Overhead In-Game Hardware Profiler & FPS Counter HUD */}
      <div
        ref={fpsBadgeRef}
        style={{ display: perfTracker.getFpsHudEnabled() ? 'flex' : 'none' }}
        className={`absolute top-16 right-4 pointer-events-none ${perfTracker.getFpsHudAdvancedEnabled() ? 'px-3 py-1.5 rounded-2xl flex-col gap-0.5' : 'px-2.5 py-1 rounded-xl flex-row items-center gap-1.5'} bg-zinc-950/90 backdrop-blur-md border border-emerald-500/30 text-xs font-mono text-emerald-400 shadow-2xl flex select-none z-20`}
      >
        <div className="flex items-center gap-1.5">
          <span ref={fpsDotRef} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          <span ref={fpsTextRef} className="font-bold text-white">60 FPS</span>
          <span ref={fpsDetailsRef} style={{ display: perfTracker.getFpsHudAdvancedEnabled() ? 'inline' : 'none' }} className="text-[10px] text-zinc-400 font-normal">
            (16.6ms) · Dessin: 1.0ms
          </span>
        </div>
        <div ref={fpsPassesRef} style={{ display: perfTracker.getFpsHudAdvancedEnabled() ? 'block' : 'none' }} className="text-[10px] text-cyan-300/90 font-mono tracking-tight">
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
  return (
    prev.gameState === next.gameState &&
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

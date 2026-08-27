import { useRef, useEffect, useCallback } from 'react';
import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { clampPanOffset, calculateFocalZoom } from '../../../rendering/cameraUtils';

export interface UseCanvasCameraProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  terrain: DestructibleTerrain;
  gameState: GameState;
  isTouch: boolean;
}

export function useCanvasCamera({
  containerRef,
  terrain,
  gameState,
  isTouch,
}: UseCanvasCameraProps) {
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

  const lastTouchTimeRef = useRef<number>(0);
  const lastCenteredSlugIdRef = useRef<string | null>(null);

  const centerOnSlugPos = useCallback((slugX: number, slugY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const fitScale = Math.min(rect.width / terrain.data.width, rect.height / terrain.data.height);
    const totalScale = fitScale * zoomRef.current;
    const targetPanX = -(slugX - terrain.data.width / 2) * totalScale;
    const targetPanY = -(slugY - terrain.data.height / 2) * totalScale;
    const clamped = clampPanOffset(
      { x: targetPanX, y: targetPanY },
      zoomRef.current,
      rect.width,
      rect.height,
      terrain.data.width,
      terrain.data.height
    );
    targetCameraPanRef.current = clamped;
  }, [containerRef, terrain.data.width, terrain.data.height]);

  // Mouse wheel zoom with focal invariant at cursor
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const minZoom = isTouch ? 0.75 : 0.5;

      const rect = container.getBoundingClientRect();
      const mouseRelX = e.clientX - rect.left - rect.width / 2;
      const mouseRelY = e.clientY - rect.top - rect.height / 2;

      const { newZoom, newPan } = calculateFocalZoom(
        zoomRef.current,
        zoomFactor,
        { x: mouseRelX, y: mouseRelY },
        panRef.current,
        minZoom,
        3.0
      );

      const clamped = clampPanOffset(
        newPan,
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
  }, [containerRef, isTouch, terrain.data.width, terrain.data.height]);

  // Auto-center camera only when active slug actually changes to a newly placed slug
  useEffect(() => {
    if (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT') {
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && activeSlug.isPlaced && activeSlug.x > 0 && activeSlug.y > 0) {
        if (lastCenteredSlugIdRef.current !== activeSlug.id) {
          lastCenteredSlugIdRef.current = activeSlug.id;
          cameraModeRef.current = 'FOLLOW_SLUG';
          centerOnSlugPos(activeSlug.x, activeSlug.y);
        }
      }
    } else if (gameState.phase === 'PLACEMENT') {
      lastCenteredSlugIdRef.current = null;
      targetCameraPanRef.current = null;
    }
  }, [gameState.activeSlugId, gameState.phase, gameState.slugs, centerOnSlugPos]);

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
        if (activeSlug && activeSlug.isPlaced) {
          centerOnSlugPos(activeSlug.x, activeSlug.y);
        }
      }
    };

    const handleRecenterEvent = () => {
      cameraModeRef.current = 'FOLLOW_SLUG';
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && activeSlug.isPlaced) {
        centerOnSlugPos(activeSlug.x, activeSlug.y);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('slugwars:recenter-camera', handleRecenterEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('slugwars:recenter-camera', handleRecenterEvent);
    };
  }, [gameState.slugs, gameState.activeSlugId, centerOnSlugPos]);

  const handleCenterCamera = useCallback(() => {
    zoomRef.current = 1.0;
    panRef.current = { x: 0, y: 0 };
  }, []);

  const handleZoomIn = useCallback(() => {
    zoomRef.current = Math.min(3.0, zoomRef.current * 1.25);
  }, []);

  const handleZoomOut = useCallback(() => {
    zoomRef.current = Math.max(0.5, zoomRef.current / 1.25);
  }, []);

  return {
    zoomRef,
    panRef,
    isDraggingCameraRef,
    didDragCameraRef,
    dragStartMouseRef,
    dragStartPanRef,
    targetCameraPanRef,
    cameraModeRef,
    lastTouchTimeRef,
    handleCenterCamera,
    handleZoomIn,
    handleZoomOut,
    centerOnSlugPos,
  };
}

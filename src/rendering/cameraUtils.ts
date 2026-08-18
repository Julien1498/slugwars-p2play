import { Vector2D } from '../core/types';

export interface ViewportRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CameraState {
  pan: Vector2D;
  targetPan: Vector2D;
  zoom: number;
  targetZoom: number;
}

/**
 * Converts screen/pointer coordinates to World coordinates matching SlugWars viewport matrix.
 */
export function screenToWorldCoords(
  clientX: number,
  clientY: number,
  canvasRect: { left: number; top: number; width: number; height: number },
  terrainWidth: number,
  terrainHeight: number,
  zoom: number,
  pan: Vector2D
): Vector2D {
  const fitScale = Math.min(canvasRect.width / terrainWidth, canvasRect.height / terrainHeight);
  const totalScale = fitScale * zoom;
  const centerX = canvasRect.left + canvasRect.width / 2 + pan.x;
  const centerY = canvasRect.top + canvasRect.height / 2 + pan.y;

  const x = (clientX - centerX) / totalScale + terrainWidth / 2;
  const y = (clientY - centerY) / totalScale + terrainHeight / 2;
  return { x, y };
}

/**
 * Clamps pan offset so camera can smoothly navigate the entire terrain on mobile and desktop.
 */
export function clampPanOffset(
  pan: Vector2D,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  terrainWidth = 1400,
  terrainHeight = 700
): Vector2D {
  const fitScale = Math.min(viewportWidth / terrainWidth, viewportHeight / terrainHeight);
  const totalScale = fitScale * zoom;
  const renderedW = terrainWidth * totalScale;
  const renderedH = terrainHeight * totalScale;

  const maxPanX = Math.max(viewportWidth * 0.5, (renderedW / 2) + viewportWidth * 0.25);
  const maxPanY = Math.max(viewportHeight * 0.5, (renderedH / 2) + viewportHeight * 0.25);

  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, pan.x)),
    y: Math.max(-maxPanY, Math.min(maxPanY, pan.y)),
  };
}

/**
 * Converts screen/pointer coordinates to World coordinates given camera pan and zoom.
 */
export function screenToWorld(
  clientX: number,
  clientY: number,
  canvasRect: ViewportRect,
  pan: Vector2D,
  zoom: number
): Vector2D {
  const relX = clientX - canvasRect.left;
  const relY = clientY - canvasRect.top;
  const centerX = canvasRect.width / 2;
  const centerY = canvasRect.height / 2;

  const worldX = (relX - centerX) / zoom - pan.x;
  const worldY = (relY - centerY) / zoom - pan.y;
  return { x: worldX, y: worldY };
}

/**
 * Converts World coordinates to Canvas screen coordinates.
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  canvasRect: { width: number; height: number },
  pan: Vector2D,
  zoom: number
): Vector2D {
  const centerX = canvasRect.width / 2;
  const centerY = canvasRect.height / 2;

  const screenX = (worldX + pan.x) * zoom + centerX;
  const screenY = (worldY + pan.y) * zoom + centerY;
  return { x: screenX, y: screenY };
}

/**
 * Cycles through valid girder placement orientations (0° -> 45° -> 90° -> 135°).
 */
export function getNextGirderAngle(currentAngle: number): number {
  const angles = [0, 45, 90, 135];
  const curIdx = angles.indexOf(currentAngle);
  return angles[(curIdx + 1) % angles.length];
}

/**
 * Linearly interpolates camera position smoothly towards a target.
 */
export function lerpCamera(current: Vector2D, target: Vector2D, factor: number = 0.08): Vector2D {
  return {
    x: current.x + (target.x - current.x) * factor,
    y: current.y + (target.y - current.y) * factor,
  };
}

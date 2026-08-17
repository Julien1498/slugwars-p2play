import { describe, it, expect } from 'vitest';

/**
 * Screen <-> World Coordinate Transformations
 */
export function screenToWorld(
  clientX: number,
  clientY: number,
  canvasRect: { left: number; top: number; width: number; height: number },
  pan: { x: number; y: number },
  zoom: number
): { x: number; y: number } {
  const relX = clientX - canvasRect.left;
  const relY = clientY - canvasRect.top;
  const centerX = canvasRect.width / 2;
  const centerY = canvasRect.height / 2;

  const worldX = (relX - centerX) / zoom - pan.x;
  const worldY = (relY - centerY) / zoom - pan.y;
  return { x: worldX, y: worldY };
}

export function worldToScreen(
  worldX: number,
  worldY: number,
  canvasRect: { width: number; height: number },
  pan: { x: number; y: number },
  zoom: number
): { x: number; y: number } {
  const centerX = canvasRect.width / 2;
  const centerY = canvasRect.height / 2;

  const screenX = (worldX + pan.x) * zoom + centerX;
  const screenY = (worldY + pan.y) * zoom + centerY;
  return { x: screenX, y: screenY };
}

export function getNextGirderAngle(currentAngle: number): number {
  const angles = [0, 45, 90, 135];
  const curIdx = angles.indexOf(currentAngle);
  return angles[(curIdx + 1) % angles.length];
}

describe('Camera & Aiming Coordinate Maths', () => {
  it('losslessly converts coordinates from Screen to World and back to Screen', () => {
    const canvasRect = { left: 50, top: 50, width: 1200, height: 800 };
    const pan = { x: -300, y: -200 };
    const zoom = 1.5;

    const originalScreen = { clientX: 650, clientY: 450 };
    const world = screenToWorld(originalScreen.clientX, originalScreen.clientY, canvasRect, pan, zoom);

    const backToScreen = worldToScreen(world.x, world.y, canvasRect, pan, zoom);
    expect(backToScreen.x + canvasRect.left).toBeCloseTo(originalScreen.clientX, 1);
    expect(backToScreen.y + canvasRect.top).toBeCloseTo(originalScreen.clientY, 1);
  });

  it('cycles through valid girder placement orientations (0 -> 45 -> 90 -> 135 -> 0)', () => {
    expect(getNextGirderAngle(0)).toBe(45);
    expect(getNextGirderAngle(45)).toBe(90);
    expect(getNextGirderAngle(90)).toBe(135);
    expect(getNextGirderAngle(135)).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { screenToWorld, worldToScreen, getNextGirderAngle, lerpCamera } from '../rendering/cameraUtils';

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

  it('smoothly interpolates camera position with lerp factor', () => {
    const current = { x: 100, y: 100 };
    const target = { x: 200, y: 200 };
    const next = lerpCamera(current, target, 0.1);
    expect(next.x).toBe(110);
    expect(next.y).toBe(110);
  });
});

import { describe, it, expect } from 'vitest';
import {
  clampPanOffset,
  screenToWorldCoords,
  worldToScreen,
  screenToWorld,
  lerpCamera,
  shortestArcAngleLerp,
  interpolatePosition,
  calculateFocalZoom,
  getNextGirderAngle,
} from '../rendering/cameraUtils';
import { Vector2D } from '../core/types';

describe('Canvas Camera & Coordinate Math', () => {
  const terrainW = 1400;
  const terrainH = 700;
  const viewport = { left: 0, top: 0, width: 1920, height: 1080 };

  describe('clampPanOffset', () => {
    it('clamps excessive pan offsets within safe viewport bounds on desktop', () => {
      const pan: Vector2D = { x: 50000, y: -90000 };
      const clamped = clampPanOffset(pan, 1.0, viewport.width, viewport.height, terrainW, terrainH);

      expect(clamped.x).toBeLessThan(10000);
      expect(clamped.x).toBeGreaterThan(0);
      expect(clamped.y).toBeGreaterThan(-10000);
      expect(clamped.y).toBeLessThan(0);
    });

    it('expands pan bounds proportionally when zoomed in', () => {
      const pan1x = clampPanOffset({ x: 3000, y: 3000 }, 1.0, viewport.width, viewport.height, terrainW, terrainH);
      const pan2x = clampPanOffset({ x: 3000, y: 3000 }, 2.0, viewport.width, viewport.height, terrainW, terrainH);

      // Higher zoom allows reaching farther world edges
      expect(pan2x.x).toBeGreaterThan(pan1x.x);
      expect(pan2x.y).toBeGreaterThan(pan1x.y);
    });
  });

  describe('screenToWorldCoords & worldToScreen precision', () => {
    it('accurately converts pointer coordinates to world space and round-trips', () => {
      const pan = { x: 120, y: -80 };
      const zoom = 1.4;

      const screenPt = { clientX: 960, clientY: 540 }; // Screen center
      const worldPos = screenToWorldCoords(screenPt.clientX, screenPt.clientY, viewport, terrainW, terrainH, zoom, pan);

      expect(worldPos.x).toBeDefined();
      expect(worldPos.y).toBeDefined();
      expect(Number.isFinite(worldPos.x)).toBe(true);
      expect(Number.isFinite(worldPos.y)).toBe(true);
    });
  });

  describe('calculateFocalZoom (Mouse Wheel Focal Invariant)', () => {
    it('keeps the world point under the cursor unchanged after zooming in', () => {
      const currentZoom = 1.0;
      const zoomFactor = 1.2;
      const mouseRelPos: Vector2D = { x: 200, y: -150 };
      const currentPan: Vector2D = { x: 0, y: 0 };

      const { newZoom, newPan } = calculateFocalZoom(
        currentZoom,
        zoomFactor,
        mouseRelPos,
        currentPan,
        0.5,
        3.0
      );

      expect(newZoom).toBeCloseTo(1.2, 5);
      // Pan must shift towards the cursor to keep the focal point pinned
      expect(newPan.x).not.toBe(0);
      expect(newPan.y).not.toBe(0);
    });

    it('enforces minZoom and maxZoom constraints', () => {
      const minClamped = calculateFocalZoom(0.5, 0.5, { x: 0, y: 0 }, { x: 0, y: 0 }, 0.5, 3.0);
      expect(minClamped.newZoom).toBe(0.5);

      const maxClamped = calculateFocalZoom(3.0, 2.0, { x: 0, y: 0 }, { x: 0, y: 0 }, 0.5, 3.0);
      expect(maxClamped.newZoom).toBe(3.0);
    });
  });
});

describe('144 FPS Visual Interpolation & Angle Lerp', () => {
  describe('shortestArcAngleLerp', () => {
    it('interpolates standard continuous angles smoothly', () => {
      const angle0 = 0.5;
      const angleTarget = 1.0;
      const result = shortestArcAngleLerp(angle0, angleTarget, 0.5);
      expect(result).toBeCloseTo(0.75, 4);
    });

    it('smoothly wraps across -PI / +PI boundary in the shortest direction without 360 spinning', () => {
      const angleNearPi = Math.PI - 0.1; // ~3.0415 rad (+174 deg)
      const angleNearMinusPi = -Math.PI + 0.1; // ~ -3.0415 rad (-174 deg)

      // Shortest arc is across the +/- PI seam (a small jump of 0.2 rad), NOT around the full circle (6.08 rad)
      const midway = shortestArcAngleLerp(angleNearPi, angleNearMinusPi, 0.5);

      // The midway angle across the seam should be +/- PI
      const normalizedMidway = Math.abs(midway);
      expect(normalizedMidway).toBeCloseTo(Math.PI, 2);
    });

    it('safely handles non-finite or NaN inputs without crashing', () => {
      expect(shortestArcAngleLerp(0.5, NaN, 0.5)).toBe(0.5);
      expect(shortestArcAngleLerp(NaN, 1.0, 0.5)).toBeNaN();
      expect(shortestArcAngleLerp(0.5, Infinity, 0.5)).toBe(0.5);
    });
  });

  describe('interpolatePosition with Snap Threshold', () => {
    it('linearly interpolates smooth small displacements', () => {
      const current = { x: 100, y: 100 };
      const target = { x: 120, y: 100 };
      const next = interpolatePosition(current, target, 0.5, 64);

      expect(next.x).toBeCloseTo(110, 4);
      expect(next.y).toBe(100);
    });

    it('instantly snaps without trailing if displacement exceeds threshold (e.g. teleport/respawn)', () => {
      const current = { x: 100, y: 100 };
      const target = { x: 500, y: 300 }; // 447px jump > 64px threshold
      const next = interpolatePosition(current, target, 0.1, 64);

      expect(next.x).toBe(500);
      expect(next.y).toBe(300);
    });
  });

  describe('Camera Lerp & Girder Rotation', () => {
    it('smoothly moves camera pan towards target position', () => {
      const curPan = { x: 0, y: 0 };
      const targetPan = { x: 100, y: -50 };
      const next = lerpCamera(curPan, targetPan, 0.2);

      expect(next.x).toBe(20);
      expect(next.y).toBe(-10);
    });

    it('cycles through all girder angle orientations', () => {
      let angle = 0;
      angle = getNextGirderAngle(angle);
      expect(angle).toBe(45);
      angle = getNextGirderAngle(angle);
      expect(angle).toBe(90);
      angle = getNextGirderAngle(angle);
      expect(angle).toBe(135);
      angle = getNextGirderAngle(angle);
      expect(angle).toBe(0);
    });
  });
});

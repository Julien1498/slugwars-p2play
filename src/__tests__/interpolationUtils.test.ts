import { describe, it, expect } from 'vitest';
import { shortestArcAngleLerp, interpolatePosition } from '../rendering/interpolationUtils';

describe('Shared Interpolation Utilities', () => {
  it('shortestArcAngleLerp interpolates angles along shortest circular arc', () => {
    // 0 to PI/2 with t=0.5 -> PI/4
    const mid = shortestArcAngleLerp(0, Math.PI / 2, 0.5);
    expect(mid).toBeCloseTo(Math.PI / 4);

    // Near wrap-around (-PI + 0.1 to PI - 0.1)
    const wrap = shortestArcAngleLerp(-Math.PI + 0.1, Math.PI - 0.1, 0.5);
    expect(Math.abs(wrap)).toBeCloseTo(Math.PI, 1);
  });

  it('interpolatePosition blends 2D points smoothly within snap threshold', () => {
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 120, y: 140 };

    const mid = interpolatePosition(p1, p2, 0.5);
    expect(mid.x).toBe(110);
    expect(mid.y).toBe(120);
  });

  it('interpolatePosition snaps instantly if displacement exceeds maxSnapDist', () => {
    const p1 = { x: 100, y: 100 };
    const p2 = { x: 300, y: 400 };

    const snapped = interpolatePosition(p1, p2, 0.5, 64);
    expect(snapped.x).toBe(300);
    expect(snapped.y).toBe(400);
  });
});

import { describe, it, expect, vi } from 'vitest';
import { drawRoundRect, drawSafeEllipse } from '../rendering/canvasGeometry';

describe('Shared Canvas Geometry Helpers', () => {
  const createMockContext = () => {
    return {
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arcTo: vi.fn(),
      closePath: vi.fn(),
      ellipse: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  };

  it('drawRoundRect traces rounded rectangle path with clamped radii', () => {
    const ctx = createMockContext();
    drawRoundRect(ctx, 10, 20, 100, 50, 15);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    expect(ctx.quadraticCurveTo).toHaveBeenCalledTimes(4);
    expect(ctx.closePath).toHaveBeenCalled();
  });

  it('drawSafeEllipse falls back gracefully if radius is near zero or negative', () => {
    const ctx = createMockContext();
    drawSafeEllipse(ctx, 100, 100, 20, 15, 0);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.ellipse).toHaveBeenCalledWith(100, 100, 20, 15, 0, 0, Math.PI * 2);
  });
});

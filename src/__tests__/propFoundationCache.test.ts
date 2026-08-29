import { describe, it, expect, vi } from 'vitest';
import { SolidProp } from '../core/types';
import { renderHDDestructibleProp } from '../rendering/renderProps';

describe('propFoundationCache: WeakMap Cache & Terrain Revision Invalidation', () => {
  const createMockContext = () => {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D;
  };

  const createSolidGrid = (width = 1400, height = 800) => {
    const grid = new Uint8Array(width * height);
    grid.fill(1); // solid everywhere
    return grid;
  };

  const createProp = (type = 'bunker'): SolidProp => ({
    id: 'prop_test_1',
    type: type as any,
    x: 300,
    y: 400,
    width: 40,
    height: 30,
    destroyed: false,
  });

  it('renders solid prop and caches foundation solid state on identical terrain revision', () => {
    const ctx = createMockContext();
    const grid = createSolidGrid();
    const prop = createProp();

    // First render pass (terrain revision = 1)
    renderHDDestructibleProp(ctx, prop, undefined, undefined, 0, grid, 1400, 1);
    expect(ctx.save).toHaveBeenCalled();
    const saveCallsFirst = (ctx.save as any).mock.calls.length;
    expect(saveCallsFirst).toBeGreaterThan(0);

    // Second render pass with SAME terrain revision (revision = 1)
    renderHDDestructibleProp(ctx, prop, undefined, undefined, 0, grid, 1400, 1);
    const saveCallsSecond = (ctx.save as any).mock.calls.length;
    expect(saveCallsSecond).toBe(saveCallsFirst * 2);
  });

  it('invalidates and recomputes foundation when terrain revision increases after an explosion', () => {
    const ctx = createMockContext();
    const grid = createSolidGrid();
    const prop = createProp();

    // First render at revision 1
    renderHDDestructibleProp(ctx, prop, undefined, undefined, 0, grid, 1400, 1);

    // Second render after crater carved (revision = 2)
    renderHDDestructibleProp(ctx, prop, undefined, undefined, 0, grid, 1400, 2);
    expect(ctx.save).toHaveBeenCalledTimes(2);
  });

  it('does not render prop if foundation is lost (e.g. empty air grid under prop)', () => {
    const ctx = createMockContext();
    const emptyGrid = new Uint8Array(1400 * 800); // 0 = empty air
    const prop = createProp();

    renderHDDestructibleProp(ctx, prop, undefined, undefined, 0, emptyGrid, 1400, 1);
    expect(prop.destroyed).toBe(true);
    expect(ctx.save).not.toHaveBeenCalled();
  });
});

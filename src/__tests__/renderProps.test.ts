import { describe, it, expect, vi } from 'vitest';
import { getPixelHash, renderHDDestructibleGirder, renderHDDestructibleProp } from '../rendering/renderProps';
import { PlacedGirder, SolidProp, CraterRecord, ExplosionEvent } from '../core/types';

// Polyfill Path2D for headless test environment if not present
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class MockPath2D {
    rect = vi.fn();
    arc = vi.fn();
    moveTo = vi.fn();
    lineTo = vi.fn();
    quadraticCurveTo = vi.fn();
    closePath = vi.fn();
    ellipse = vi.fn();
  };
}

describe('RenderProps - Pixel Hash & Determinism', () => {
  it('returns a positive 32-bit unsigned integer', () => {
    const h1 = getPixelHash(100, 200);
    const h2 = getPixelHash(-50, -100);
    const h3 = getPixelHash(0, 0);

    expect(h1).toBeGreaterThanOrEqual(0);
    expect(h1).toBeLessThan(4294967296);
    expect(h2).toBeGreaterThanOrEqual(0);
    expect(h3).toBeGreaterThanOrEqual(0);
  });

  it('is completely deterministic for identical coordinates', () => {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        expect(getPixelHash(x * 13, y * 27)).toBe(getPixelHash(x * 13, y * 27));
      }
    }
  });

  it('provides good hash dispersion for neighboring coordinates', () => {
    const hashA = getPixelHash(100, 100);
    const hashB = getPixelHash(101, 100);
    const hashC = getPixelHash(100, 101);

    expect(hashA).not.toBe(hashB);
    expect(hashA).not.toBe(hashC);
    expect(hashB).not.toBe(hashC);
  });
});

describe('RenderProps - Canvas Context Drawing & Safe Execution', () => {
  // Helper to create a comprehensive mock CanvasRenderingContext2D
  const createMockContext = () => {
    const gradientMock = {
      addColorStop: vi.fn(),
    };
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      createLinearGradient: vi.fn(() => gradientMock),
      createRadialGradient: vi.fn(() => gradientMock),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      shadowColor: 'transparent',
      shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D;
  };

  const grid = new Uint8Array(1400 * 800);
  grid.fill(1); // Solid terrain foundation
  const craters: CraterRecord[] = [
    { id: 'c1', x: 200, y: 150, radius: 25, createdAt: Date.now() },
  ];
  const explosions: ExplosionEvent[] = [
    { id: 'e1', x: 210, y: 145, radius: 30, damage: 40, createdAt: Date.now() },
  ];

  describe('renderHDDestructibleGirder', () => {
    it('draws a girder at 0° horizontal orientation without errors', () => {
      const ctx = createMockContext();
      const girder: PlacedGirder = {
        id: 'g1',
        x: 200,
        y: 150,
        angleDeg: 0,
        length: 80,
        thickness: 12,
        destroyed: false,
      };

      expect(() => {
        renderHDDestructibleGirder(ctx, girder, craters, explosions, grid, 1400, 0);
      }).not.toThrow();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('draws angled girders at 45°, 90°, and 135°', () => {
      for (const angle of [45, 90, 135]) {
        const ctx = createMockContext();
        const girder: PlacedGirder = {
          id: `g_${angle}`,
          x: 300,
          y: 200,
          angleDeg: angle,
          length: 90,
          thickness: 14,
          destroyed: false,
        };

        expect(() => {
          renderHDDestructibleGirder(ctx, girder, [], [], grid, 1400, 0);
        }).not.toThrow();
      }
    });
  });

  describe('renderHDDestructibleProp for all 11 prop archetypes', () => {
    const propTypes: SolidProp['type'][] = [
      'tree',
      'mushroom',
      'flower',
      'cactus',
      'bunker',
      'totem',
      'oil_drum',
      'crystal',
      'lamppost',
      'hedgehog',
      'chick',
    ];

    it.each(propTypes)('renders %s prop safely with craters clipping', (type) => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: `p_${type}`,
        type,
        x: 200,
        y: 150,
        width: 30,
        height: 30,
        destroyed: false,
        variant: 0,
      };

      expect(() => {
        renderHDDestructibleProp(ctx, prop, craters, explosions, 100, grid, 1400, 0);
      }).not.toThrow();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('renders mushroom and crystal color variants (red, purple, gold / amethyst, cyan, emerald)', () => {
      const ctx = createMockContext();

      // Test all mushroom variants (0 = red, 1 = purple, 2 = gold)
      for (const variant of [0, 1, 2]) {
        const shroom: SolidProp = {
          id: `m_${variant}`,
          type: 'mushroom',
          x: 200,
          y: 200,
          width: 25,
          height: 25,
          variant,
        };
        expect(() => {
          renderHDDestructibleProp(ctx, shroom, [], [], 50, grid, 1400, 0);
        }).not.toThrow();
      }

      // Test all crystal variants (0 = amethyst, 1 = cyan, 2 = emerald)
      for (const variant of [0, 1, 2]) {
        const crystal: SolidProp = {
          id: `c_${variant}`,
          type: 'crystal',
          x: 300,
          y: 200,
          width: 25,
          height: 35,
          variant,
        };
        expect(() => {
          renderHDDestructibleProp(ctx, crystal, [], [], 50, grid, 1400, 0);
        }).not.toThrow();
      }
    });

    it('marks prop as destroyed when foundation terrain is missing', () => {
      const ctx = createMockContext();
      const emptyGrid = new Uint8Array(1400 * 800); // No solid terrain
      const prop: SolidProp = {
        id: 'p_unstable',
        type: 'tree',
        x: 400,
        y: 300,
        width: 30,
        height: 40,
        destroyed: false,
      };

      renderHDDestructibleProp(ctx, prop, [], [], 0, emptyGrid, 1400, 0);

      expect(prop.destroyed).toBe(true);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('marks girder as destroyed when foundation terrain is missing', () => {
      const ctx = createMockContext();
      const emptyGrid = new Uint8Array(1400 * 800); // No solid terrain
      const girder: PlacedGirder = {
        id: 'g_unstable',
        x: 500,
        y: 300,
        angleDeg: 0,
        length: 80,
        thickness: 12,
        destroyed: false,
      };

      renderHDDestructibleGirder(ctx, girder, [], [], emptyGrid, 1400, 0);

      expect(girder.destroyed).toBe(true);
      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('skips rendering already destroyed props and girders without drawing', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'p_dead',
        type: 'bunker',
        x: 200,
        y: 200,
        width: 30,
        height: 30,
        destroyed: true,
      };
      const girder: PlacedGirder = {
        id: 'g_dead',
        x: 200,
        y: 200,
        angleDeg: 0,
        length: 80,
        thickness: 12,
        destroyed: true,
      };

      renderHDDestructibleProp(ctx, prop, [], [], 0, grid, 1400, 0);
      renderHDDestructibleGirder(ctx, girder, [], [], grid, 1400, 0);

      expect(ctx.save).not.toHaveBeenCalled();
    });

    it('ignores older craters on newly placed girders based on initialCraterCount', () => {
      const ctx = createMockContext();
      const multipleCraters: CraterRecord[] = [
        { id: 'c_old1', x: 200, y: 150, radius: 25, createdAt: 1000 },
        { id: 'c_old2', x: 210, y: 150, radius: 20, createdAt: 2000 },
        { id: 'c_new', x: 220, y: 150, radius: 30, createdAt: 4000 },
      ];
      const girder: PlacedGirder = {
        id: 'g_new',
        x: 200,
        y: 150,
        angleDeg: 0,
        length: 80,
        thickness: 12,
        destroyed: false,
        initialCraterCount: 2, // Ignores craters 0 and 1
      };

      expect(() => {
        renderHDDestructibleGirder(ctx, girder, multipleCraters, [], grid, 1400, 0);
      }).not.toThrow();

      // Girder should clip only the 3rd crater (c_new), not crashing
      expect(ctx.clip).toHaveBeenCalledTimes(1);
    });
  });
});


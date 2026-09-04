import { describe, it, expect, beforeAll, vi } from 'vitest';
import { renderHDDestructibleProp } from '../rendering/renderProps';
import { SolidProp, CraterRecord, ExplosionEvent } from '../core/types';
import { createTerrainBuffers, redrawOffscreenTerrain, rebuildPropsOffscreenCanvas } from '../rendering/renderTerrain';
import { DestructibleTerrain } from '../core/terrain';

if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class MockPath2D {
    rect = vi.fn();
    arc = vi.fn();
  };
}

beforeAll(() => {
  if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = {
      createElement: (tag: string) => {
        if (tag === 'canvas') {
          return {
            width: 0,
            height: 0,
            getContext: () => ({
              createImageData: (w: number, h: number) => ({
                width: w,
                height: h,
                data: new Uint8ClampedArray(w * h * 4),
              }),
              putImageData: vi.fn(),
              drawImage: vi.fn(),
              clearRect: vi.fn(),
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
              createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
              createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
            }),
          };
        }
        return {};
      },
    };
  }
});

const createMockContext = () => {
  const calls: string[] = [];
  const gradMock = { addColorStop: vi.fn() };
  return {
    save: vi.fn(() => calls.push('save')),
    restore: vi.fn(() => calls.push('restore')),
    clip: vi.fn((...args: unknown[]) => calls.push(`clip(${args[1]})`)),
    drawImage: vi.fn(() => calls.push('drawImage')),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
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
    clearRect: vi.fn(),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => gradMock),
    createRadialGradient: vi.fn(() => gradMock),
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    globalAlpha: 1,
    createImageData: vi.fn((w: number, h: number) => ({
      width: w,
      height: h,
      data: new Uint8ClampedArray(w * h * 4),
    })),
    _calls: calls,
  } as unknown as CanvasRenderingContext2D & { _calls: string[] };
};

describe('Prop Slicing / Carving & Terrain Dark Zone Fixes', () => {
  const grid = new Uint8Array(1000 * 600);
  grid.fill(1);

  describe('1. Destructible Prop Crater Clipping', () => {
    it('slices prop by applying evenodd clipping when a crater overlaps', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'tree_1',
        type: 'tree',
        x: 300,
        y: 200,
        width: 32,
        height: 48,
        destroyed: false,
      };
      const craters: CraterRecord[] = [
        { id: 'c1', x: 310, y: 190, radius: 20 },
      ];

      renderHDDestructibleProp(ctx, prop, craters, undefined, 0, grid, 1000, 0);

      expect(ctx.clip).toHaveBeenCalledWith(expect.anything(), 'evenodd');
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(prop.destroyed).toBe(false);
    });

    it('does not invoke ctx.clip when craters are outside the prop boundary', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'tree_far',
        type: 'tree',
        x: 100,
        y: 200,
        width: 32,
        height: 48,
        destroyed: false,
      };
      const farCraters: CraterRecord[] = [
        { id: 'c_far', x: 600, y: 200, radius: 20 },
      ];

      renderHDDestructibleProp(ctx, prop, farCraters, undefined, 0, grid, 1000, 0);

      expect(ctx.clip).not.toHaveBeenCalled();
      expect(prop.destroyed).toBe(false);
    });

    it('memoizes Path2D clipping paths across frames when craters are unchanged', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'totem_1',
        type: 'totem',
        x: 400,
        y: 250,
        width: 26,
        height: 36,
        destroyed: false,
      };
      const craters: CraterRecord[] = [
        { id: 'c_same', x: 410, y: 240, radius: 18 },
      ];

      const Path2DSpy = vi.spyOn(globalThis, 'Path2D');
      Path2DSpy.mockClear();

      // First render creates Path2D
      renderHDDestructibleProp(ctx, prop, craters, undefined, 0, grid, 1000, 0);
      const initialPath2DCount = Path2DSpy.mock.calls.length;
      expect(initialPath2DCount).toBeGreaterThan(0);

      // Second render with same craters must reuse memoized clip cache
      Path2DSpy.mockClear();
      renderHDDestructibleProp(ctx, prop, craters, undefined, 0, grid, 1000, 0);
      expect(Path2DSpy.mock.calls.length).toBe(0);

      Path2DSpy.mockRestore();
    });

    it('clips multiple overlapping craters using separate evenodd intersections', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'bunker_1',
        type: 'bunker',
        x: 500,
        y: 300,
        width: 38,
        height: 26,
        destroyed: false,
      };
      const craters: CraterRecord[] = [
        { id: 'c1', x: 490, y: 295, radius: 15 },
        { id: 'c2', x: 510, y: 295, radius: 15 },
      ];

      renderHDDestructibleProp(ctx, prop, craters, undefined, 0, grid, 1000, 0);

      expect(ctx.clip).toHaveBeenCalledTimes(2);
      expect(ctx.clip).toHaveBeenNthCalledWith(1, expect.anything(), 'evenodd');
      expect(ctx.clip).toHaveBeenNthCalledWith(2, expect.anything(), 'evenodd');
    });

    it('handles explosion events identically to craters for live animation clipping', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'cactus_1',
        type: 'cactus',
        x: 200,
        y: 150,
        width: 24,
        height: 38,
        destroyed: false,
      };
      const explosions: ExplosionEvent[] = [
        { id: 'ex1', x: 205, y: 145, radius: 25, damage: 30, createdAt: Date.now() },
      ];

      renderHDDestructibleProp(ctx, prop, [], explosions, 0, grid, 1000, 0);

      expect(ctx.clip).toHaveBeenCalledWith(expect.anything(), 'evenodd');
    });
    it('accurately clips rotated props by computing transformed prop center in world space', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'cactus_rotated',
        type: 'cactus',
        x: 300,
        y: 200,
        width: 24,
        height: 40,
        angleRad: 0.5,
        destroyed: false,
      };
      const halfH = 20;
      const expectedCenterX = 300 + halfH * Math.sin(0.5);
      const expectedCenterY = 200 - halfH * Math.cos(0.5);
      const craters: CraterRecord[] = [
        { id: 'c_rot', x: expectedCenterX + 5, y: expectedCenterY + 5, radius: 15 },
      ];

      renderHDDestructibleProp(ctx, prop, craters, undefined, 0, grid, 1000, 0);

      expect(ctx.clip).toHaveBeenCalledWith(expect.anything(), 'evenodd');
      expect(prop.destroyed).toBe(false);
    });

    it('deduplicates simultaneous crater and explosion at identical coordinates to avoid redundant clip calls', () => {
      const ctx = createMockContext();
      const prop: SolidProp = {
        id: 'tree_dedup',
        type: 'tree',
        x: 400,
        y: 250,
        width: 32,
        height: 48,
        destroyed: false,
      };
      const craters: CraterRecord[] = [
        { id: 'c1', x: 405, y: 235, radius: 20 },
      ];
      const explosions: ExplosionEvent[] = [
        { id: 'ex1', x: 405, y: 235, radius: 20, damage: 40, createdAt: Date.now() },
      ];

      renderHDDestructibleProp(ctx, prop, craters, explosions, 0, grid, 1000, 0);

      expect(ctx.clip).toHaveBeenCalledTimes(1);
    });
  });

  describe('2. Elimination of Terrain Dark Zone Artifacts', () => {
    it('does not re-render offscreen terrain buffer when props are destroyed', () => {
      const buffers = createTerrainBuffers(800, 600);
      const terrain = new DestructibleTerrain({
        width: 800,
        height: 600,
        waterLevel: 500,
        grid: new Uint8Array(800 * 600).fill(1),
        theme: 'ISLAND',
        seed: 12345,
        solidProps: [
          { id: 'p1', type: 'tree', x: 200, y: 300, width: 32, height: 48, destroyed: false },
        ],
        decorItems: [],
        spawnPoints: [],
        minePoints: [],
      });

      redrawOffscreenTerrain(terrain, buffers);

      const putImageSpy = vi.spyOn(buffers.offscreenCanvas.getContext('2d')!, 'putImageData');
      putImageSpy.mockClear();

      terrain.data.solidProps[0].destroyed = true;
      rebuildPropsOffscreenCanvas(buffers, terrain.data.solidProps);

      expect(putImageSpy).not.toHaveBeenCalled();
    });

    it('propagates distance transform across dirty box boundaries without reset to 99', () => {
      const width = 200;
      const height = 150;
      const buffers = createTerrainBuffers(width, height);
      const testGrid = new Uint8Array(width * height);
      testGrid.fill(1);
      for (let y = 0; y < 30; y++) {
        for (let x = 0; x < width; x++) {
          testGrid[y * width + x] = 0;
        }
      }

      const terrain = new DestructibleTerrain({
        width,
        height,
        waterLevel: 140,
        grid: testGrid,
        theme: 'ISLAND',
        seed: 67890,
        solidProps: [],
        decorItems: [],
        spawnPoints: [],
        minePoints: [],
      });

      redrawOffscreenTerrain(terrain, buffers);

      const surfaceIdx = 30 * width + 50;
      expect(buffers.distMap[surfaceIdx]).toBeCloseTo(1, 0.5);

      redrawOffscreenTerrain(terrain, buffers, {
        minX: 40,
        maxX: 60,
        minY: 25,
        maxY: 35,
      });

      expect(buffers.distMap[surfaceIdx]).toBeLessThan(5);
    });

    it('correctly calculates positive distance transform on newly added solid terrain inside dirty box', () => {
      const width = 100;
      const height = 100;
      const buffers = createTerrainBuffers(width, height);
      const testGrid = new Uint8Array(width * height);
      const terrain = new DestructibleTerrain({
        width,
        height,
        waterLevel: 90,
        grid: testGrid,
        theme: 'ISLAND',
        seed: 111,
        solidProps: [],
        decorItems: [],
        spawnPoints: [],
        minePoints: [],
      });

      redrawOffscreenTerrain(terrain, buffers);

      // Build 10-pixel radius boulder centered at (50, 50)
      for (let y = 40; y <= 60; y++) {
        for (let x = 40; x <= 60; x++) {
          if ((x - 50) ** 2 + (y - 50) ** 2 <= 100) {
            testGrid[y * width + x] = 1;
          }
        }
      }

      redrawOffscreenTerrain(terrain, buffers, {
        minX: 38,
        maxX: 62,
        minY: 38,
        maxY: 62,
      });

      const centerDist = buffers.distMap[50 * width + 50];
      expect(centerDist).toBeGreaterThan(8);
      expect(centerDist).toBeLessThanOrEqual(12);
    });
  });
});

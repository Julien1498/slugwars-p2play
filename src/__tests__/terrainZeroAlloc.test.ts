import { describe, it, expect, beforeAll, vi } from 'vitest';
import { DestructibleTerrain, RaycastHitResult, SurfaceNormalResult } from '../core/terrain';
import { TerrainData } from '../core/terrainGenerator';
import { createTerrainBuffers, redrawOffscreenTerrain } from '../rendering/renderTerrain';

describe('Terrain Zero-Allocation Physics & Rendering Pipeline', () => {
  beforeAll(() => {
    if (typeof document === 'undefined') {
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
              }),
            };
          }
          return {};
        },
      };
    }
  });
  const createMockTerrainData = (width = 200, height = 100): TerrainData => {
    const grid = new Uint8Array(width * height);
    // Fill bottom half with solid rock (y >= 50)
    for (let y = 50; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y * width + x] = 1;
      }
    }

    return {
      width,
      height,
      waterLevel: 90,
      grid,
      theme: 'ISLAND',
      seed: 12345,
      spawnPoints: [{ x: 50, y: 45 }],
      minePoints: [],
      solidProps: [],
      decorItems: [],
    };
  };

  describe('Zero-Allocation Raycasting (raycastSolidInto)', () => {
    it('populates provided RaycastHitResult struct without allocating new objects', () => {
      const terrain = new DestructibleTerrain(createMockTerrainData());
      const out: RaycastHitResult = { hit: false, x: 0, y: 0 };

      // Ray from air (50, 10) downwards towards rock (50, 80)
      const res = terrain.raycastSolidInto(50, 10, 50, 80, out);

      expect(res).toBe(out); // Identical object reference (zero alloc)
      expect(out.hit).toBe(true);
      expect(out.x).toBe(50);
      expect(out.y).toBe(50);
    });

    it('returns air destination when ray misses all solid obstacles', () => {
      const terrain = new DestructibleTerrain(createMockTerrainData());
      const out: RaycastHitResult = { hit: true, x: 0, y: 0 };

      // Ray horizontally through air (10, 20) -> (100, 20)
      const res = terrain.raycastSolidInto(10, 20, 100, 20, out);

      expect(res).toBe(out);
      expect(out.hit).toBe(false);
      expect(out.x).toBe(100);
      expect(out.y).toBe(20);
    });
  });

  describe('Zero-Allocation Surface Normal (getSurfaceNormalInto)', () => {
    it('populates provided SurfaceNormalResult struct with upward unit normal on flat ground', () => {
      const terrain = new DestructibleTerrain(createMockTerrainData());
      const out: SurfaceNormalResult = { nx: 0, ny: 0 };

      // Impact on horizontal ground at (50, 50)
      const res = terrain.getSurfaceNormalInto(50, 50, 4, out);

      expect(res).toBe(out);
      expect(out.nx).toBeCloseTo(0, 2);
      expect(out.ny).toBeCloseTo(-1, 2); // Points upward away from ground
    });
  });

  describe('Zero-Alloc Offscreen Terrain Crater Redraw', () => {
    it('redraws dirty crater bounding box cleanly without crashes', () => {
      const terrain = new DestructibleTerrain(createMockTerrainData(300, 200));
      const buffers = createTerrainBuffers(300, 200);

      // Carve crater at (100, 50) radius 20
      terrain.carveExplosion(100, 50, 20);

      // Partial dirty box redraw
      expect(() => {
        redrawOffscreenTerrain(terrain, buffers, { minX: 80, maxX: 120, minY: 30, maxY: 70 });
      }).not.toThrow();
    });
  });
});

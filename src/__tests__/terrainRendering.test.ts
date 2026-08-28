import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  createTerrainBuffers,
  lerpColor32,
  redrawOffscreenTerrain,
} from '../rendering/renderTerrain';
import { generateProceduralTerrain } from '../core/terrainGenerator';
import { DestructibleTerrain } from '../core/terrain';
import { MapTheme } from '../core/types';

describe('Terrain Rendering & Offscreen Strata Pipeline', () => {
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

  describe('createTerrainBuffers()', () => {
    it('allocates offscreen canvases and float distance map matching terrain dimensions', () => {
      const width = 1400;
      const height = 800;
      const buffers = createTerrainBuffers(width, height);

      expect(buffers.offscreenCanvas.width).toBe(width);
      expect(buffers.offscreenCanvas.height).toBe(height);
      expect(buffers.terrainHitboxCanvas.width).toBe(width);
      expect(buffers.terrainHitboxCanvas.height).toBe(height);
      expect(buffers.distMap.length).toBe(width * height);
      expect(buffers.distMap[0]).toBe(99);
    });
  });

  describe('lerpColor32()', () => {
    it('interpolates 32-bit packed ABGR colors accurately', () => {
      const black = 0xff000000;
      const white = 0xffffffff;

      expect(lerpColor32(black, white, 0)).toBe(black);
      expect(lerpColor32(black, white, 1)).toBe(white);

      const mid = lerpColor32(black, white, 0.5);
      const r = mid & 0xff;
      const g = (mid >> 8) & 0xff;
      const b = (mid >> 16) & 0xff;
      const a = (mid >> 24) & 0xff;

      expect(r).toBeCloseTo(128, -1);
      expect(g).toBeCloseTo(128, -1);
      expect(b).toBeCloseTo(128, -1);
      expect(a).toBe(0xff);
    });
  });

  describe('redrawOffscreenTerrain() - Full Scan & Distance Transform', () => {
    const allThemes: MapTheme[] = [
      'ISLAND',
      'CAVERN',
      'FORTRESS',
      'FLOATING_CHAOS',
      'ARCHIPELAGO',
      'NATURAL_ARCHES',
      'SPIRES',
      'ORGANIC_CAVES',
    ];

    it.each(allThemes)('computes distance transform and renders offscreen strata for theme %s', (theme) => {
      const width = 600;
      const height = 400;
      const data = generateProceduralTerrain(12345, theme, width, height);
      const terrain = new DestructibleTerrain(data);
      const buffers = createTerrainBuffers(width, height);

      redrawOffscreenTerrain(terrain, buffers);

      // Verify distance map
      let airMismatch = 0;
      let solidMismatch = 0;
      let maxDist = 0;

      for (let i = 0; i < terrain.data.grid.length; i++) {
        if (terrain.data.grid[i] === 0) {
          if (buffers.distMap[i] !== 0) airMismatch++;
        } else {
          if (buffers.distMap[i] <= 0) solidMismatch++;
          if (buffers.distMap[i] > maxDist) maxDist = buffers.distMap[i];
        }
      }

      expect(airMismatch).toBe(0);
      expect(solidMismatch).toBe(0);
      expect(maxDist).toBeGreaterThan(5); // Internal core rock reaches deep distance
    });

    it('generates deterministic pixel buffer across multiple renders of the same seed', () => {
      const width = 600;
      const height = 400;
      const dataA = generateProceduralTerrain(42, 'ISLAND', width, height);
      const dataB = generateProceduralTerrain(42, 'ISLAND', width, height);

      const terrainA = new DestructibleTerrain(dataA);
      const terrainB = new DestructibleTerrain(dataB);

      const buffersA = createTerrainBuffers(width, height);
      const buffersB = createTerrainBuffers(width, height);

      redrawOffscreenTerrain(terrainA, buffersA);
      redrawOffscreenTerrain(terrainB, buffersB);

      // Distance maps must be mathematically equal
      let diffCount = 0;
      for (let i = 0; i < buffersA.distMap.length; i++) {
        if (Math.abs(buffersA.distMap[i] - buffersB.distMap[i]) > 0.001) {
          diffCount++;
        }
      }
      expect(diffCount).toBe(0);
    });
  });

  describe('redrawOffscreenTerrain() - Partial Redraw (Dirty Box)', () => {
    it('updates only targeted crater dirty box region after explosion', () => {
      const width = 600;
      const height = 400;
      const data = generateProceduralTerrain(555, 'ISLAND', width, height);
      const terrain = new DestructibleTerrain(data);
      const buffers = createTerrainBuffers(width, height);

      // 1. Initial full scan
      redrawOffscreenTerrain(terrain, buffers);

      // 2. Carve explosion crater
      const cx = 300;
      const cy = 200;
      const radius = 30;
      terrain.carveExplosion(cx, cy, radius);

      // 3. Partial redraw of dirty box
      const dirtyBox = {
        minX: cx - radius - 5,
        maxX: cx + radius + 5,
        minY: cy - radius - 5,
        maxY: cy + radius + 5,
      };

      redrawOffscreenTerrain(terrain, buffers, dirtyBox);

      // Center of crater must now be air and have distMap === 0
      const centerIdx = cy * width + cx;
      expect(terrain.data.grid[centerIdx]).toBe(0);
      expect(buffers.distMap[centerIdx]).toBe(0);
    });
  });
});

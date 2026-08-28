import { describe, it, expect, beforeAll, vi } from 'vitest';
import { generateProceduralTerrain } from '../core/terrainGenerator';
import { DestructibleTerrain } from '../core/terrain';
import {
  createTerrainBuffers,
  redrawOffscreenTerrain,
} from '../rendering/renderTerrain';
import { MapTheme } from '../core/types';

describe('Terrain Benchmark & Performance Integrity', () => {
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

  it('generates a standard 1400x800 map under performance budget', () => {
    const t0 = performance.now();
    const terrainData = generateProceduralTerrain(12345, 'ISLAND', 1400, 800);
    const duration = performance.now() - t0;

    expect(terrainData.grid.length).toBe(1400 * 800);
    expect(terrainData.spawnPoints.length).toBeGreaterThanOrEqual(4);
    expect(duration).toBeLessThan(1000);
  });

  it('maintains strict mathematical determinism across all 8 biomes', () => {
    for (const theme of allThemes) {
      const run1 = generateProceduralTerrain(999, theme, 800, 500);
      const run2 = generateProceduralTerrain(999, theme, 800, 500);

      let gridDiffCount = 0;
      for (let i = 0; i < run1.grid.length; i++) {
        if (run1.grid[i] !== run2.grid[i]) gridDiffCount++;
      }
      expect(gridDiffCount).toBe(0);
      expect(run1.spawnPoints).toEqual(run2.spawnPoints);
      expect(run1.minePoints).toEqual(run2.minePoints);
      expect(run1.solidProps.length).toBe(run2.solidProps.length);
    }
  });

  it('executes full offscreen redraw pipeline cleanly across all biomes', () => {
    const width = 800;
    const height = 500;
    const buffers = createTerrainBuffers(width, height);

    for (const theme of allThemes) {
      const data = generateProceduralTerrain(777, theme, width, height);
      const terrain = new DestructibleTerrain(data);

      const t0 = performance.now();
      redrawOffscreenTerrain(terrain, buffers);
      const renderDuration = performance.now() - t0;

      expect(buffers.distMap.length).toBe(width * height);
      expect(renderDuration).toBeLessThan(2000);
    }
  });
});

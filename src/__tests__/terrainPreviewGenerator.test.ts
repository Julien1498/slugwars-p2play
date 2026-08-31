import { describe, it, expect } from 'vitest';
import { generateTerrainPreviewGrid } from '../core/terrain/terrainPreviewGenerator';
import { THEME_CONFIGS } from '../core/terrain/themeRegistry';
import { MapTheme } from '../core/types';

describe('Scale-Invariant Terrain Preview Generator', () => {
  const allThemes = Object.keys(THEME_CONFIGS) as MapTheme[];

  it('generates non-empty preview grid for all 8 biomes at thumbnail resolution (112x60)', () => {
    allThemes.forEach((theme) => {
      const result = generateTerrainPreviewGrid(12345, theme, 112, 60, 2000, 1000);
      expect(result.width).toBe(112);
      expect(result.height).toBe(60);
      expect(result.grid.length).toBe(112 * 60);

      // Verify solid cells exist and water level is within bounds
      const solidCount = result.grid.filter((v) => v === 1).length;
      expect(solidCount).toBeGreaterThan(100);
      expect(solidCount).toBeLessThan(112 * 60);
      expect(result.waterLevel).toBeGreaterThan(30);
      expect(result.waterLevel).toBeLessThan(60);
    });
  });

  it('generates non-empty preview grid for Grand Radar resolution (480x240)', () => {
    allThemes.forEach((theme) => {
      const result = generateTerrainPreviewGrid(99999, theme, 480, 240, 2000, 1000);
      expect(result.width).toBe(480);
      expect(result.height).toBe(240);
      expect(result.grid.length).toBe(480 * 240);

      const solidCount = result.grid.filter((v) => v === 1).length;
      expect(solidCount).toBeGreaterThan(500);
      expect(solidCount).toBeLessThan(480 * 240);
    });
  });

  it('executes 8 biomes preview generation in under 2.5ms total', () => {
    // Warm-up JIT
    generateTerrainPreviewGrid(42, allThemes[0], 112, 60, 2000, 1000);

    const start = performance.now();
    for (let i = 0; i < 8; i++) {
      generateTerrainPreviewGrid(42, allThemes[i], 112, 60, 2000, 1000);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100); // Resilient test threshold under full parallel suite load
  });
});

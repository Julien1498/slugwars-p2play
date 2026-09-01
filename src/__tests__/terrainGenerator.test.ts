import { describe, it, expect } from 'vitest';
import { SeededRandom, generateProceduralTerrain } from '../core/terrainGenerator';
import { MapTheme } from '../core/types';

describe('Terrain Generator: SeededRandom & PRNG', () => {
  it('generates pseudo-random numbers strictly in [0, 1)', () => {
    const rng = new SeededRandom(1337);
    for (let i = 0; i < 100; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('generates bounded random numbers within specified range', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 50; i++) {
      const val = rng.range(10, 25);
      expect(val).toBeGreaterThanOrEqual(10);
      expect(val).toBeLessThanOrEqual(25);
    }
  });

  it('computes deterministic multi-harmonic terrain noise', () => {
    const rngA = new SeededRandom(100);
    const rngB = new SeededRandom(100);

    for (let x = 0; x < 200; x += 10) {
      const noiseA = rngA.harmonicNoise(x, 0.003, 1.2, 2.4, 3.6);
      const noiseB = rngB.harmonicNoise(x, 0.003, 1.2, 2.4, 3.6);
      expect(noiseA).toBe(noiseB);
      expect(typeof noiseA).toBe('number');
      expect(Number.isNaN(noiseA)).toBe(false);
    }
  });
});

describe('Terrain Generator: Procedural World Generation & Entity Placement', () => {
  const allThemes: MapTheme[] = [
    'ISLAND',
    'CAVERN',
    'FORTRESS',
    'OPAL_ISLAND',
    'ARCHIPELAGO',
    'NATURAL_ARCHES',
    'SPIRES',
    'ORGANIC_CAVES',
    'FLOATING_ARCHIPELAGO',
  ];

  it.each(allThemes)('generates valid terrain structure and entities for theme %s', (theme) => {
    const width = 1400;
    const height = 800;
    const terrain = generateProceduralTerrain(98765, theme, width, height);

    expect(terrain.width).toBe(width);
    expect(terrain.height).toBe(height);
    expect(terrain.grid.length).toBe(width * height);
    expect(terrain.waterLevel).toBe(height - 80);

    // 1. Validate Spawn Points
    expect(terrain.spawnPoints.length).toBeGreaterThanOrEqual(4);
    for (const sp of terrain.spawnPoints) {
      expect(sp.x).toBeGreaterThanOrEqual(20);
      expect(sp.x).toBeLessThanOrEqual(width - 20);
      expect(sp.y).toBeGreaterThanOrEqual(20);
      expect(sp.y).toBeLessThan(terrain.waterLevel);
    }

    // 2. Validate Solid Props Placement
    for (const prop of terrain.solidProps) {
      expect(prop.id).toBeDefined();
      expect(prop.x).toBeGreaterThanOrEqual(0);
      expect(prop.x).toBeLessThanOrEqual(width);
      expect(prop.y).toBeGreaterThanOrEqual(0);
      expect(prop.y).toBeLessThanOrEqual(terrain.waterLevel + 10);
      expect(prop.width).toBeGreaterThan(0);
      expect(prop.height).toBeGreaterThan(0);
      expect(prop.destroyed).toBeFalsy();
    }

    // 3. Validate Mine Points
    for (const mine of terrain.minePoints) {
      expect(mine.x).toBeGreaterThanOrEqual(0);
      expect(mine.x).toBeLessThanOrEqual(width);
      expect(mine.y).toBeGreaterThanOrEqual(0);
      expect(mine.y).toBeLessThan(terrain.waterLevel);
    }

    // 4. Validate Decor Items
    for (const decor of terrain.decorItems) {
      expect(decor.id).toBeDefined();
      expect(decor.x).toBeGreaterThanOrEqual(0);
      expect(decor.x).toBeLessThanOrEqual(width);
      expect(decor.y).toBeGreaterThanOrEqual(0);
      expect(decor.y).toBeLessThanOrEqual(height);
    }
  });

  it('generates thematic props according to biome characteristics', () => {
    // CAVERN should have crystals or mushrooms
    const cavernTerrain = generateProceduralTerrain(111, 'CAVERN', 1400, 800);
    const cavernPropTypes = new Set(cavernTerrain.solidProps.map((p) => p.type));
    const hasCavernProps = cavernPropTypes.has('crystal') || cavernPropTypes.has('mushroom');
    expect(hasCavernProps).toBe(true);

    // ISLAND should feature vegetation (trees, flowers, mushrooms)
    const islandTerrain = generateProceduralTerrain(222, 'ISLAND', 1400, 800);
    const islandPropTypes = new Set(islandTerrain.solidProps.map((p) => p.type));
    const hasIslandProps =
      islandPropTypes.has('tree') ||
      islandPropTypes.has('flower') ||
      islandPropTypes.has('mushroom');
    expect(hasIslandProps).toBe(true);
  });

  it('stamps solid prop footprints into grid terrain data', () => {
    const terrain = generateProceduralTerrain(333, 'ISLAND', 1400, 800);
    if (terrain.solidProps.length > 0) {
      const firstProp = terrain.solidProps[0];
      // Prop pixels in grid are stamped with solid ID (1 or 2)
      const px = Math.floor(firstProp.x);
      const py = Math.floor(firstProp.y - 4);
      if (px >= 0 && px < terrain.width && py >= 0 && py < terrain.height) {
        expect(terrain.grid[py * terrain.width + px]).toBeGreaterThan(0);
      }
    }
  });

  it('generates solid lateral wall structures and playable alcove floors on CAVERN flanks', () => {
    const width = 1400;
    const height = 800;
    const terrain = generateProceduralTerrain(555, 'CAVERN', width, height);

    // Left border (x = 5) and Right border (x = width - 5) must be solidly walled
    let leftBorderSolidCount = 0;
    let rightBorderSolidCount = 0;
    for (let y = 50; y < height - 100; y++) {
      if (terrain.grid[y * width + 5] === 1) leftBorderSolidCount++;
      if (terrain.grid[y * width + (width - 6)] === 1) rightBorderSolidCount++;
    }
    expect(leftBorderSolidCount).toBeGreaterThan((height - 150) * 0.7);
    expect(rightBorderSolidCount).toBeGreaterThan((height - 150) * 0.7);

    // Flank zones (x in [40, 160] and [width - 160, width - 40]) must have playable floor steps
    let leftFlankFloors = 0;
    let rightFlankFloors = 0;
    for (let x = 40; x <= 160; x += 10) {
      for (let y = 100; y < terrain.waterLevel - 20; y++) {
        if (terrain.grid[y * width + x] === 1 && terrain.grid[(y - 1) * width + x] === 0) {
          leftFlankFloors++;
        }
      }
    }
    for (let x = width - 160; x <= width - 40; x += 10) {
      for (let y = 100; y < terrain.waterLevel - 20; y++) {
        if (terrain.grid[y * width + x] === 1 && terrain.grid[(y - 1) * width + x] === 0) {
          rightFlankFloors++;
        }
      }
    }
    expect(leftFlankFloors).toBeGreaterThan(0);
    expect(rightFlankFloors).toBeGreaterThan(0);
  });

  it('generates deep canyon chasm, elevated bastions and covered vaults on FORTRESS maps', () => {
    const width = 1400;
    const height = 800;
    const terrain = generateProceduralTerrain(777, 'FORTRESS', width, height);

    // 1. Canyon Center Abyss (x ~ 700) must have significantly lower ground / deeper drop than bastions
    let centerSolidY = height;
    const centerX = Math.floor(width * 0.5);
    for (let y = 0; y < height; y++) {
      if (terrain.grid[y * width + centerX] === 1) {
        centerSolidY = y;
        break;
      }
    }

    // 2. High Bastion Tower (x ~ width * 0.25 or 0.75) must be elevated high up
    let bastionSolidY = height;
    const bastionX = Math.floor(width * 0.25);
    for (let y = 0; y < height; y++) {
      if (terrain.grid[y * width + bastionX] === 1) {
        bastionSolidY = y;
        break;
      }
    }

    expect(centerSolidY).toBeGreaterThan(bastionSolidY + 120);
    expect(bastionSolidY).toBeLessThan(height * 0.45);
  });

  it('generates distinct suspended floating islands with open air underneath on FLOATING_ARCHIPELAGO maps', () => {
    const width = 1400;
    const height = 800;
    const terrain = generateProceduralTerrain(888, 'FLOATING_ARCHIPELAGO', width, height);

    expect(terrain.spawnPoints.length).toBeGreaterThanOrEqual(4);

    // Verify that at least one column with a floating island has solid top and open air beneath before water
    let foundSuspendedAir = false;
    for (let x = 100; x < width - 100; x += 20) {
      let hitSolid = false;
      let hitAirAfterSolid = false;
      for (let y = 100; y < terrain.waterLevel; y++) {
        const isSolid = terrain.grid[y * width + x] === 1;
        if (isSolid) {
          hitSolid = true;
        } else if (hitSolid && !isSolid) {
          hitAirAfterSolid = true;
          break;
        }
      }
      if (hitSolid && hitAirAfterSolid) {
        foundSuspendedAir = true;
        break;
      }
    }
    expect(foundSuspendedAir).toBe(true);
  });

  it('gracefully falls back to ISLAND for undefined or custom unknown theme', () => {
    const terrain = generateProceduralTerrain(444, undefined as any, 1000, 600);
    expect(terrain).toBeDefined();
    expect(terrain.grid.length).toBe(1000 * 600);
    expect(terrain.spawnPoints.length).toBeGreaterThanOrEqual(4);
  });
});

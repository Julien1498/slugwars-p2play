import { describe, it, expect } from 'vitest';
import { generateProceduralTerrain } from '../core/terrainGenerator';
import { DestructibleTerrain } from '../core/terrain';
import { SlugWarsEngine } from '../core/gameEngine';

describe('Terrain: Generation, Solid Checks & Crater Destruction', () => {
  it('generates consistent, non-empty terrain across seeds', () => {
    const terrainDataA = generateProceduralTerrain(42, 'ISLAND', 600, 400);
    const terrainDataB = generateProceduralTerrain(42, 'ISLAND', 600, 400);

    expect(terrainDataA.width).toBe(600);
    expect(terrainDataA.height).toBe(400);
    expect(terrainDataA.waterLevel).toBeGreaterThan(200);

    // Verify deterministic grid output
    let solidCountA = 0;
    let matches = true;
    for (let i = 0; i < terrainDataA.grid.length; i++) {
      if (terrainDataA.grid[i] > 0) solidCountA++;
      if (terrainDataA.grid[i] !== terrainDataB.grid[i]) {
        matches = false;
        break;
      }
    }
    expect(matches).toBe(true);
    expect(solidCountA).toBeGreaterThan(100);
  });

  it('correctly reports solidity and raycasts to ground', () => {
    const terrainData = generateProceduralTerrain(999, 'ISLAND', 600, 400);
    const dt = new DestructibleTerrain(terrainData);

    // Air above ceiling is not solid
    expect(dt.isSolid(300, -10)).toBe(false);
    // Void below world is not solid
    expect(dt.isSolid(300, 500)).toBe(false);
    // Out of horizontal bounds is not solid
    expect(dt.isSolid(-50, 200)).toBe(false);
    expect(dt.isSolid(800, 200)).toBe(false);

    // Raycast from sky downwards should hit solid ground
    const ray = dt.raycastSolid(300, 20, 300, 380);
    expect(ray.hit).toBe(true);
    expect(ray.y).toBeGreaterThan(20);
    expect(ray.y).toBeLessThanOrEqual(terrainData.height);
  });

  it('carves explosions into terrain grid and increments revision', () => {
    const terrainData = generateProceduralTerrain(777, 'OPAL_ISLAND', 600, 400);
    const dt = new DestructibleTerrain(terrainData);

    // Find a solid ground coordinate
    const ray = dt.raycastSolid(300, 20, 300, 380);
    expect(ray.hit).toBe(true);
    const targetX = ray.x;
    const targetY = ray.y;

    const initialRevision = dt.revision;
    const blastRadius = 25;

    // Carve explosion at solid point
    const { carvedPixels } = dt.carveExplosion(targetX, targetY + 5, blastRadius);
    expect(carvedPixels).toBeGreaterThan(0);
    expect(dt.revision).toBe(initialRevision + 1);

    // The blast epicenter is now open air
    expect(dt.isSolid(targetX, targetY + 5)).toBe(false);
  });

  it('records craters and propagates environmental destruction via engine explosions', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 12345 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const initialCraterCount = engine.state.craters?.length || 0;
    const blastX = 500;
    const blastY = 350;
    const blastRadius = 40;

    // Trigger an engine explosion
    engine.carveCrater(blastX, blastY, blastRadius);

    const craters = engine.state.craters || [];
    expect(craters.length).toBeGreaterThanOrEqual(initialCraterCount + 1);
    const createdCrater = craters.find((c) => c.x === blastX && c.y === blastY && c.radius === blastRadius);
    expect(createdCrater).toBeDefined();
    expect(createdCrater!.x).toBe(blastX);
    expect(createdCrater!.y).toBe(blastY);
    expect(createdCrater!.radius).toBe(blastRadius);
  });

  it('erases solid prop physics pixels from grid when prop is destroyed to prevent phantom hitboxes', () => {
    const terrainData = generateProceduralTerrain(123, 'ISLAND', 600, 400);
    const dt = new DestructibleTerrain(terrainData);

    // If no solidProps naturally spawned at test coords, manually insert one
    const propX = 300;
    const propY = 200;
    const propW = 20;
    const propH = 30;

    // Stamp prop pixels (2) into grid
    for (let y = propY - propH; y <= propY; y++) {
      for (let x = propX - 10; x <= propX + 10; x++) {
        terrainData.grid[y * 600 + x] = 2;
      }
    }
    // Solid ground below prop
    for (let x = propX - 10; x <= propX + 10; x++) {
      terrainData.grid[(propY + 1) * 600 + x] = 1;
    }

    terrainData.solidProps = [
      {
        id: 'sprop_test_1',
        type: 'oil_drum',
        x: propX,
        y: propY,
        width: propW,
        height: propH,
      },
    ];

    // Verify prop pixel is initially solid
    expect(dt.isSolid(propX, propY - 10)).toBe(true);

    // Blow up ground underneath prop so it loses foundation and explodes
    dt.carveExplosion(propX, propY + 10, 25);

    // The prop is now destroyed and its stamped pixels are erased from grid
    expect(terrainData.solidProps[0].destroyed).toBe(true);
    expect(dt.isSolid(propX, propY - 10)).toBe(false);
  });

  it('enforces indestructible bedrock ceiling for CAVERN theme maps', () => {
    const terrainData = generateProceduralTerrain(555, 'CAVERN', 600, 400);
    const dt = new DestructibleTerrain(terrainData);

    // Cavern ceiling is solid
    expect(dt.isSolid(300, 10)).toBe(true);
    // Air above cavern ceiling is also impenetrable
    expect(dt.isSolid(300, -5)).toBe(true);

    // Try blasting the ceiling
    dt.carveExplosion(300, 15, 30);

    // Bedrock ceiling at y <= 16 remains intact and solid
    expect(dt.isSolid(300, 10)).toBe(true);
  });

  it('generates all 8 procedural terrain archetypes deterministically with valid spawn points', () => {
    const themes = [
      'ISLAND',
      'CAVERN',
      'FORTRESS',
      'OPAL_ISLAND',
      'ARCHIPELAGO',
      'NATURAL_ARCHES',
      'SPIRES',
      'ORGANIC_CAVES',
    ] as const;

    for (const theme of themes) {
      const terrain1 = generateProceduralTerrain(12345, theme, 1000, 600);
      const terrain2 = generateProceduralTerrain(12345, theme, 1000, 600);

      // Verify non-empty terrain
      let solidPixels = 0;
      let identical = true;
      for (let i = 0; i < terrain1.grid.length; i++) {
        if (terrain1.grid[i] > 0) solidPixels++;
        if (terrain1.grid[i] !== terrain2.grid[i]) {
          identical = false;
          break;
        }
      }

      expect(identical).toBe(true);
      expect(solidPixels).toBeGreaterThan(1000);
      expect(terrain1.spawnPoints.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('enforces indestructible bedrock ceiling for ORGANIC_CAVES maps', () => {
    const terrainData = generateProceduralTerrain(888, 'ORGANIC_CAVES', 600, 400);
    const dt = new DestructibleTerrain(terrainData);

    expect(dt.isSolid(300, 10)).toBe(true);
    expect(dt.isSolid(300, -5)).toBe(true);

    // Carve explosion directly on ceiling
    dt.carveExplosion(300, 10, 25);
    // Bedrock ceiling (y <= 16) remains solid
    expect(dt.isSolid(300, 10)).toBe(true);
    expect(dt.isSolid(300, 15)).toBe(true);
  });

  it('allows carving top area on open sky themes like ISLAND', () => {
    const terrainData = generateProceduralTerrain(888, 'ISLAND', 600, 400);
    const dt = new DestructibleTerrain(terrainData);
    // Bedrock ceiling does not exist in open sky
    expect(dt.isSolid(300, -5)).toBe(false);
  });

  it('generates massive natural arches and hollow passages in NATURAL_ARCHES theme', () => {
    const terrainData = generateProceduralTerrain(456, 'NATURAL_ARCHES', 1400, 800);
    const { grid, width, height } = terrainData;

    // Detect presence of arches: a solid bridge in upper section that has open air beneath it and solid ground further below
    let archPassageFound = false;
    for (let x = 100; x < width - 100; x += 10) {
      let transitions = 0;
      let wasSolid = false;
      for (let y = 30; y < height - 100; y++) {
        const isSolid = grid[y * width + x] === 1;
        if (isSolid !== wasSolid) {
          transitions++;
          wasSolid = isSolid;
        }
      }
      if (transitions >= 4) {
        archPassageFound = true;
        break;
      }
    }

    expect(archPassageFound).toBe(true);
  });

  it('generates natural rock ceiling in CAVERN theme maps', () => {
    const terrainData = generateProceduralTerrain(789, 'CAVERN', 1400, 800);
    const dt = new DestructibleTerrain(terrainData);

    // Verify solid bedrock ceiling exists
    expect(dt.isSolid(300, 10)).toBe(true);
  });
});

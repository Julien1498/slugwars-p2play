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
    const terrainData = generateProceduralTerrain(777, 'FLOATING_CHAOS', 600, 400);
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
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
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
    expect(craters.length).toBe(initialCraterCount + 1);
    const lastCrater = craters[craters.length - 1];
    expect(lastCrater.x).toBe(blastX);
    expect(lastCrater.y).toBe(blastY);
    expect(lastCrater.radius).toBe(blastRadius);
  });
});

import { describe, it, expect } from 'vitest';
import { findSafePlacementPoint } from '../core/engine/turnManager';
import { generateProceduralTerrain } from '../core/terrainGenerator';
import { DestructibleTerrain } from '../core/terrain';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameConfig } from '../core/types';

describe('Slug Placement: Safety & Boundary Clamping', () => {
  const terrainData = generateProceduralTerrain(12345, 'ISLAND', 1600, 800);
  const terrain = new DestructibleTerrain(terrainData);

  it('clamps coordinates away from extreme map boundaries', () => {
    // Left boundary violation
    const leftPt = findSafePlacementPoint(terrain, -100, 300);
    expect(leftPt.x).toBeGreaterThanOrEqual(20);
    expect(leftPt.x).toBeLessThanOrEqual(terrain.data.width - 20);

    // Right boundary violation
    const rightPt = findSafePlacementPoint(terrain, 5000, 300);
    expect(rightPt.x).toBeLessThanOrEqual(terrain.data.width - 20);
    expect(rightPt.x).toBeGreaterThanOrEqual(20);
  });

  it('never places a slug inside deep water', () => {
    const deepWaterY = terrain.data.waterLevel + 100;
    const pt = findSafePlacementPoint(terrain, 800, deepWaterY);
    expect(pt.y).toBeLessThan(terrain.data.waterLevel);
    expect(pt.y).toBeLessThanOrEqual(terrain.data.waterLevel - 15);
  });

  it('never returns (0,0) or NaN coordinates on arbitrary click targets', () => {
    const testCases = [
      { x: 0, y: 0 },
      { x: -500, y: -500 },
      { x: 9999, y: 9999 },
      { x: 800, y: 0 },
      { x: 800, y: terrain.data.waterLevel },
    ];

    for (const tc of testCases) {
      const pt = findSafePlacementPoint(terrain, tc.x, tc.y);
      expect(Number.isFinite(pt.x)).toBe(true);
      expect(Number.isFinite(pt.y)).toBe(true);
      expect(pt.x).toBeGreaterThanOrEqual(20);
      expect(pt.y).toBeGreaterThanOrEqual(20);
    }
  });

  it('progresses through PLACEMENT phase until all slugs are positioned', () => {
    const config: Partial<GameConfig> = {
      turnDuration: 45,
      slugsPerTeam: 2,
      slugHp: 100,
    };
    const engine = new SlugWarsEngine(config);
    engine.addTeam('team_a', 'Alpha', '#ef4444', '🐌', true);
    engine.addTeam('team_b', 'Bravo', '#3b82f6', '🐌', false);
    engine.startGame();

    expect(engine.state.phase).toBe('PLACEMENT');

    // Place all 4 slugs one by one
    for (let i = 0; i < 4; i++) {
      expect(engine.state.phase).toBe('PLACEMENT');
      const activeSlugId = engine.state.activeSlugId;
      expect(activeSlugId).toBeTruthy();

      const res = engine.placeSlug({ x: 400 + i * 100, y: 300 });
      expect(res).toBe(true);
    }

    // After last slug is placed, game transitions out of PLACEMENT
    expect(engine.state.phase).not.toBe('PLACEMENT');
    expect(['TURN_START', 'AIMING']).toContain(engine.state.phase);

    // Verify all slugs are marked placed, alive, and retain 100 HP across physics ticks
    for (let t = 0; t < 5; t++) {
      engine.tick();
    }
    for (const slug of engine.state.slugs) {
      expect(slug.isPlaced).toBe(true);
      expect(slug.isAlive).toBe(true);
      expect(slug.hp).toBe(100);
    }
  });
});

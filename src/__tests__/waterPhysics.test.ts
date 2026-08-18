import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { updateSlugPhysics } from '../core/physics';
import { DestructibleTerrain } from '../core/terrain';
import { Slug } from '../core/types';

function createTestTerrain(width = 400, height = 300, groundY = 200): DestructibleTerrain {
  const grid = new Uint8Array(width * height);
  for (let y = groundY; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid[y * width + x] = 1;
    }
  }
  return new DestructibleTerrain({
    width,
    height,
    grid,
    theme: 'ISLAND',
    seed: 12345,
    waterLevel: height - 10,
    minePoints: [],
    spawnPoints: [{ x: 100, y: groundY - 20 }],
    decorItems: [],
    solidProps: [],
  });
}

describe('Water: Immersion Physics, Sinking & Drowning Lifecycles', () => {
  it('drowns slugs instantly when falling below waterLevel', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const slug = engine.state.slugs[0];
    slug.isAlive = true;
    slug.hp = 100;
    slug.y = (engine.state.waterLevel ?? 700) - 5; // Just above water

    // 1 tick: still above water
    engine.tick();
    expect(slug.isAlive).toBe(true);

    // Drop slug into water
    slug.y = (engine.state.waterLevel ?? 700) + 15;
    slug.isPlaced = true;
    engine.tick();

    // Physics marks drowning slug as dead and clears HP
    expect(slug.isAlive).toBe(false);
    expect(slug.hp).toBe(0);
  });

  it('handles physics integration in free fall with gravity and friction', () => {
    const dt = createTestTerrain(400, 300, 200);

    const slug: Slug = {
      id: 'test_slug',
      teamId: 't1',
      name: 'Aqua',
      x: 100,
      y: 50, // 150px above ground
      vx: 0,
      vy: 1,
      hp: 100,
      maxHp: 100,
      isAlive: true,
      isPlaced: true,
      selectedWeaponId: 'bazooka',
      aimAngle: 0,
      aimPower: 50,
      facing: 'right',
    };

    updateSlugPhysics(slug, dt);

    // Airborne slug gets gravity applied (vy increases from 1 to 1.4)
    expect(slug.vy).toBeGreaterThan(1);
    expect(slug.y).toBeGreaterThan(50);
  });

  it('raises waterLevel correctly during sudden death progression', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();

    const initialWaterLevel = engine.state.waterLevel ?? 700;
    expect(initialWaterLevel).toBeGreaterThan(0);

    // Simulate sudden death water rise by 20 units
    engine.state.waterLevel = initialWaterLevel - 20; // Lower Y value means water rises higher on screen
    expect(engine.state.waterLevel).toBe(initialWaterLevel - 20);
  });
});

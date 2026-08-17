import { describe, it, expect } from 'vitest';
import { updateSlugPhysics, updateProjectilePhysics, isSlugGrounded, applyExplosionToSlugs } from '../core/physics';
import { DestructibleTerrain } from '../core/terrain';
import { Slug, ActiveProjectile, Team } from '../core/types';

function createFlatTerrain(width = 400, height = 300, groundY = 200): DestructibleTerrain {
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
    waterLevel: height - 10, // Water is at bottom
    minePoints: [],
    spawnPoints: [{ x: 100, y: groundY - 20 }],
    decorItems: [],
    solidProps: [],
  });
}

function createSlopeTerrain(width = 400, height = 300): DestructibleTerrain {
  const grid = new Uint8Array(width * height);
  for (let x = 0; x < width; x++) {
    const groundY = Math.round(250 - (x / width) * 100);
    for (let y = groundY; y < height; y++) {
      grid[y * width + x] = 1;
    }
  }
  return new DestructibleTerrain({
    width,
    height,
    grid,
    theme: 'ISLAND',
    seed: 12345,
    waterLevel: height - 10, // Water is at bottom
    minePoints: [],
    spawnPoints: [{ x: 50, y: 150 }],
    decorItems: [],
    solidProps: [],
  });
}

function createDummySlug(partial: Partial<Slug> = {}): Slug {
  return {
    id: 'slug_1',
    name: 'Test Slug',
    teamId: 'team_1',
    x: 100,
    y: 199,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    isAlive: true,
    isPlaced: true,
    facing: 'right',
    aimAngle: 45,
    aimPower: 50,
    selectedWeaponId: 'bazooka',
    ...partial,
  };
}

describe('Physics: Slug Movement & Collision', () => {
  it('detects a slug is grounded on flat terrain', () => {
    const terrain = createFlatTerrain(400, 300, 200);
    const slug = createDummySlug({ x: 100, y: 199 });
    expect(isSlugGrounded(slug, terrain, [slug])).toBe(true);
  });

  it('allows a slug to move horizontally across flat ground without getting stuck', () => {
    const terrain = createFlatTerrain(400, 300, 200);
    const slug = createDummySlug({ x: 100, y: 199, vx: 3.2, movingDir: 'right' });

    for (let i = 0; i < 5; i++) {
      slug.vx = 3.2;
      updateSlugPhysics(slug, terrain, [slug]);
    }

    expect(slug.x).toBeGreaterThan(110);
    expect(slug.y).toBeLessThanOrEqual(200);
    expect(slug.y).toBeGreaterThanOrEqual(180);
  });

  it('traverses moderate uphill slopes smoothly', () => {
    const terrain = createSlopeTerrain(400, 300);
    const slug = createDummySlug({ x: 50, y: 236, vx: 3.2, movingDir: 'right' });

    for (let i = 0; i < 10; i++) {
      slug.vx = 3.2;
      updateSlugPhysics(slug, terrain, [slug]);
    }

    expect(slug.x).toBeGreaterThan(65);
    expect(slug.y).toBeLessThan(238);
  });

  it('calculates fall damage when landing from a high fall', () => {
    const terrain = createFlatTerrain(400, 300, 200);
    const slug = createDummySlug({ x: 100, y: 20, vy: 5, fallStartY: 20 });

    for (let i = 0; i < 50; i++) {
      updateSlugPhysics(slug, terrain, [slug]);
    }

    expect(slug.hp).toBeLessThan(100);
  });
});

describe('Physics: Projectiles & Timers', () => {
  it('decrements fuse timer and detonates when fuse reaches 0', () => {
    const terrain = createFlatTerrain(400, 300, 200);
    const proj: ActiveProjectile = {
      id: 'proj_test_1',
      weaponId: 'grenade',
      x: 100,
      y: 100,
      vx: 2,
      vy: 0,
      radius: 5,
      bounces: true,
      windAffected: false,
      ownerSlugId: 'slug_1',
      fuseTimerMs: 150,
    };

    const dummySlug = createDummySlug({ x: 100, y: 199 });

    // Tick 1 (150 -> 100ms)
    updateProjectilePhysics(proj, terrain, 0, [dummySlug]);
    expect(proj.fuseTimerMs).toBe(100);

    // Tick 2 (100 -> 50ms)
    updateProjectilePhysics(proj, terrain, 0, [dummySlug]);
    expect(proj.fuseTimerMs).toBe(50);

    // Tick 3 (50 -> 0ms => explosion generated)
    const result = updateProjectilePhysics(proj, terrain, 0, [dummySlug]);
    expect(result.exploded).toBe(true);
    expect(result.collisionPoint).toBeDefined();
  });
});

describe('Physics: Explosions & Impulse', () => {
  it('applies radial damage and knockback impulse to nearby slugs', () => {
    const terrain = createFlatTerrain(400, 300, 200);
    const slug = createDummySlug({ x: 100, y: 199, hp: 100 });
    const dummyTeam: Team = {
      id: 'team_1',
      name: 'Team 1',
      color: '#ff0000',
      avatar: '🐌',
      isHost: true,
      inventory: {},
    };

    applyExplosionToSlugs(100, 199, 40, 50, [slug], terrain, [dummyTeam]);

    expect(slug.hp).toBeLessThan(100);
    expect(dummyTeam.stats?.damageTaken).toBeGreaterThan(0);
  });
});

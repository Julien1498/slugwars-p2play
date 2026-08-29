import { describe, it, expect, vi } from 'vitest';
import { updateProjectilePhysics, GRAVITY } from '../core/physics/projectilePhysics';
import { ActiveProjectile, Slug } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

describe('Projectile Physics Engine', () => {
  const createMockTerrain = (isSolidFn?: (x: number, y: number) => boolean): DestructibleTerrain => {
    return {
      data: {
        width: 1400,
        height: 800,
        waterLevel: 750,
      },
      isSolid: isSolidFn || (() => false),
      raycastSolid: (x1: number, y1: number, x2: number, y2: number) => {
        if (isSolidFn && (isSolidFn(x2, y2) || isSolidFn(Math.floor(x2), Math.floor(y2)))) {
          return { hit: true, x: x2, y: y2 };
        }
        return { hit: false };
      },
      getSurfaceNormal: () => ({ nx: 0, ny: -1 }),
    } as unknown as DestructibleTerrain;
  };

  const createBaseProjectile = (overrides?: Partial<ActiveProjectile>): ActiveProjectile => {
    return {
      id: 'proj_test',
      weaponId: 'bazooka',
      x: 100,
      y: 100,
      vx: 10,
      vy: 0,
      radius: 4,
      bounces: false,
      windAffected: false,
      ownerSlugId: 'slug_1',
      ...overrides,
    };
  };

  const mockSlugs: Slug[] = [
    {
      id: 'slug_1',
      teamId: 'team_1',
      name: 'Owner Slug',
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      isAlive: true,
      facing: 'right',
      aimAngle: 0,
      aimPower: 50,
      selectedWeaponId: 'bazooka',
      isPlaced: true,
    },
    {
      id: 'slug_2',
      teamId: 'team_2',
      name: 'Enemy Slug',
      x: 300,
      y: 200,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      isAlive: true,
      facing: 'left',
      aimAngle: 0,
      aimPower: 50,
      selectedWeaponId: 'bazooka',
      isPlaced: true,
    },
  ];

  describe('Standard Ballistics & Gravity Scaling', () => {
    it('applies standard gravity when gravityScale is omitted or 1', () => {
      const terrain = createMockTerrain();
      const proj = createBaseProjectile({ vx: 5, vy: 2 });
      const initialVy = proj.vy;

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(false);
      expect(proj.vy).toBeCloseTo(initialVy + GRAVITY);
      expect(proj.x).toBe(105);
      expect(proj.y).toBeCloseTo(100 + initialVy + GRAVITY);
    });

    it('applies custom gravityScale (e.g. 1.5x for heavy projectiles, 0 for flying projectiles)', () => {
      const terrain = createMockTerrain();
      
      // Heavy projectile (gravityScale: 1.5)
      const heavyProj = createBaseProjectile({ gravityScale: 1.5, vy: 0 });
      updateProjectilePhysics(heavyProj, terrain, 0, mockSlugs);
      expect(heavyProj.vy).toBeCloseTo(GRAVITY * 1.5);

      // Flying / zero gravity projectile (gravityScale: 0)
      const flyingProj = createBaseProjectile({ gravityScale: 0, vy: -5 });
      updateProjectilePhysics(flyingProj, terrain, 0, mockSlugs);
      expect(flyingProj.vy).toBeCloseTo(-5);
    });

    it('applies wind when windAffected is true', () => {
      const terrain = createMockTerrain();
      const proj = createBaseProjectile({ windAffected: true, vx: 5 });
      const wind = 20;

      updateProjectilePhysics(proj, terrain, wind, mockSlugs);

      expect(proj.vx).toBeCloseTo(5 + wind * 0.02);
    });
  });

  describe('Fuse Timer & Ocean Water Collision', () => {
    it('explodes when fuseTimerMs reaches 0', () => {
      const terrain = createMockTerrain();
      const proj = createBaseProjectile({ fuseTimerMs: 50 });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(true);
      expect(res.collisionPoint).toEqual({ x: 100, y: 100 });
    });

    it('explodes on water level contact', () => {
      const terrain = createMockTerrain();
      const proj = createBaseProjectile({ x: 200, y: 745, vy: 10 }); // Reaches 755 (waterLevel=750)

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(true);
      expect(res.collisionPoint?.y).toBe(750);
    });
  });

  describe('Homing Vector Guidance (Data-Driven)', () => {
    it('steers towards target point according to turnSpeed and speed', () => {
      const terrain = createMockTerrain();
      const targetPoint = { x: 500, y: 100 };
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        vx: 0,
        vy: -5,
        targetPoint,
        homingConfig: {
          speed: 10,
          turnSpeed: 0.5,
          minTargetDist: 15,
        },
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(false);
      expect(proj.vx).toBeGreaterThan(0); // Steered towards positive X
    });

    it('explodes when distance to target point is within minTargetDist', () => {
      const terrain = createMockTerrain();
      const targetPoint = { x: 110, y: 100 };
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        targetPoint,
        homingConfig: {
          speed: 10,
          turnSpeed: 0.5,
          minTargetDist: 15,
        },
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(true);
    });

    it('follows ballistic trajectory during initial homingDelayMs before engaging guidance', () => {
      const terrain = createMockTerrain();
      const targetPoint = { x: 500, y: 100 };
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        vx: 10,
        vy: -5,
        targetPoint,
        homingConfig: {
          speed: 13,
          turnSpeed: 0.28,
          delayMs: 200,
        },
      });

      // Tick 1: Still in delay mode
      updateProjectilePhysics(proj, terrain, 0, mockSlugs);
      expect(proj.behaviorData?.homingDelayMs).toBe(150);
      expect(proj.vy).toBeCloseTo(-5 + GRAVITY);

      // Tick 2: Still in delay mode
      updateProjectilePhysics(proj, terrain, 0, mockSlugs);
      expect(proj.behaviorData?.homingDelayMs).toBe(100);
    });
  });

  describe('Impact Behaviors: EXPLODE, BOUNCE, REST', () => {
    it('REST: stops dead on terrain collision without exploding (e.g. Dynamite)', () => {
      const terrain = createMockTerrain((x, y) => y >= 105);
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        vx: 4,
        vy: 10,
        impactBehavior: 'REST',
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(false);
      expect(proj.vx).toBe(0);
      expect(proj.vy).toBe(0);
    });

    it('BOUNCE: reflects velocity along surface normal with friction and elasticity', () => {
      const terrain = createMockTerrain((x, y) => y >= 105);
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        vx: 5,
        vy: 10,
        bounces: true,
        impactBehavior: 'BOUNCE',
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(false);
      expect(proj.vy).toBeLessThan(0); // Upward reflection
    });

    it('EXPLODE: detonates immediately on solid terrain impact', () => {
      const terrain = createMockTerrain((x, y) => y >= 105);
      const proj = createBaseProjectile({
        x: 100,
        y: 100,
        vx: 0,
        vy: 10,
        impactBehavior: 'EXPLODE',
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(true);
      expect(res.collisionPoint).toBeDefined();
    });

    it('EXPLODE: detonates when colliding with an enemy slug', () => {
      const terrain = createMockTerrain();
      const proj = createBaseProjectile({
        x: 295,
        y: 192,
        vx: 5,
        vy: 0,
        ownerSlugId: 'slug_1',
        impactBehavior: 'EXPLODE',
      });

      const res = updateProjectilePhysics(proj, terrain, 0, mockSlugs);

      expect(res.exploded).toBe(true);
      expect(res.collisionPoint?.x).toBe(300);
    });
  });
});

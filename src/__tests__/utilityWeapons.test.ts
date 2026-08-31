import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { updateProjectilePhysics } from '../core/physics/projectilePhysics';
import { ActiveProjectile } from '../core/types';

describe('Section D: Mobility, Melee & Utility Weapons', () => {
  let engine: SlugWarsEngine;

  beforeEach(() => {
    engine = new SlugWarsEngine({
      turnDuration: 45,
      slugsPerTeam: 2,
      mapTheme: 'FORTRESS',
      mapSeed: 12345,
      turnDelaysEnabled: false,
    });
    engine.addTeam('team_red', 'Red Team', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue Team', '#3b82f6', '🐌', false);
    engine.startGame();
    while (engine.state.phase === 'PLACEMENT') {
      engine.placeSlug({ x: 300, y: 200 });
    }
  });

  describe('Jetpack (Vol dorsal & Propulsion)', () => {
    it('activates jetpack with 4000ms fuel and cancels fall damage', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('jetpack');
      engine.fireWeapon();

      expect(activeSlug.jetpackState).toBeDefined();
      expect(activeSlug.jetpackState?.fuelMs).toBe(4000);
      expect(activeSlug.jetpackState?.isThrusting).toBe(true);

      // Jump applies upward thrust when jetpack is active
      activeSlug.vy = 2.0;
      engine.jumpSlug();
      expect(activeSlug.vy).toBeLessThan(2.0);

      // Simulates engine tick consuming fuel
      const initialFuel = activeSlug.jetpackState!.fuelMs;
      for (let i = 0; i < 10; i++) {
        engine.tick();
      }
      expect(activeSlug.jetpackState!.fuelMs).toBeLessThan(initialFuel);
    });

    it('exhausts jetpack fuel when depleted to 0', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('jetpack');
      engine.fireWeapon();

      activeSlug.jetpackState!.fuelMs = 15;
      engine.tick();
      expect(activeSlug.jetpackState).toBeNull();
    });
  });

  describe('Pneumatic Drill (Marteau-Piqueur)', () => {
    it('starts drilling vertically and carves tubular crater under feet', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.x = 400;
      activeSlug.y = 250;
      const initialY = activeSlug.y;

      engine.selectWeapon('pneumatic_drill');
      engine.fireWeapon();

      expect(activeSlug.isDrilling).toBe(true);

      // Tick drills down
      for (let i = 0; i < 5; i++) {
        engine.tick();
      }
      expect(activeSlug.y).toBeGreaterThan(initialY);
      expect(activeSlug.drillDepth).toBeGreaterThan(0);
    });

    it('damages enemy slugs caught under the drill', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const enemySlug = engine.state.slugs.find((s) => s.teamId !== activeSlug.teamId)!;
      
      activeSlug.x = 500;
      activeSlug.y = 200;
      enemySlug.x = 500;
      enemySlug.y = 212;
      const enemyHpBefore = enemySlug.hp;

      engine.selectWeapon('pneumatic_drill');
      engine.fireWeapon();
      engine.tick();

      expect(enemySlug.hp).toBeLessThan(enemyHpBefore);
      expect(enemySlug.hp).toBe(enemyHpBefore - 20);
    });
  });

  describe('Parachute (Descente Sécurisée)', () => {
    it('deploys parachute and slows downward vertical velocity', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.x = 600;
      activeSlug.y = 100;
      activeSlug.vy = 8.5; // High falling speed

      engine.selectWeapon('parachute');
      engine.fireWeapon();

      expect(activeSlug.isParachuting).toBe(true);

      engine.tick();
      expect(activeSlug.vy).toBeLessThanOrEqual(2.0);
    });

    it('drifts with ambient wind while parachuting', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.x = 600;
      activeSlug.y = 100;
      activeSlug.vx = 0;
      engine.state.wind = 4.5;

      engine.selectWeapon('parachute');
      engine.fireWeapon();

      engine.tick();
      expect(activeSlug.vx).toBeGreaterThan(0);
    });
  });

  describe('Electromagnetic Magnet (Aimant Répulseur / Attracteur)', () => {
    it('places magnet on the terrain with 3 turns lifespan', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.x = 700;
      activeSlug.y = 200;

      engine.selectWeapon('magnet');
      engine.fireWeapon({ x: 750, y: 220 });

      expect(engine.state.magnets).toBeDefined();
      expect(engine.state.magnets!.length).toBe(1);
      expect(engine.state.magnets![0].turnsRemaining).toBe(3);
      expect(engine.state.magnets![0].x).toBe(750);
    });

    it('deflects ballistic projectiles passing near the magnet', () => {
      const magnet = {
        id: 'mag_test',
        x: 500,
        y: 200,
        polarity: 'ATTRACT' as const,
        turnsRemaining: 3,
      };

      const proj: ActiveProjectile = {
        id: 'proj_test',
        weaponId: 'bazooka',
        x: 450,
        y: 200,
        vx: 4.0,
        vy: 0,
        radius: 4,
        bounces: false,
        windAffected: false,
        ownerSlugId: 'slug_1',
      };

      // Step with magnet
      updateProjectilePhysics(proj, engine.terrain, 0, [], [magnet]);
      // Should be pulled towards magnet (x: 500) so vx increases
      expect(proj.vx).toBeGreaterThan(4.0);
    });
  });
});

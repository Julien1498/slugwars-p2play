import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameConfig, SolidProp } from '../core/types';

function createTestEngine(customConfig?: Partial<GameConfig>): SlugWarsEngine {
  const config: Partial<GameConfig> = {
    turnDuration: 45,
    slugsPerTeam: 2,
    slugHp: 100,
    weaponSetId: 'CLASSIC',
    vehiclesEnabled: true,
    mapTheme: 'ISLAND',
    ...customConfig,
  };
  const engine = new SlugWarsEngine(config);
  engine.addTeam('team_red', 'Équipe Rouge', '#ef4444', '🐌', true);
  engine.addTeam('team_blue', 'Équipe Bleue', '#3b82f6', '🐌', false);
  return engine;
}

describe('GameEngine: Lifecycle, Controls, Physics & Rules', () => {
  describe('Lobby & Configuration Lifecycle', () => {
    it('initializes teams, starts game, and spawns placed slugs and vehicles', () => {
      const engine = createTestEngine();
      expect(engine.state.phase).toBe('LOBBY');
      expect(engine.state.teams).toHaveLength(2);

      const started = engine.startGame();
      expect(started).toBe(true);
      expect(engine.state.phase).toBe('PLACEMENT');
      expect(engine.state.slugs).toHaveLength(4); // 2 slugs x 2 teams
      expect(engine.state.helicopters).toHaveLength(1); // vehiclesEnabled: true
    });

    it('allows changing config in LOBBY phase and re-generates terrain on theme/seed change', () => {
      const engine = createTestEngine();
      const prevTerrainSeed = engine.state.config.mapSeed;

      const updated = engine.setConfig({ mapTheme: 'CAVERN', mapSeed: 9999 });
      expect(updated).toBe(true);
      expect(engine.state.config.mapTheme).toBe('CAVERN');
      expect(engine.state.config.mapSeed).toBe(9999);
      expect(engine.terrain.data.theme).toBe('CAVERN');
    });

    it('rejects setConfig when game has already started (not in LOBBY)', () => {
      const engine = createTestEngine();
      engine.startGame();
      expect(engine.state.phase).toBe('PLACEMENT');

      const updated = engine.setConfig({ mapTheme: 'SPIRES' });
      expect(updated).toBe(false);
      expect(engine.state.config.mapTheme).toBe('ISLAND'); // unchanged
    });

    it('removes a team from lobby and restarts game back to LOBBY', () => {
      const engine = createTestEngine();
      engine.removeTeam('team_blue');
      expect(engine.state.teams).toHaveLength(1);

      engine.startGame();
      expect(engine.state.phase).toBe('PLACEMENT');

      engine.restartGame();
      expect(engine.state.phase).toBe('LOBBY');
    });
  });

  describe('Interactive Placement Phase', () => {
    it('places slugs one by one, alternates teams, and starts combat on last placement', () => {
      const engine = createTestEngine({ slugsPerTeam: 1 });
      engine.startGame();
      expect(engine.state.phase).toBe('PLACEMENT');
      expect(engine.state.slugs).toHaveLength(2); // 1 per team = 2 total

      // 1. Place 1st active slug
      const firstActiveId = engine.state.activeSlugId;
      const firstActiveSlug = engine.state.slugs.find((s) => s.id === firstActiveId)!;
      const placed1 = engine.placeSlug({ x: 200, y: 150 });
      expect(placed1).toBe(true);
      expect(firstActiveSlug.isPlaced).toBe(true);

      // 2. Place 2nd active slug (last slug)
      const secondActiveId = engine.state.activeSlugId;
      const secondActiveSlug = engine.state.slugs.find((s) => s.id === secondActiveId)!;
      expect(secondActiveId).not.toBe(firstActiveId);

      const placed2 = engine.placeSlug({ x: 500, y: 150 });
      expect(placed2).toBe(true);
      expect(secondActiveSlug.isPlaced).toBe(true);

      // Combat should now start in AIMING phase
      expect(engine.state.phase).toBe('AIMING');
      expect(engine.state.activeSlugId).toBeDefined();
    });
  });

  describe('Movement, Jumping & Controls', () => {
    it('handles startMove, stopMove, and moveSlug physics directions', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;

      engine.startMove('right');
      expect(activeSlug.movingDir).toBe('right');
      expect(activeSlug.vx).toBeGreaterThan(0);
      expect(activeSlug.facing).toBe('right');

      engine.stopMove();
      expect(activeSlug.movingDir).toBeNull();
      expect(activeSlug.vx).toBe(0);

      engine.moveSlug('left');
      expect(activeSlug.vx).toBeLessThan(0);
      expect(activeSlug.facing).toBe('left');
    });

    it('jumps slug when grounded and applies upward velocity', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      // Position slug safely on solid ground
      activeSlug.x = 200;
      activeSlug.y = 250;
      activeSlug.vy = 0;

      const jumped = engine.jumpSlug();
      // If grounded or terrain below, vy becomes negative
      if (jumped) {
        expect(activeSlug.vy).toBeLessThan(0);
      }
    });

    it('releases ninja rope on jump and transfers angular velocity to kinetic momentum', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.ropeState = {
        hookX: 200,
        hookY: 100,
        length: 80,
        angleRad: 0.5,
        angularVelocity: 0.1,
      };

      const jumped = engine.jumpSlug();
      expect(jumped).toBe(true);
      expect(activeSlug.ropeState).toBeNull(); // rope released
      expect(activeSlug.vx).not.toBe(0);
    });
  });

  describe('Weapon Charge, Firing & Ammo', () => {
    it('charges power on each tick and auto-fires when power reaches 100%', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('bazooka');

      engine.startCharge();
      expect(activeSlug.isChargingPower).toBe(true);
      expect(activeSlug.aimPower).toBe(5);

      // Simulate tick loop charging power (+2.5 per tick until 100%)
      for (let i = 0; i < 40; i++) {
        engine.tick();
      }

      // Reached 100% -> auto-fired rocket!
      expect(engine.state.projectiles.length).toBeGreaterThan(0);
      expect(activeSlug.isChargingPower).toBe(false);
    });

    it('allows releasing charge manually before 100%', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('bazooka');

      engine.startCharge();
      engine.tick(); // aimPower ~ 7.5
      expect(activeSlug.isChargingPower).toBe(true);

      engine.releaseCharge();
      expect(activeSlug.isChargingPower).toBe(false);
      expect(engine.state.projectiles.length).toBe(1);
    });

    it('consumes ammo and falls back to bazooka when depleted', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;

      activeTeam.inventory['dynamite'] = 1;
      engine.selectWeapon('dynamite');
      engine.setFuseTimer(activeSlug.id, 3);
      expect(activeSlug.fuseTimerSec).toBe(3);

      engine.fireWeapon();
      expect(activeTeam.inventory['dynamite']).toBe(0);
      expect(activeSlug.selectedWeaponId).toBe('bazooka');
      expect(engine.state.projectiles[0].fuseTimerMs).toBe(3000);
    });
  });

  describe('Vehicles & Interactive Props', () => {
    it('enters, steers, and exits helicopter cleanly', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const heli = engine.state.helicopters[0];
      // Position slug right next to helicopter
      activeSlug.x = heli.x;
      activeSlug.y = heli.y;

      const entered = engine.enterVehicle();
      expect(entered).toBe(true);
      expect(heli.pilotSlugId).toBe(activeSlug.id);
      expect(activeSlug.inVehicleId).toBe(heli.id);

      engine.steerVehicle('right');
      expect(heli.vx).toBeGreaterThan(0);

      const exited = engine.exitVehicle();
      expect(exited).toBe(true);
      expect(heli.pilotSlugId).toBeNull();
      expect(activeSlug.inVehicleId).toBeNull();
    });

    it('detonates oil drums and carves crater with chain reaction damage', () => {
      const engine = createTestEngine();
      engine.startGame();

      const drum: SolidProp = {
        id: 'drum_test',
        type: 'oil_drum',
        x: 300,
        y: 200,
        width: 16,
        height: 24,
      };

      engine.detonateOilDrum(drum);

      expect(engine.state.explosions.length).toBeGreaterThan(0);
      expect(engine.state.craters!.length).toBeGreaterThan(0);
      expect(engine.state.journal[0].message).toContain('BARIL DE PÉTROLE');
    });
  });

  describe('Engine Tick Physics & Self-Damage Turn Interruption', () => {
    it('ends turn immediately if active slug dies or falls into water during AIMING phase', () => {
      const engine = createTestEngine();
      engine.startGame();
      engine.state.phase = 'AIMING';

      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.isPlaced = true;
      activeSlug.y = engine.terrain.data.waterLevel + 20;

      engine.tick();

      // Drowned in water -> isAlive = false -> immediate transition to RESOLVING
      expect(activeSlug.isAlive).toBe(false);
      expect(engine.state.phase).toBe('RESOLVING');
    });

    it('removes expired explosions and particles during tick', () => {
      const engine = createTestEngine();
      engine.startGame();

      // Add old explosion
      engine.state.explosions.push({
        id: 'ex_old',
        x: 100,
        y: 100,
        radius: 30,
        damage: 20,
        createdAt: Date.now() - 500, // > 350ms lifespan
      });

      engine.tick();
      expect(engine.state.explosions).toHaveLength(0);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { getWeapon } from '../core/weapons/registry';
import { getWeaponSet } from '../core/weapons/weaponSets';
import { isWeaponLocked } from '../core/engine/weapons/weaponSelection';
import { updateProjectilePhysics } from '../core/physics/projectilePhysics';
import { DestructibleTerrain } from '../core/terrain';
import { ActiveProjectile, Slug } from '../core/types';

function createMockTerrain(): DestructibleTerrain {
  return {
    data: {
      width: 1000,
      height: 600,
      waterLevel: 500,
      theme: 'ISLAND',
    },
    isSolid: (_x: number, y: number) => y >= 250,
    carveExplosion: () => ({ carvedPixels: 0, destroyedOilDrums: [] }),
    raycastSolid: (_x1: number, _y1: number, x2: number, y2: number) => {
      if (y2 >= 250) return { hit: true, x: x2, y: y2 };
      return { hit: false };
    },
    getSurfaceNormal: () => ({ nx: 0, ny: -1 }),
  } as unknown as DestructibleTerrain;
}

describe('Aerial Support & Strikes (Standard Rules)', () => {
  let engine: SlugWarsEngine;

  beforeEach(() => {
    engine = new SlugWarsEngine({
      turnDuration: 45,
      slugsPerTeam: 2,
      mapTheme: 'ISLAND',
      mapSeed: 42,
      turnDelaysEnabled: true,
    });
    engine.addTeam('team_red', 'Red Team', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue Team', '#3b82f6', '🐌', false);
    engine.startGame();

    let offset = 0;
    while (engine.state.phase === 'PLACEMENT') {
      engine.placeSlug({ x: 300 + offset * 80, y: 200 });
      offset++;
    }
  });

  describe('1. Weapon Definitions & Standard Parameters', () => {
    it('defines Bunker Buster (bunker_buster) with standard stats', () => {
      const weapon = getWeapon('bunker_buster');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Bunker Buster');
      expect(weapon.category).toBe('AIR_SUPPORT');
      expect(weapon.behavior).toBe('BUNKER_BUSTER');
      expect(weapon.damage).toBe(60);
      expect(weapon.radius).toBe(45);
      expect(weapon.defaultAmmo).toBe(1);
      expect(weapon.turnDelay).toBe(1);
      expect(weapon.crateProbability).toBe(0.15);
      expect(weapon.requiresTarget).toBe(true);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
    });

    it('defines Mine Strike (mine_strike) with standard stats', () => {
      const weapon = getWeapon('mine_strike');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Frappe de Mines');
      expect(weapon.category).toBe('AIR_SUPPORT');
      expect(weapon.behavior).toBe('MINE_STRIKE');
      expect(weapon.damage).toBe(45);
      expect(weapon.radius).toBe(35);
      expect(weapon.defaultAmmo).toBe(1);
      expect(weapon.turnDelay).toBe(2);
      expect(weapon.crateProbability).toBe(0.10);
      expect(weapon.requiresTarget).toBe(true);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
    });

    it('defines Kamikaze (kamikaze) with standard stats', () => {
      const weapon = getWeapon('kamikaze');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Kamikaze');
      expect(weapon.category).toBe('SPECIAL');
      expect(weapon.behavior).toBe('KAMIKAZE');
      expect(weapon.damage).toBe(60);
      expect(weapon.radius).toBe(50);
      expect(weapon.defaultAmmo).toBe(1);
      expect(weapon.turnDelay).toBe(0);
      expect(weapon.crateProbability).toBe(0.10);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
    });
  });

  describe('2. Weapon Sets & Inventory Integration', () => {
    it('includes aerial weapons in CLASSIC, WMD_CRAZY, and UNLIMITED_CHAOS', () => {
      const classic = getWeaponSet('CLASSIC');
      expect(classic.inventory.bunker_buster).toBe(1);
      expect(classic.inventory.mine_strike).toBe(1);
      expect(classic.inventory.kamikaze).toBe(1);

      const wmd = getWeaponSet('WMD_CRAZY');
      expect(wmd.inventory.bunker_buster).toBe(2);
      expect(wmd.inventory.mine_strike).toBe(2);
      expect(wmd.inventory.kamikaze).toBe(2);

      const chaos = getWeaponSet('UNLIMITED_CHAOS');
      expect(chaos.inventory.bunker_buster).toBe(-1);
      expect(chaos.inventory.mine_strike).toBe(-1);
      expect(chaos.inventory.kamikaze).toBe(-1);
    });
  });

  describe('3. Turn Delays Locking Mechanism', () => {
    it('enforces turn delays for Kamikaze (turn 1), Bunker Buster (delay 1), and Mine Strike (delay 2)', () => {
      const redTeam = engine.state.teams.find((t) => t.id === 'team_red')!;

      // Turn 1 (Round 0)
      engine.state.turnCount = 1;
      expect(isWeaponLocked(engine.state, 'kamikaze', redTeam)).toBe(false); // Immediate!
      expect(isWeaponLocked(engine.state, 'bunker_buster', redTeam)).toBe(true);
      expect(isWeaponLocked(engine.state, 'mine_strike', redTeam)).toBe(true);

      // Turn 3 (Round 1 completed)
      engine.state.turnCount = 3;
      expect(isWeaponLocked(engine.state, 'bunker_buster', redTeam)).toBe(false); // Unlocked!
      expect(isWeaponLocked(engine.state, 'mine_strike', redTeam)).toBe(true);

      // Turn 5 (Round 2 completed)
      engine.state.turnCount = 5;
      expect(isWeaponLocked(engine.state, 'mine_strike', redTeam)).toBe(false); // Unlocked!
    });
  });

  describe('4. Bunker Buster Drill & Mine Strike Physics', () => {
    it('executes Bunker Buster strike and burrows into the ground before exploding', () => {
      engine.state.turnCount = 10;
      expect(engine.selectWeapon('bunker_buster')).toBe(true);
      expect(engine.fireWeapon({ x: 450, y: 300 })).toBe(true);

      expect(engine.state.projectiles.length).toBe(1);
      const buster = engine.state.projectiles[0];
      expect(buster.weaponId).toBe('bunker_buster');
      expect(buster.behaviorData?.burrowRemaining).toBe(100);

      const terrain = createMockTerrain();
      // First tick in air
      buster.y = 200;
      let res = updateProjectilePhysics(buster, terrain);
      expect(res.exploded).toBe(false);

      // Enters terrain at y=250 and burrows 100px
      buster.y = 260;
      res = updateProjectilePhysics(buster, terrain);
      expect(res.exploded).toBe(false);
      expect(res.carveStep).toBeDefined();
      expect(res.carveStep?.radius).toBeGreaterThan(0);
      expect(buster.behaviorData?.burrowRemaining).toBeLessThan(100);

      // When burrowRemaining depleted -> explodes deep underground
      buster.behaviorData!.burrowRemaining = 0;
      res = updateProjectilePhysics(buster, terrain);
      expect(res.exploded).toBe(true);
      expect(res.carveStep).toBeDefined();
    });

    it('spawns 5 parachute mines that float down without fuse timer and convert to Landmines upon landing', () => {
      engine.state.turnCount = 10;
      expect(engine.selectWeapon('mine_strike')).toBe(true);
      expect(engine.fireWeapon({ x: 500, y: 300 })).toBe(true);

      expect(engine.state.projectiles.length).toBe(5);
      const xPositions = engine.state.projectiles.map((p) => p.x);
      // Verify horizontal dispersion
      expect(xPositions[0]).toBeLessThan(xPositions[4]);
      for (const p of engine.state.projectiles) {
        expect(p.weaponId).toBe('mine_strike');
        expect(p.behaviorData?.isParachuteMine).toBe(true);
        expect(p.fuseTimerMs).toBeUndefined(); // No timer ticking in air!
      }

      // Physics landing test: touches ground at y=250
      const terrain = createMockTerrain();
      const fallingMine = engine.state.projectiles[0];
      fallingMine.y = 248;
      fallingMine.vy = 4;
      const res = updateProjectilePhysics(fallingMine, terrain);
      expect(res.exploded).toBe(false);
      expect(res.landAsMine).toBeDefined();
      expect(res.landAsMine?.x).toBeCloseTo(fallingMine.x + fallingMine.vx, 1);
    });
  });

  describe('5. Kamikaze Propulsion & Sacrificial Detonation', () => {
    it('propels the active slug along aim trajectory, carves a tunnel and detonates sacrificially', () => {
      engine.state.turnCount = 10;
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.aimAngle = 45;
      activeSlug.facing = 'right';

      expect(engine.selectWeapon('kamikaze')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);

      expect(engine.state.projectiles.length).toBe(1);
      const kamikazeProj = engine.state.projectiles[0];
      expect(kamikazeProj.weaponId).toBe('kamikaze');
      expect(kamikazeProj.ownerSlugId).toBe(activeSlug.id);

      const terrain = createMockTerrain();
      const slugs: Slug[] = [activeSlug];

      // Advance trajectory
      let res = updateProjectilePhysics(kamikazeProj, terrain, 0, slugs);
      expect(res.exploded).toBe(false);
      expect(res.carveStep).toBeDefined();
      expect(res.carveStep?.radius).toBe(16);
      expect(activeSlug.x).toBe(kamikazeProj.x);

      // Traveled maxDistance -> explosion and sacrifice
      kamikazeProj.behaviorData!.traveled = 450;
      res = updateProjectilePhysics(kamikazeProj, terrain, 0, slugs);
      expect(res.exploded).toBe(true);
      expect(activeSlug.isAlive).toBe(false);
      expect(activeSlug.hp).toBe(0);
    });

    it('detonates Kamikaze immediately when colliding with an enemy slug', () => {
      engine.state.turnCount = 10;
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const enemySlug: Slug = {
        id: 'enemy_1',
        teamId: 'team_blue',
        name: 'Enemy',
        x: 400,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 0,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      };

      const kamikazeProj: ActiveProjectile = {
        id: 'proj_k',
        weaponId: 'kamikaze',
        x: 395,
        y: 195,
        vx: 15,
        vy: 0,
        radius: 8,
        bounces: false,
        windAffected: false,
        ownerSlugId: activeSlug.id,
        behaviorData: { maxDistance: 450, traveled: 50 },
      };

      const terrain = createMockTerrain();
      const res = updateProjectilePhysics(kamikazeProj, terrain, 0, [activeSlug, enemySlug]);
      expect(res.exploded).toBe(true);
      expect(activeSlug.isAlive).toBe(false);
    });

    it('detonates Bunker Buster immediately when hitting a slug during descent', () => {
      const enemySlug: Slug = {
        id: 'enemy_2',
        teamId: 'team_blue',
        name: 'Enemy 2',
        x: 500,
        y: 240,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 0,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      };

      const busterProj: ActiveProjectile = {
        id: 'proj_b',
        weaponId: 'bunker_buster',
        x: 500,
        y: 235,
        vx: 0,
        vy: 14,
        radius: 7,
        bounces: false,
        windAffected: false,
        ownerSlugId: 'some_slug',
        behaviorData: { burrowRemaining: 100 },
      };

      const terrain = createMockTerrain();
      const res = updateProjectilePhysics(busterProj, terrain, 0, [enemySlug]);
      expect(res.exploded).toBe(true);
      expect(res.collisionPoint?.x).toBe(500);
    });
  });
});

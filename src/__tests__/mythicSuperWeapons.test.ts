import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { getWeapon } from '../core/weapons/registry';
import { getWeaponSet } from '../core/weapons/weaponSets';
import { isWeaponLocked } from '../core/engine/weapons/weaponSelection';
import { updateWalkingEntityPhysics } from '../core/physics/walkingEntityPhysics';
import { DestructibleTerrain } from '../core/terrain';
import { ActiveProjectile, GameState } from '../core/types';

function createTestTerrain(): DestructibleTerrain {
  return {
    data: {
      width: 1000,
      height: 600,
      waterLevel: 500,
      theme: 'ISLAND',
    },
    isSolid: (_x: number, y: number) => y >= 300,
    raycastSolid: (_x1: number, _y1: number, x2: number, y2: number) => {
      if (y2 >= 300) return { hit: true, x: x2, y: y2 };
      return { hit: false };
    },
    getSurfaceNormal: () => ({ nx: 0, ny: -1 }),
  } as unknown as DestructibleTerrain;
}

describe('Mythic & Devastating Super-Weapons (Standard Rules)', () => {
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
      engine.placeSlug({ x: 300 + offset * 80, y: 250 });
      offset++;
    }
  });

  describe('1. Weapon Definitions & Standard Parameters', () => {
    it('defines Sheep (sheep) with standard stats', () => {
      const weapon = getWeapon('sheep');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Mouton');
      expect(weapon.category).toBe('SPECIAL');
      expect(weapon.behavior).toBe('WALKER');
      expect(weapon.damage).toBe(70);
      expect(weapon.radius).toBe(55);
      expect(weapon.defaultAmmo).toBe(2);
      expect(weapon.turnDelay).toBe(2);
      expect(weapon.crateProbability).toBe(0.15);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
      expect(weapon.fuseTimeMs).toBe(8000);
    });

    it('defines Old Lady (old_lady) with standard stats', () => {
      const weapon = getWeapon('old_lady');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Vieille Dame');
      expect(weapon.category).toBe('SPECIAL');
      expect(weapon.behavior).toBe('WALKER');
      expect(weapon.damage).toBe(75);
      expect(weapon.radius).toBe(60);
      expect(weapon.defaultAmmo).toBe(1);
      expect(weapon.turnDelay).toBe(4);
      expect(weapon.crateProbability).toBe(0.10);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
      expect(weapon.fuseTimeMs).toBe(5000);
    });

    it('defines Armageddon (armageddon) with standard stats', () => {
      const weapon = getWeapon('armageddon');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Armageddon');
      expect(weapon.category).toBe('SPECIAL');
      expect(weapon.behavior).toBe('GLOBAL_STRIKE');
      expect(weapon.damage).toBe(60);
      expect(weapon.radius).toBe(45);
      expect(weapon.defaultAmmo).toBe(0);
      expect(weapon.turnDelay).toBe(6);
      expect(weapon.crateProbability).toBe(0.05);
      expect(weapon.triggersRetreat).toBe(true);
      expect(weapon.chargeable).toBe(false);
    });

    it('defines Meteor (meteor) sub-munition with standard stats', () => {
      const weapon = getWeapon('meteor');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Météore');
      expect(weapon.damage).toBe(60);
      expect(weapon.radius).toBe(45);
    });
  });

  describe('2. Weapon Sets & Inventory Integration', () => {
    it('includes mythic weapons in CLASSIC, WMD_CRAZY, and UNLIMITED_CHAOS', () => {
      const classic = getWeaponSet('CLASSIC');
      expect(classic.inventory.sheep).toBe(2);
      expect(classic.inventory.old_lady).toBe(1);
      expect(classic.inventory.armageddon).toBe(0);

      const wmd = getWeaponSet('WMD_CRAZY');
      expect(wmd.inventory.sheep).toBe(4);
      expect(wmd.inventory.old_lady).toBe(2);
      expect(wmd.inventory.armageddon).toBe(1);

      const chaos = getWeaponSet('UNLIMITED_CHAOS');
      expect(chaos.inventory.sheep).toBe(-1);
      expect(chaos.inventory.old_lady).toBe(-1);
      expect(chaos.inventory.armageddon).toBe(-1);
    });
  });

  describe('3. Turn Delays Locking Mechanism', () => {
    it('enforces turn delays for Sheep (delay 2), Old Lady (delay 4), and Armageddon (delay 6)', () => {
      const redTeam = engine.state.teams.find((t) => t.id === 'team_red')!;

      // Turn 1 (Round 0)
      engine.state.turnCount = 1;
      expect(isWeaponLocked(engine.state, 'sheep', redTeam)).toBe(true);
      expect(isWeaponLocked(engine.state, 'old_lady', redTeam)).toBe(true);
      expect(isWeaponLocked(engine.state, 'armageddon', redTeam)).toBe(true);

      // Turn 5 (Round 2 completed)
      engine.state.turnCount = 5;
      expect(isWeaponLocked(engine.state, 'sheep', redTeam)).toBe(false); // Unlocked!
      expect(isWeaponLocked(engine.state, 'old_lady', redTeam)).toBe(true);
      expect(isWeaponLocked(engine.state, 'armageddon', redTeam)).toBe(true);

      // Turn 9 (Round 4 completed)
      engine.state.turnCount = 9;
      expect(isWeaponLocked(engine.state, 'old_lady', redTeam)).toBe(false); // Unlocked!
      expect(isWeaponLocked(engine.state, 'armageddon', redTeam)).toBe(true);

      // Turn 13 (Round 6 completed)
      engine.state.turnCount = 13;
      expect(isWeaponLocked(engine.state, 'armageddon', redTeam)).toBe(false); // Unlocked!
    });
  });

  describe('4. Autonomous Walking Entity Physics', () => {
    it('advances Sheep along the terrain, hops obstacles, and flips direction at edges', () => {
      const terrain = createTestTerrain();
      const proj: ActiveProjectile = {
        id: 'proj_sheep_test',
        weaponId: 'sheep',
        x: 200,
        y: 299,
        vx: 0,
        vy: 0,
        radius: 7,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 8000,
        ownerSlugId: 'slug_1',
        behaviorData: {
          facing: 'right',
          walkerType: 'sheep',
          jumpCooldown: 0,
        },
      };

      const initialX = proj.x;
      const res = updateWalkingEntityPhysics(proj, terrain);
      expect(res.exploded).toBe(false);
      expect(proj.x).toBeGreaterThan(initialX); // Moved rightwards!
    });

    it('advances Old Lady slowly along terrain and counts down fuse', () => {
      const terrain = createTestTerrain();
      const proj: ActiveProjectile = {
        id: 'proj_oldlady_test',
        weaponId: 'old_lady',
        x: 200,
        y: 299,
        vx: 0,
        vy: 0,
        radius: 6,
        bounces: false,
        windAffected: false,
        fuseTimerMs: 5000,
        ownerSlugId: 'slug_1',
        behaviorData: {
          facing: 'right',
          walkerType: 'old_lady',
          jumpCooldown: 0,
        },
      };

      const res = updateWalkingEntityPhysics(proj, terrain);
      expect(res.exploded).toBe(false);
      expect(proj.fuseTimerMs).toBe(4950); // Counted down 50ms
    });

    it('triggers explosion when walking entity fuse expires', () => {
      const terrain = createTestTerrain();
      const proj: ActiveProjectile = {
        id: 'proj_sheep_expired',
        weaponId: 'sheep',
        x: 200,
        y: 299,
        vx: 0,
        vy: 0,
        radius: 7,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 50,
        ownerSlugId: 'slug_1',
        behaviorData: {
          facing: 'right',
          walkerType: 'sheep',
          jumpCooldown: 0,
        },
      };

      const res = updateWalkingEntityPhysics(proj, terrain);
      expect(res.exploded).toBe(true);
      expect(res.collisionPoint?.x).toBe(200);
    });
  });

  describe('5. Armageddon Global Strike & Manual Sheep Detonation', () => {
    it('spawns 20 meteor projectiles across the map when firing Armageddon', () => {
      const redTeam = engine.state.teams.find((t) => t.id === 'team_red')!;
      redTeam.inventory.armageddon = 1;
      engine.state.turnCount = 20; // Unlocks all turn delays
      expect(engine.selectWeapon('armageddon')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);

      // 20 meteors spawned into state.projectiles
      expect(engine.state.projectiles.length).toBe(20);
      for (const meteor of engine.state.projectiles) {
        expect(meteor.weaponId).toBe('meteor');
        expect(meteor.vy).toBeGreaterThan(0); // Falling downwards
        expect(meteor.windAffected).toBe(true);
      }
      expect(engine.state.phase).toBe('RETREAT');
    });

    it('allows early manual detonation of active sheep by triggering fire during retreat', () => {
      engine.state.turnCount = 20; // Unlocks all turn delays
      expect(engine.selectWeapon('sheep')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);

      expect(engine.state.projectiles.length).toBe(1);
      const sheep = engine.state.projectiles[0];
      expect(sheep.weaponId).toBe('sheep');
      expect(sheep.fuseTimerMs).toBeGreaterThan(1000);

      // Player triggers fire again -> instant detonation
      engine.startCharge();
      expect(sheep.fuseTimerMs).toBe(0);
    });
  });
});

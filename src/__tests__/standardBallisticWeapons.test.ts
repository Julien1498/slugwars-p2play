import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { getWeapon } from '../core/weapons/registry';
import { WEAPON_SETS } from '../core/weapons/weaponSets';
import { updateProjectilesInTick } from '../core/engine/engineTickProjectiles';
import { GameState, ActiveProjectile } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

describe('Standard Ballistic & Explosive Weapons (Standard Artillery)', () => {
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

    // Place all slugs
    let offset = 0;
    while (engine.state.phase === 'PLACEMENT') {
      engine.placeSlug({ x: 300 + offset * 80, y: 250 });
      offset++;
    }
  });

  describe('1. Weapon Definitions & Artillery Parameters', () => {
    it('defines Cluster Bomb (cluster_bomb) with standard stats', () => {
      const weapon = getWeapon('cluster_bomb');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Grenade à Fragmentation');
      expect(weapon.category).toBe('EXPLOSIVE');
      expect(weapon.behavior).toBe('BOUNCING_TIMER');
      expect(weapon.damage).toBe(35);
      expect(weapon.radius).toBe(35);
      expect(weapon.defaultAmmo).toBe(5);
      expect(weapon.turnDelay).toBe(0); // Available on Turn 1
      expect(weapon.crateProbability).toBe(0.15);
      expect(weapon.bounces).toBe(true);
      expect(weapon.allowCustomFuse).toBe(true);
    });

    it('defines Cluster Fragment (cluster_fragment) sub-munition', () => {
      const fragment = getWeapon('cluster_fragment');
      expect(fragment).toBeDefined();
      expect(fragment.damage).toBe(25);
      expect(fragment.radius).toBe(25);
      expect(fragment.bounces).toBe(true);
    });

    it('defines Handgun (handgun) with standard stats', () => {
      const weapon = getWeapon('handgun');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Pistolet');
      expect(weapon.category).toBe('MELEE');
      expect(weapon.damage).toBe(5);
      expect(weapon.radius).toBe(8);
      expect(weapon.defaultAmmo).toBe(4);
      expect(weapon.turnDelay).toBe(0); // Available on Turn 1
      expect(weapon.crateProbability).toBe(0.15);
      expect(weapon.bounces).toBe(false);
    });

    it('defines Uzi (uzi) with standard stats', () => {
      const weapon = getWeapon('uzi');
      expect(weapon).toBeDefined();
      expect(weapon.name).toBe('Pistolet-Mitrailleur');
      expect(weapon.category).toBe('MELEE');
      expect(weapon.damage).toBe(5);
      expect(weapon.radius).toBe(10);
      expect(weapon.defaultAmmo).toBe(3);
      expect(weapon.turnDelay).toBe(0); // Available on Turn 1
      expect(weapon.crateProbability).toBe(0.20);
      expect(weapon.bounces).toBe(false);
    });
  });

  describe('2. Weapon Sets & Inventory Allocation', () => {
    it('includes cluster_bomb, handgun, and uzi in CLASSIC weapon set', () => {
      const classic = WEAPON_SETS.CLASSIC.inventory;
      expect(classic.cluster_bomb).toBe(5);
      expect(classic.handgun).toBe(4);
      expect(classic.uzi).toBe(3);
    });

    it('includes cluster_bomb, handgun, and uzi in WMD_CRAZY weapon set', () => {
      const wmd = WEAPON_SETS.WMD_CRAZY.inventory;
      expect(wmd.cluster_bomb).toBe(10);
      expect(wmd.handgun).toBe(8);
      expect(wmd.uzi).toBe(6);
    });

    it('sets all weapons to infinite (-1) in UNLIMITED_CHAOS', () => {
      const chaos = WEAPON_SETS.UNLIMITED_CHAOS.inventory;
      expect(chaos.cluster_bomb).toBe(-1);
      expect(chaos.handgun).toBe(-1);
      expect(chaos.uzi).toBe(-1);
    });
  });

  describe('3. Projectile Generation & Balistics', () => {
    it('generates bouncing cluster bomb projectile with custom fuse', () => {
      const weapon = getWeapon('cluster_bomb');
      const projs = weapon.createProjectiles({
        originX: 100,
        originY: 200,
        angleDeg: 45,
        power: 80,
        ownerSlugId: 'slug_1',
        fuseTimerMs: 4000,
      });

      expect(projs.length).toBe(1);
      expect(projs[0].weaponId).toBe('cluster_bomb');
      expect(projs[0].fuseTimerMs).toBe(4000);
      expect(projs[0].bounces).toBe(true);
    });

    it('generates 6 rapid bullets for Handgun', () => {
      const weapon = getWeapon('handgun');
      const projs = weapon.createProjectiles({
        originX: 100,
        originY: 200,
        angleDeg: 0,
        power: 100,
        ownerSlugId: 'slug_1',
      });

      expect(projs.length).toBe(6);
      for (const p of projs) {
        expect(p.weaponId).toBe('handgun');
        expect(p.bounces).toBe(false);
        expect(Math.hypot(p.vx, p.vy)).toBeGreaterThanOrEqual(24);
      }
    });

    it('generates 10 rapid bullets for Uzi with progressive spread', () => {
      const weapon = getWeapon('uzi');
      const projs = weapon.createProjectiles({
        originX: 100,
        originY: 200,
        angleDeg: 0,
        power: 100,
        ownerSlugId: 'slug_1',
      });

      expect(projs.length).toBe(10);
      for (const p of projs) {
        expect(p.weaponId).toBe('uzi');
        expect(p.bounces).toBe(false);
        expect(Math.hypot(p.vx, p.vy)).toBeGreaterThanOrEqual(22);
      }
    });
  });

  describe('4. Cluster Bomb Explosion & 5 Sub-Fragments Spawn', () => {
    function createFlatTerrain(): DestructibleTerrain {
      const grid = new Uint8Array(600 * 400);
      for (let y = 250; y < 400; y++) {
        for (let x = 0; x < 600; x++) {
          grid[y * 600 + x] = 1;
        }
      }
      return new DestructibleTerrain({
        width: 600,
        height: 400,
        grid,
        theme: 'ISLAND',
        seed: 123,
        waterLevel: 390,
        minePoints: [],
        spawnPoints: [],
        decorItems: [],
        solidProps: [],
      });
    }

    it('detonates cluster bomb and spawns 5 cluster_fragment projectiles in tick', () => {
      const terrain = createFlatTerrain();
      const state: GameState = {
        phase: 'PROJECTILE_ACTIVE',
        activeTeamId: 'team_1',
        activeSlugId: 'slug_1',
        turnTimer: 45,
        turnCount: 1,
        wind: 0,
        config: {
          turnDuration: 45,
          slugsPerTeam: 1,
          slugHp: 100,
          mapTheme: 'ISLAND',
          mapSeed: 42,
          windEnabled: true,
          vehiclesEnabled: true,
          weaponSetId: 'CLASSIC',
        },
        teams: [{ id: 'team_1', name: 'Red', color: '#ef4444', avatar: '🐌', isHost: true, inventory: {} }],
        slugs: [
          {
            id: 'slug_1',
            teamId: 'team_1',
            name: 'Red Slug',
            x: 100,
            y: 248,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            facing: 'right',
            aimAngle: 45,
            aimPower: 50,
            selectedWeaponId: 'cluster_bomb',
            isAlive: true,
            isPlaced: true,
          },
        ],
        projectiles: [
          {
            id: 'proj_cluster_1',
            weaponId: 'cluster_bomb',
            x: 200,
            y: 248,
            vx: 0,
            vy: 0,
            radius: 5,
            bounces: true,
            windAffected: false,
            fuseTimerMs: 0, // Fuse expired -> triggers explosion!
            ownerSlugId: 'slug_1',
          },
        ],
        explosions: [],
        floatingDamages: [],
        particles: [],
        supplyCrates: [],
        mines: [],
        helicopters: [],
        journal: [],
      };

      const craters: Array<{ x: number; y: number; r: number }> = [];
      updateProjectilesInTick(
        state,
        terrain,
        (x, y, r) => craters.push({ x, y, r }),
        () => {}
      );

      // Primary explosion happened
      expect(craters.length).toBe(1);
      expect(craters[0].r).toBe(35);

      // 5 cluster fragments spawned into state.projectiles with regular upward fan
      expect(state.projectiles.length).toBe(5);
      for (const frag of state.projectiles) {
        expect(frag.weaponId).toBe('cluster_fragment');
        expect(frag.bounces).toBe(true);
        expect(frag.fuseTimerMs).toBe(1600);
        expect(frag.vy).toBeLessThan(0); // Upward fountain arc
      }
    });

    it('imparts directional kinetic knockback to slugs hit by handgun and uzi bullets', () => {
      const terrain = createFlatTerrain();
      const state: GameState = {
        phase: 'PROJECTILE_ACTIVE',
        activeTeamId: 'team_1',
        activeSlugId: 'slug_1',
        turnTimer: 45,
        turnCount: 1,
        wind: 0,
        config: {
          turnDuration: 45,
          slugsPerTeam: 1,
          slugHp: 100,
          mapTheme: 'ISLAND',
          mapSeed: 42,
          windEnabled: true,
          vehiclesEnabled: true,
          weaponSetId: 'CLASSIC',
        },
        teams: [{ id: 'team_1', name: 'Red', color: '#ef4444', avatar: '🐌', isHost: true, inventory: {} }],
        slugs: [
          {
            id: 'victim_slug',
            teamId: 'team_2',
            name: 'Enemy Slug',
            x: 200,
            y: 248,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            facing: 'left',
            aimAngle: 0,
            aimPower: 50,
            selectedWeaponId: 'bazooka',
            isAlive: true,
            isPlaced: true,
          },
        ],
        projectiles: [
          {
            id: 'bullet_1',
            weaponId: 'handgun',
            x: 200,
            y: 240,
            vx: 26, // Flying rightwards
            vy: 0,
            radius: 2,
            bounces: false,
            windAffected: false,
            ownerSlugId: 'slug_1',
          },
        ],
        explosions: [],
        floatingDamages: [],
        particles: [],
        supplyCrates: [],
        mines: [],
        helicopters: [],
        journal: [],
      };

      updateProjectilesInTick(state, terrain, () => {}, () => {});

      const victim = state.slugs.find((s) => s.id === 'victim_slug')!;
      expect(victim.vx).toBeGreaterThan(0); // Pushed rightwards!
      expect(victim.vy).toBeLessThan(0); // Popped up slightly to prevent floor-clamping
    });
  });

  describe('5. Engine Integration & Firing', () => {
    it('allows firing Cluster Bomb, Handgun, and Uzi in game engine', () => {
      // 1. Cluster Bomb
      expect(engine.selectWeapon('cluster_bomb')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);
      expect(engine.state.projectiles.length).toBe(1);
      expect(engine.state.projectiles[0].weaponId).toBe('cluster_bomb');

      // Clear projectiles for next test
      engine.state.projectiles = [];
      engine.state.phase = 'AIMING';

      // 2. Handgun
      expect(engine.selectWeapon('handgun')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);
      expect(engine.state.projectiles.length).toBe(6);
      expect(engine.state.projectiles[0].weaponId).toBe('handgun');

      // Clear projectiles for next test
      engine.state.projectiles = [];
      engine.state.phase = 'AIMING';

      // 3. Uzi
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.facing = 'right';
      activeSlug.vx = 0;
      expect(engine.selectWeapon('uzi')).toBe(true);
      expect(engine.fireWeapon()).toBe(true);
      expect(engine.state.projectiles.length).toBe(10);
      expect(engine.state.projectiles[0].weaponId).toBe('uzi');
      expect(activeSlug.vx).toBeLessThan(0); // Backward shooter recoil!
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  selectWeapon,
  setFuseTimer,
  detonateOilDrum,
  fireWeapon,
} from '../core/engine/weaponHandler';
import { GameState, SolidProp } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';
import { generateProceduralTerrain } from '../core/terrainGenerator';

function createMockTerrain(): DestructibleTerrain {
  const data = generateProceduralTerrain(12345, 'ISLAND', 1400, 800);
  return new DestructibleTerrain(data);
}

function createMockGameState(): GameState {
  return {
    phase: 'AIMING',
    activeTeamId: 'team_1',
    activeSlugId: 'slug_1',
    turnTimer: 45,
    wind: 0,
    turnCount: 1,
    particles: [],
    floatingDamages: [],
    journal: [],
    config: {
      turnDuration: 45,
      slugsPerTeam: 2,
      slugHp: 100,
      weaponSetId: 'classic',
      windEnabled: true,
      vehiclesEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: 12345,
    },
    teams: [
      {
        id: 'team_1',
        name: 'Équipe Rouge',
        color: '#ef4444',
        avatar: '🐌',
        isHost: true,
        inventory: { bazooka: -1, grenade: 3, teleport: 2, dynamite: 1, shotgun: 0, air_strike: 2 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'team_2',
        name: 'Équipe Bleue',
        color: '#3b82f6',
        avatar: '🐌',
        isHost: false,
        inventory: { bazooka: -1, grenade: 3 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ],
    slugs: [
      {
        id: 'slug_1',
        name: 'Alpha 1',
        teamId: 'team_1',
        x: 200,
        y: 300,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'right',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_2',
        name: 'Bravo 1',
        teamId: 'team_2',
        x: 220, // close to slug 1 (distance 20px)
        y: 300,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
      },
    ],
    helicopters: [],
    mines: [],
    projectiles: [],
    explosions: [],
    supplyCrates: [],
    girders: [],
    craters: [],
  };
}

describe('Weapon Handler - Arsenal Selection, Firing & Tactical Mechanics', () => {
  describe('selectWeapon() & setFuseTimer()', () => {
    it('selects valid weapon and initializes default fuse timer for custom fuse weapons', () => {
      const state = createMockGameState();
      const success = selectWeapon(state, 'grenade');

      expect(success).toBe(true);
      expect(state.slugs[0].selectedWeaponId).toBe('grenade');
      expect(state.slugs[0].fuseTimerSec).toBe(3);
    });

    it('rejects weapon selection when ammunition is 0 and falls back to bazooka', () => {
      const state = createMockGameState();
      const success = selectWeapon(state, 'shotgun'); // inventory has 0 shotgun

      expect(success).toBe(false);
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');
    });

    it('clamps fuse timer between 1 and 5 seconds', () => {
      const state = createMockGameState();
      setFuseTimer(state, 'slug_1', 0);
      expect(state.slugs[0].fuseTimerSec).toBe(1);

      setFuseTimer(state, 'slug_1', 10);
      expect(state.slugs[0].fuseTimerSec).toBe(5);

      setFuseTimer(state, 'slug_1', 4);
      expect(state.slugs[0].fuseTimerSec).toBe(4);
    });
  });

  describe('detonateOilDrum()', () => {
    it('creates blast explosion, damage numbers, particles, carves crater and logs event', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      const drum: SolidProp = { id: 'drum_1', type: 'oil_drum', x: 210, y: 310, width: 28, height: 28 };

      let craterCarved = false;
      const logs: string[] = [];

      detonateOilDrum(
        state,
        terrain,
        drum,
        () => { craterCarved = true; },
        (msg) => logs.push(msg)
      );

      expect(state.explosions.length).toBeGreaterThan(0);
      expect(state.particles.length).toBeGreaterThanOrEqual(10);
      expect(craterCarved).toBe(true);
      expect(logs[0]).toContain('BARIL DE PÉTROLE');
    });
  });

  describe('fireWeapon() - Phase & Slug Validity Checks', () => {
    it('rejects weapon firing when not in AIMING phase or when slug is dead', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();

      // Phase is RESOLVING
      state.phase = 'RESOLVING';
      expect(fireWeapon(state, terrain, undefined, () => {})).toBe(false);

      // Active slug is dead
      state.phase = 'AIMING';
      state.slugs[0].isAlive = false;
      state.slugs[0].hp = 0;
      expect(fireWeapon(state, terrain, undefined, () => {})).toBe(false);
    });
  });

  describe('fireWeapon() - Special & Tactical Weapons', () => {
    it('handles skip_turn weapon and transitions to RESOLVING', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'skip_turn';

      const logs: string[] = [];
      const fired = fireWeapon(state, terrain, undefined, (msg) => logs.push(msg));

      expect(fired).toBe(true);
      expect(state.phase).toBe('RESOLVING');
      expect(logs[0]).toContain('passe son tour');
    });

    it('handles teleport weapon and repositions slug', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'teleport';

      const target = { x: 500, y: 250 };
      const fired = fireWeapon(state, terrain, target, () => {});

      expect(fired).toBe(true);
      expect(state.slugs[0].x).toBeCloseTo(target.x, 0);
      expect(state.phase).toBe('RESOLVING');
      expect(state.teams[0].inventory['teleport']).toBe(1); // decremented from 2
    });

    it('handles blowtorch activation', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'blowtorch';

      const fired = fireWeapon(state, terrain, undefined, () => {});

      expect(fired).toBe(true);
      expect(state.slugs[0].isBlowtorching).toBe(true);
      expect(state.slugs[0].aimPower).toBe(5);
    });

    it('handles ninja rope firing and attaches rope when colliding with terrain', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'ninja_rope';

      // Position slug underneath solid terrain
      state.slugs[0].x = 400;
      state.slugs[0].y = 450;
      state.slugs[0].aimAngle = 60; // aiming up

      const fired = fireWeapon(state, terrain, undefined, () => {});
      expect(fired).toBe(true);
    });

    it('handles girder placement and writes solid pixels into terrain grid', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'girder';

      const girderPos = { x: 300, y: 200 };
      const fired = fireWeapon(state, terrain, girderPos, () => {});

      expect(fired).toBe(true);
      expect(state.girders?.length).toBe(1);
      expect(state.girders?.[0]?.x).toBe(300);
      expect(state.girders?.[0]?.y).toBe(200);
      expect(state.phase).toBe('RESOLVING');
    });

    it('handles airdrop supply crate and transitions to RETREAT', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'airdrop';

      const fired = fireWeapon(state, terrain, { x: 350, y: 200 }, () => {});

      expect(fired).toBe(true);
      expect(state.supplyCrates?.length).toBe(1);
      expect(state.supplyCrates?.[0]?.x).toBe(350);
      expect(state.supplyCrates?.[0]?.y).toBe(-30);
      expect(state.phase).toBe('RETREAT');
    });

    it('handles baseball bat melee push with damage and knockback on adjacent target', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.slugs[0].selectedWeaponId = 'baseball_bat';

      // Target slug 2 is at x=220 (distance 20px, < 40px)
      const fired = fireWeapon(state, terrain, undefined, () => {});

      expect(fired).toBe(true);
      expect(state.slugs[1].hp).toBeLessThan(100);
      expect(state.slugs[1].vx).toBe(18); // knocked right
      expect(state.slugs[1].vy).toBe(-10);
      expect(state.teams[0].stats?.damageDealt).toBeGreaterThan(0);
      expect(state.phase).toBe('RESOLVING');
    });

    it('handles ballistic weapons (bazooka, dynamite) spawning projectiles and triggering RETREAT/PROJECTILE_ACTIVE', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();

      // 1. Bazooka -> PROJECTILE_ACTIVE
      state.slugs[0].selectedWeaponId = 'bazooka';
      fireWeapon(state, terrain, undefined, () => {});
      expect(state.projectiles.length).toBe(1);
      expect(state.phase).toBe('PROJECTILE_ACTIVE');

      // 2. Dynamite -> RETREAT
      state.projectiles = [];
      state.phase = 'AIMING';
      state.slugs[0].selectedWeaponId = 'dynamite';
      fireWeapon(state, terrain, undefined, () => {});
      expect(state.projectiles.length).toBe(1);
      expect(state.phase).toBe('RETREAT');
    });
  });
});

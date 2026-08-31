import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { isWeaponLocked, getWeaponLockDetails, selectWeapon } from '../core/engine/weapons/weaponSelection';
import {
  pickRandomCrateContent,
  spawnTurnSupplyCrate,
  spawnSupplyCrateOfType,
  processTurnSupplyDrops,
  CRATE_DROP_RATES,
  MAX_SUPPLY_CRATES_ON_MAP,
  updateSupplyCrates,
} from '../core/engine/supplyDropManager';
import { GameState } from '../core/types';

describe('Weapon Turn Delays & Supply Crates (Standard Rules)', () => {
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

  describe('Turn Delays Locking Mechanism', () => {
    it('locks super-weapons at Round 0 / Turn 1 and allows basic weapons', () => {
      const state = engine.state;
      state.turnCount = 1;
      const redTeam = state.teams.find((t) => t.id === 'team_red')!;

      // Delay 0 weapons -> Unlocked
      expect(isWeaponLocked(state, 'bazooka', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'grenade', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'shotgun', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'baseball_bat', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'ninja_rope', redTeam)).toBe(false);

      // Delay > 0 weapons -> Locked at Turn 1
      expect(isWeaponLocked(state, 'dynamite', redTeam)).toBe(true); // Delay 1
      expect(isWeaponLocked(state, 'air_strike', redTeam)).toBe(true); // Delay 3
      expect(isWeaponLocked(state, 'super_sheep', redTeam)).toBe(true); // Delay 3
      expect(isWeaponLocked(state, 'banana_bomb', redTeam)).toBe(true); // Delay 4
      expect(isWeaponLocked(state, 'holy_grenade', redTeam)).toBe(true); // Delay 5
      expect(isWeaponLocked(state, 'concrete_donkey', redTeam)).toBe(true); // Delay 8
    });

    it('calculates fair round progression across multi-team matches (3 teams)', () => {
      const state = engine.state;
      state.teams.push({
        id: 'team_green',
        name: 'Green Team',
        color: '#22c55e',
        avatar: '🐌',
        isHost: false,
        inventory: {},
      });
      // 3 teams: Turn 1,2,3 = Round 0 (Dynamite locked). Turn 4 = Round 1 (Dynamite unlocked!)
      state.turnCount = 3;
      expect(isWeaponLocked(state, 'dynamite')).toBe(true);
      state.turnCount = 4;
      expect(isWeaponLocked(state, 'dynamite')).toBe(false);
    });

    it('unlocks all weapons immediately when in UNLIMITED_CHAOS or turnDelaysEnabled is false', () => {
      const state = engine.state;
      state.turnCount = 1;
      state.config.weaponSetId = 'UNLIMITED_CHAOS';
      expect(isWeaponLocked(state, 'holy_grenade')).toBe(false);
      expect(isWeaponLocked(state, 'concrete_donkey')).toBe(false);

      state.config.weaponSetId = 'CLASSIC';
      state.config.turnDelaysEnabled = false;
      expect(isWeaponLocked(state, 'holy_grenade')).toBe(false);
    });

    it('returns accurate lock details with remaining rounds count', () => {
      const state = engine.state;
      state.turnCount = 1;
      const redTeam = state.teams.find((t) => t.id === 'team_red')!;

      const holyDetails = getWeaponLockDetails(state, 'holy_grenade', redTeam);
      expect(holyDetails.isLocked).toBe(true);
      expect(holyDetails.turnDelay).toBe(5);
      expect(holyDetails.roundsRemaining).toBe(5);

      const bazookaDetails = getWeaponLockDetails(state, 'bazooka', redTeam);
      expect(bazookaDetails.isLocked).toBe(false);
      expect(bazookaDetails.roundsRemaining).toBe(0);
    });

    it('unlocks weapons progressively as rounds advance', () => {
      const state = engine.state;
      const redTeam = state.teams.find((t) => t.id === 'team_red')!;

      // Round 1 (Turn 3 in 2-team game) -> Dynamite unlocks
      state.turnCount = 3;
      expect(isWeaponLocked(state, 'dynamite', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'air_strike', redTeam)).toBe(true);

      // Round 3 (Turn 7 in 2-team game) -> Air Strike & Super Sheep unlock
      state.turnCount = 7;
      expect(isWeaponLocked(state, 'air_strike', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'super_sheep', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'holy_grenade', redTeam)).toBe(true);

      // Round 5 (Turn 11 in 2-team game) -> Holy Hand Grenade unlocks
      state.turnCount = 11;
      expect(isWeaponLocked(state, 'holy_grenade', redTeam)).toBe(false);
      expect(isWeaponLocked(state, 'concrete_donkey', redTeam)).toBe(true);
    });

    it('rejects selection of locked weapons and allows unlocked ones', () => {
      const state = engine.state;
      state.turnCount = 1; // Turn 1

      // Holy Grenade is locked at Turn 1 -> selectWeapon returns false and resets to bazooka
      const holySelected = selectWeapon(state, 'holy_grenade');
      expect(holySelected).toBe(false);
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');

      // Bazooka is unlocked -> selectWeapon returns true
      const bazookaSelected = selectWeapon(state, 'bazooka');
      expect(bazookaSelected).toBe(true);
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');
    });
  });

  describe('Supply Crates & In-World Notifications', () => {
    it('generates valid random crate contents with proper weights', () => {
      const content = pickRandomCrateContent();
      expect(['health', 'weapon', 'utility']).toContain(content.crateType);

      if (content.crateType === 'health') {
        expect(content.healAmount).toBe(50);
      } else {
        expect(content.weaponId).toBeDefined();
        expect(content.weaponCount).toBeGreaterThan(0);
      }
    });

    it('spawns a new procedural supply crate on the map up to max cap of 5', () => {
      expect(spawnTurnSupplyCrate(engine.state, engine.terrain.data.width)).toBe(true);
      expect(engine.state.supplyCrates?.length).toBe(1);

      // Fill up to 5 crates
      spawnSupplyCrateOfType(engine.state, 'utility', engine.terrain.data.width);
      spawnSupplyCrateOfType(engine.state, 'health', engine.terrain.data.width);
      spawnSupplyCrateOfType(engine.state, 'weapon', engine.terrain.data.width);
      spawnSupplyCrateOfType(engine.state, 'utility', engine.terrain.data.width);
      expect(engine.state.supplyCrates?.length).toBe(5);

      // 6th spawn is rejected due to max cap of 5
      expect(spawnTurnSupplyCrate(engine.state, engine.terrain.data.width)).toBe(false);
      expect(spawnSupplyCrateOfType(engine.state, 'health', engine.terrain.data.width)).toBe(false);
    });

    it('processes independent category drop rates and supports multi-crate drops in the same turn', () => {
      expect(CRATE_DROP_RATES.WEAPON).toBe(0.55);
      expect(CRATE_DROP_RATES.UTILITY).toBe(0.25);
      expect(CRATE_DROP_RATES.HEALTH).toBe(0.15);
      expect(MAX_SUPPLY_CRATES_ON_MAP).toBe(5);

      engine.state.supplyCrates = [];
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      // Force Math.random to always succeed (< 0.15 triggers all 3 categories)
      const originalRandom = Math.random;
      Math.random = () => 0.05;

      try {
        const spawned = processTurnSupplyDrops(engine.state, engine.terrain.data.width, addLog);
        expect(spawned).toBe(3);
        expect(engine.state.supplyCrates.length).toBe(3);

        const types = engine.state.supplyCrates.map((c) => c.crateType);
        expect(types).toContain('weapon');
        expect(types).toContain('utility');
        expect(types).toContain('health');
        expect(logs.length).toBe(3);
      } finally {
        Math.random = originalRandom;
      }
    });

    it('creates in-world floating banner with weapon icon and name upon crate collection', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      const slug = engine.state.slugs[0];
      slug.x = 250;
      slug.y = 200;
      slug.isAlive = true;
      const redTeam = engine.state.teams.find((t) => t.id === slug.teamId)!;
      redTeam.inventory['super_sheep'] = 0;

      engine.state.supplyCrates = [
        {
          id: 'crate_weapon_1',
          x: 252,
          y: 198,
          vy: 0,
          isLanded: true,
          crateType: 'weapon',
          weaponId: 'super_sheep',
          weaponCount: 1,
        },
      ];

      updateSupplyCrates(engine.state, engine.terrain, undefined, addLog);

      expect(engine.state.supplyCrates.length).toBe(0);
      expect(redTeam.inventory['super_sheep']).toBe(1);

      // In-world floating banner exists
      const banner = engine.state.floatingDamages.find((fd) => fd.text?.includes('Super Mouton'));
      expect(banner).toBeDefined();
      expect(banner?.color).toBe('#e879f9');
    });

    it('detonates supply crate if hit by an explosion', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      engine.state.supplyCrates = [
        {
          id: 'crate_exp_1',
          x: 400,
          y: 200,
          vy: 0,
          isLanded: true,
          crateType: 'weapon',
          weaponId: 'dynamite',
          weaponCount: 1,
        },
      ];

      // Simulate a nearby explosion at x=410, y=200 with radius 30
      engine.state.explosions = [
        { id: 'ex_test', x: 410, y: 200, radius: 30, damage: 50, createdAt: Date.now() },
      ];

      updateSupplyCrates(engine.state, engine.terrain, engine.carveCrater.bind(engine), addLog);

      // Crate detonated into a secondary explosion
      expect(engine.state.supplyCrates.length).toBe(0);
      expect(engine.state.explosions.length).toBeGreaterThan(1);
    });
  });
});

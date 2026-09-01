import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import {
  devSetInfiniteAmmo,
  devUnlockAllWeapons,
  devHealAll,
  devSetOneHp,
  devKillSlug,
  devTeleportSlug,
  devSpawnCrate,
  devSpawnMine,
  devSpawnOilDrum,
  devSpawnHelicopter,
  devSetWind,
  devRiseWater,
  devToggleFreezeTimer,
  devToggleGodMode,
} from '../core/engine/devControls';
import { WEAPON_REGISTRY } from '../core/weapons/registry';

describe('Engine Dev & Debug Controls (devControls.ts)', () => {
  let engine: SlugWarsEngine;

  beforeEach(() => {
    engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 2 });
    engine.addTeam('team_a', 'Alpha', '#ef4444', '🐌', true);
    engine.addTeam('team_b', 'Bravo', '#3b82f6', '🐌', false);
    engine.startGame();
  });

  describe('Weapons & Ammo Cheats', () => {
    it('sets infinite ammo (-1) for all registered weapons on the active team', () => {
      devSetInfiniteAmmo(engine.state);
      const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId);
      expect(activeTeam).toBeDefined();

      for (const weapon of Object.values(WEAPON_REGISTRY)) {
        expect(activeTeam?.inventory?.[weapon.id]).toBe(-1);
      }
    });

    it('unlocks all weapons by resetting turn delay constraints and granting ammo', () => {
      devUnlockAllWeapons(engine.state);
      const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId);
      expect(activeTeam).toBeDefined();
      expect(activeTeam?.inventory?.holy_grenade).toBeDefined();
      expect(activeTeam?.inventory?.armageddon).toBeDefined();
    });
  });

  describe('Slugs & Health Cheats', () => {
    it('heals all slugs to their maxHp or a custom target HP', () => {
      // Damage all slugs first
      engine.state.slugs.forEach((s) => { s.hp = 20; });

      devHealAll(engine.state);
      engine.state.slugs.forEach((s) => {
        expect(s.hp).toBe(s.maxHp);
        expect(s.isAlive).toBe(true);
      });

      devHealAll(engine.state, 150);
      engine.state.slugs.forEach((s) => {
        expect(s.hp).toBe(150);
        expect(s.maxHp).toBe(150);
      });
    });

    it('sets all living slugs to 1 HP for one-shot testing', () => {
      devSetOneHp(engine.state);
      engine.state.slugs.forEach((s) => {
        expect(s.hp).toBe(1);
        expect(s.isAlive).toBe(true);
      });
    });

    it('kills a specific slug instantly and updates its alive status', () => {
      const targetSlug = engine.state.slugs[0];
      devKillSlug(engine.state, targetSlug.id);
      expect(targetSlug.hp).toBe(0);
      expect(targetSlug.isAlive).toBe(false);
    });

    it('teleports a slug to specific coordinates and resets its velocity', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      activeSlug.vx = 5;
      activeSlug.vy = -3;

      devTeleportSlug(engine.state, activeSlug.id, 450, 220);
      expect(activeSlug.x).toBe(450);
      expect(activeSlug.y).toBe(220);
      expect(activeSlug.vx).toBe(0);
      expect(activeSlug.vy).toBe(0);
    });

    it('auto-places all unplaced slugs and starts aiming phase', () => {
      engine.state.phase = 'PLACEMENT';
      engine.state.slugs.forEach((s) => { s.isPlaced = false; });
      engine.devAutoPlaceAllSlugs();

      expect(engine.state.slugs.every((s) => s.isPlaced)).toBe(true);
      expect(engine.state.phase).toBe('AIMING');
    });
  });

  describe('Spawns & Drops', () => {
    it('spawns a supply crate at specified coordinates with custom type', () => {
      expect(engine.state.supplyCrates?.length ?? 0).toBe(0);

      devSpawnCrate(engine.state, 300, 150, 'health');
      expect(engine.state.supplyCrates).toHaveLength(1);
      expect(engine.state.supplyCrates![0].x).toBe(300);
      expect(engine.state.supplyCrates![0].y).toBe(150);
      expect(engine.state.supplyCrates![0].crateType).toBe('health');
      expect(engine.state.supplyCrates![0].isLanded).toBe(true);

      devSpawnCrate(engine.state, 400, 150, 'weapon');
      expect(engine.state.supplyCrates).toHaveLength(2);
      expect(engine.state.supplyCrates![1].crateType).toBe('weapon');
    });

    it('spawns a landmine at specified coordinates', () => {
      const initialMines = engine.state.mines?.length ?? 0;

      devSpawnMine(engine.state, 350, 200);
      expect(engine.state.mines).toHaveLength(initialMines + 1);
      const mine = engine.state.mines[engine.state.mines.length - 1];
      expect(mine.x).toBe(350);
      expect(mine.y).toBe(200);
      expect(mine.isTriggered).toBe(false);
    });

    it('spawns an explosive oil drum at specified coordinates', () => {
      const initialPropsCount = engine.state.solidProps?.length ?? 0;
      devSpawnOilDrum(engine.state, engine.terrain, 500, 250);
      expect(engine.state.solidProps).toHaveLength(initialPropsCount + 1);
      const drum = engine.state.solidProps!.find((p) => p.x === 500 && p.y === 250);
      expect(drum).toBeDefined();
      expect(drum?.type).toBe('oil_drum');
      expect(engine.terrain.data.solidProps?.some((p) => p.x === 500 && p.y === 250)).toBe(true);
    });

    it('spawns a helicopter at specified coordinates', () => {
      const initialHelis = engine.state.helicopters?.length ?? 0;

      devSpawnHelicopter(engine.state, 200, 100);
      expect(engine.state.helicopters).toHaveLength(initialHelis + 1);
      const heli = engine.state.helicopters[engine.state.helicopters.length - 1];
      expect(heli.x).toBe(200);
      expect(heli.y).toBe(100);
      expect(heli.hp).toBe(100);
    });
  });

  describe('Environment & Match Cheats', () => {
    it('sets exact wind value clamped between -5.0 and +5.0', () => {
      devSetWind(engine.state, 3.5);
      expect(engine.state.wind).toBe(3.5);

      devSetWind(engine.state, 10.0);
      expect(engine.state.wind).toBe(5.0);

      devSetWind(engine.state, -8.0);
      expect(engine.state.wind).toBe(-5.0);
    });

    it('rises water level on terrain and in state', () => {
      const initialWater = engine.terrain.data.waterLevel;
      devRiseWater(engine.state, engine.terrain, 40);
      expect(engine.terrain.data.waterLevel).toBe(initialWater - 40);
      expect(engine.state.waterLevel).toBe(initialWater - 40);
    });

    it('toggles freeze timer mode', () => {
      expect(engine.state.isTimerFrozen).toBeFalsy();
      devToggleFreezeTimer(engine.state);
      expect(engine.state.isTimerFrozen).toBe(true);

      devToggleFreezeTimer(engine.state);
      expect(engine.state.isTimerFrozen).toBe(false);
    });

    it('toggles god mode for active slug / team', () => {
      expect(engine.state.godModeEnabled).toBeFalsy();
      devToggleGodMode(engine.state);
      expect(engine.state.godModeEnabled).toBe(true);
      expect(engine.state.slugs[0].isGodMode).toBe(true);

      devToggleGodMode(engine.state);
      expect(engine.state.godModeEnabled).toBe(false);
      expect(engine.state.slugs[0].isGodMode).toBe(false);
    });

    it('forces victory for active team or specified team', () => {
      engine.devForceWin('team_a');
      expect(engine.state.phase).toBe('GAME_OVER');
      expect(engine.state.winnerTeamId).toBe('team_a');
    });

    it('lowers water level on terrain and in state', () => {
      const initialWater = engine.terrain.data.waterLevel;
      engine.devLowerWater(40);
      expect(engine.terrain.data.waterLevel).toBe(initialWater + 40);
      expect(engine.state.waterLevel).toBe(initialWater + 40);
    });

    it('triggers armageddon spawning 20 meteors', () => {
      expect(engine.state.projectiles.filter((p) => p.weaponId === 'meteor')).toHaveLength(0);
      engine.devTriggerArmageddon();
      const meteors = engine.state.projectiles.filter((p) => p.weaponId === 'meteor');
      expect(meteors.length).toBeGreaterThanOrEqual(15);
    });

    it('digs and builds terrain with custom radius', () => {
      const initialRev = engine.terrain.revision;
      engine.devDigTerrain(300, 300, 25);
      expect(engine.terrain.revision).toBe(initialRev + 1);
      expect(engine.state.craters?.some((c) => c.x === 300 && c.y === 300)).toBe(true);

      engine.devBuildTerrain(300, 300, 25);
      expect(engine.terrain.revision).toBe(initialRev + 2);
      expect(engine.terrain.isSolid(300, 300)).toBe(true);
      expect(engine.state.terrainBuilds?.length).toBeGreaterThan(0);

      // Starting a new game must reset all dev builds and craters
      engine.startGame();
      expect(engine.state.terrainBuilds).toEqual([]);
      expect(engine.state.craters).toEqual([]);
    });
  });
});

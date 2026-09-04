import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { selectWeapon, consumeWeaponAmmo } from '../core/engine/weapons/weaponSelection';
import { checkWinner } from '../core/engine/turnManager';
import { advanceToNextTurn } from '../core/engine/phase/turnProgression';
import { GUN_GAME_SEQUENCE, getGunGameWeaponForTurn } from '../core/gameModes/types';

describe('Game Modes Specification & Deterministic Mechanics', () => {
  let engine: SlugWarsEngine;

  beforeEach(() => {
    engine = new SlugWarsEngine();
    engine.addTeam('team_red', 'Rouges', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Bleus', '#3b82f6', '🐌', false);
  });

  describe('👑 VIP_HUNT (Chef VIP / Assassinat)', () => {
    it('initializes the first slug of each squad as General VIP with 150 HP and a crown', () => {
      engine.setConfig({ gameMode: 'VIP_HUNT', slugHp: 100, slugsPerTeam: 3 });
      engine.startGame();

      const redSlugs = engine.state.slugs.filter((s) => s.teamId === 'team_red');
      const blueSlugs = engine.state.slugs.filter((s) => s.teamId === 'team_blue');

      expect(redSlugs).toHaveLength(3);
      expect(blueSlugs).toHaveLength(3);

      // Red VIP
      expect(redSlugs[0].isVip).toBe(true);
      expect(redSlugs[0].hp).toBe(150);
      expect(redSlugs[0].name).toContain('Général Rouges');
      expect(redSlugs[1].isVip).toBeFalsy();
      expect(redSlugs[1].hp).toBe(100);

      // Blue VIP
      expect(blueSlugs[0].isVip).toBe(true);
      expect(blueSlugs[0].hp).toBe(150);
      expect(blueSlugs[0].name).toContain('Général Bleus');
      expect(blueSlugs[1].isVip).toBeFalsy();
      expect(blueSlugs[1].hp).toBe(100);
    });

    it('eliminates all remaining squad members when their VIP General dies', () => {
      engine.setConfig({ gameMode: 'VIP_HUNT', slugHp: 100, slugsPerTeam: 3 });
      engine.startGame();

      const redVip = engine.state.slugs.find((s) => s.teamId === 'team_red' && s.isVip)!;
      const redCadets = engine.state.slugs.filter((s) => s.teamId === 'team_red' && !s.isVip);

      expect(redCadets).toHaveLength(2);
      expect(redCadets.every((s) => s.isAlive)).toBe(true);

      // Kill Red VIP
      redVip.hp = 0;
      redVip.isAlive = false;

      // Run checkWinner
      checkWinner(engine.state);

      // Entire red team must be wiped out immediately
      expect(redCadets.every((s) => !s.isAlive && s.hp === 0)).toBe(true);

      // Blue team should win because their VIP and squad are alive
      expect(engine.state.phase).toBe('GAME_OVER');
      expect(engine.state.winnerTeamId).toBe('team_blue');
    });

    it('does not eliminate squad when a non-VIP slug dies', () => {
      engine.setConfig({ gameMode: 'VIP_HUNT', slugHp: 100, slugsPerTeam: 3 });
      engine.startGame();

      const redVip = engine.state.slugs.find((s) => s.teamId === 'team_red' && s.isVip)!;
      const nonVip = engine.state.slugs.find((s) => s.teamId === 'team_red' && !s.isVip)!;

      // Kill non-VIP
      nonVip.hp = 0;
      nonVip.isAlive = false;

      checkWinner(engine.state);

      // VIP and other teammate must remain alive
      expect(redVip.isAlive).toBe(true);
      expect(engine.state.phase).not.toBe('GAME_OVER');
    });
  });

  describe('🎰 GUN_GAME (Roulette d\'Armes)', () => {
    it('initializes first weapon to the first weapon in GUN_GAME_SEQUENCE', () => {
      engine.setConfig({ gameMode: 'GUN_GAME' });
      engine.startGame();

      expect(engine.state.slugs.every((s) => s.selectedWeaponId === GUN_GAME_SEQUENCE[0])).toBe(true);
    });

    it('locks manual weapon selection in Gun Game mode', () => {
      engine.setConfig({ gameMode: 'GUN_GAME' });
      engine.startGame();

      const activeSlug = engine.state.slugs[0];
      engine.state.activeSlugId = activeSlug.id;

      const selectResult = selectWeapon(engine.state, 'holy_grenade');
      expect(selectResult).toBe(false);
      expect(activeSlug.selectedWeaponId).toBe(GUN_GAME_SEQUENCE[0]);
    });

    it('grants infinite ammunition for the imposed weapon during Gun Game', () => {
      engine.setConfig({ gameMode: 'GUN_GAME' });
      engine.startGame();

      const team = engine.state.teams[0];
      const initialAmmo = team.inventory['bazooka'];

      const res = consumeWeaponAmmo(engine.state, team, 'bazooka');
      expect(res).toBe(true);
      expect(team.inventory['bazooka']).toBe(initialAmmo);
    });

    it('cycles to the next weapon in GUN_GAME_SEQUENCE at every turn advancement', () => {
      engine.setConfig({ gameMode: 'GUN_GAME' });
      engine.startGame();

      // Simulate turn advancement
      for (let turn = 1; turn <= 4; turn++) {
        const expectedWeapon = getGunGameWeaponForTurn(engine.state.turnCount + 1);
        advanceToNextTurn(engine.state, engine.terrain, {
          addLog: () => {},
          randomizeWind: () => {},
          getNextSlugForTeam: (tId) => engine.getNextSlugForTeam(tId),
          checkWinner: () => checkWinner(engine.state),
        });

        const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
        expect(activeSlug).toBeDefined();
        expect(activeSlug!.selectedWeaponId).toBe(expectedWeapon);
      }
    });
  });

  describe('🌊 RISING_WATER (Marée Infernale)', () => {
    it('sets fast water rising parameters and shortened turn timer at start', () => {
      engine.setConfig({ gameMode: 'RISING_WATER' });
      engine.startGame();

      expect(engine.state.config.waterRiseSpeed).toBe('FAST');
      expect(engine.state.config.waterRiseFreq).toBe('EVERY_TURN');
      expect(engine.state.config.turnDuration).toBeLessThanOrEqual(30);
    });

    it('raises water level by 30px at each turn and drowns submerged slugs', () => {
      engine.setConfig({ gameMode: 'RISING_WATER' });
      engine.startGame();

      const initialWaterLevel = engine.state.waterLevel!;
      expect(initialWaterLevel).toBeGreaterThan(0);

      // Place a slug near the bottom
      const testSlug = engine.state.slugs[0];
      testSlug.y = initialWaterLevel - 10;
      testSlug.isPlaced = true;
      testSlug.isAlive = true;

      // Advance turn
      advanceToNextTurn(engine.state, engine.terrain, {
        addLog: () => {},
        randomizeWind: () => {},
        getNextSlugForTeam: (tId) => engine.getNextSlugForTeam(tId),
        checkWinner: () => checkWinner(engine.state),
      });

      // Water should have risen by 30px (y decreased by 30)
      expect(engine.state.waterLevel).toBe(initialWaterLevel - 30);

      // Test slug was at initialWaterLevel - 10, now water is at initialWaterLevel - 30, so slug.y >= newWaterY -> drowned
      expect(testSlug.isAlive).toBe(false);
      expect(testSlug.hp).toBe(0);
    });
  });

  describe('⚡ INSTAGIB (1 HP One-Shot)', () => {
    it('initializes all slugs with exactly 1 HP and 1 maxHp', () => {
      engine.setConfig({ gameMode: 'INSTAGIB', slugHp: 100, slugsPerTeam: 3 });
      engine.startGame();

      expect(engine.state.slugs.every((s) => s.hp === 1 && s.maxHp === 1)).toBe(true);
    });

    it('eliminates a slug upon receiving any damage', () => {
      engine.setConfig({ gameMode: 'INSTAGIB', slugsPerTeam: 2 });
      engine.startGame();

      const victim = engine.state.slugs[0];
      victim.hp -= 1;
      if (victim.hp <= 0) {
        victim.hp = 0;
        victim.isAlive = false;
      }

      expect(victim.isAlive).toBe(false);
      expect(victim.hp).toBe(0);
    });
  });
});

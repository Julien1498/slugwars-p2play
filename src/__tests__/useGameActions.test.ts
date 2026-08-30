import { describe, it, expect } from 'vitest';
import { GameState } from '../core/types';
import { applyOptimisticAction } from '../hooks/game/useActionDispatcher';
import { interpolateGuestLocalState } from '../hooks/game/useGuestLocalTimer';
import { resolveLobbyPlayerName } from '../hooks/game/useHostLobbySync';
import { TEAM_COLORS } from '../network/protocol';
import { stepSupplyCrateDescent } from '../core/engine/supplyDropManager';

function createMockGameState(): GameState {
  return {
    phase: 'AIMING',
    activeTeamId: 'peer_me',
    activeSlugId: 'slug_1',
    turnTimer: 45,
    wind: 2.0,
    turnCount: 1,
    particles: [],
    floatingDamages: [],
    journal: [],
    config: {
      turnDuration: 45,
      slugsPerTeam: 1,
      slugHp: 100,
      weaponSetId: 'classic',
      windEnabled: true,
      vehiclesEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: 1234,
    },
    teams: [
      {
        id: 'peer_me',
        name: 'Équipe Alpha',
        color: '#ef4444',
        avatar: '🐌',
        isHost: false,
        inventory: { bazooka: -1, grenade: 5, blowtorch: 2 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ],
    slugs: [
      {
        id: 'slug_1',
        name: 'Limace 1',
        teamId: 'peer_me',
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        facing: 'right',
        aimAngle: 25,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
        fuseTimerSec: 3,
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

describe('useGame: Optimistic Client Prediction & Local Guest Interpolation', () => {
  describe('applyOptimisticAction()', () => {
    it('applies AIM action immediately with angle, power, facing, and target coordinates', () => {
      const state = createMockGameState();
      const updated = applyOptimisticAction(
        state,
        'AIM',
        { aimAngle: 45, aimPower: 80, facing: 'left', targetPoint: { x: 250, y: 180 } },
        'peer_me'
      );

      expect(updated).toBe(true);
      expect(state.slugs[0].aimAngle).toBe(45);
      expect(state.slugs[0].aimPower).toBe(80);
      expect(state.slugs[0].facing).toBe('left');
      expect(state.slugs[0].currentTargetPoint).toEqual({ x: 250, y: 180 });
    });

    it('allows optimistic movements during RETREAT phase', () => {
      const state = createMockGameState();
      state.phase = 'RETREAT';

      const updated = applyOptimisticAction(state, 'START_MOVE', { dir: 'right' }, 'peer_me');
      expect(updated).toBe(true);
      expect(state.slugs[0].movingDir).toBe('right');
    });

    it('applies SELECT_WEAPON and SET_FUSE_TIMER immediately', () => {
      const state = createMockGameState();
      applyOptimisticAction(state, 'SELECT_WEAPON', { weaponId: 'grenade' }, 'peer_me');
      applyOptimisticAction(state, 'SET_FUSE_TIMER', { seconds: 5 }, 'peer_me');

      expect(state.slugs[0].selectedWeaponId).toBe('grenade');
      expect(state.slugs[0].fuseTimerSec).toBe(5);
    });

    it('handles START_CHARGE, blowtorch activation on FIRE, and RELEASE_CHARGE', () => {
      const state = createMockGameState();
      state.slugs[0].selectedWeaponId = 'blowtorch';

      applyOptimisticAction(state, 'START_CHARGE', { targetPoint: { x: 120, y: 200 } }, 'peer_me');
      expect(state.slugs[0].isChargingPower).toBe(true);
      expect(state.slugs[0].aimPower).toBe(5);

      applyOptimisticAction(state, 'FIRE', {}, 'peer_me');
      expect(state.slugs[0].isChargingPower).toBe(false);
      expect(state.slugs[0].isBlowtorching).toBe(true);

      applyOptimisticAction(state, 'RELEASE_CHARGE', {}, 'peer_me');
      expect(state.slugs[0].isBlowtorching).toBe(false);
    });

    it('handles START_MOVE and STOP_MOVE directions', () => {
      const state = createMockGameState();
      applyOptimisticAction(state, 'START_MOVE', { dir: 'left' }, 'peer_me');
      expect(state.slugs[0].movingDir).toBe('left');
      expect(state.slugs[0].facing).toBe('left');

      applyOptimisticAction(state, 'STOP_MOVE', {}, 'peer_me');
      expect(state.slugs[0].movingDir).toBeNull();
    });

    it('ignores optimistic actions when it is not the local player turn', () => {
      const state = createMockGameState();
      const updated = applyOptimisticAction(state, 'AIM', { aimAngle: 80 }, 'peer_other');
      expect(updated).toBe(false);
      expect(state.slugs[0].aimAngle).toBe(25);
    });
  });

  describe('interpolateGuestLocalState() & stepSupplyCrateDescent()', () => {
    it('decrements turnTimer smoothly during AIMING phase and clamps at 0', () => {
      const state = createMockGameState();
      state.turnTimer = 0.02;

      const changed = interpolateGuestLocalState(state, () => false, 500, 'peer_me');
      expect(changed).toBe(true);
      expect(state.turnTimer).toBe(0);
    });

    it('decrements retreatTimer smoothly during RETREAT phase and clamps at 0', () => {
      const state = createMockGameState();
      state.phase = 'RETREAT';
      state.retreatTimer = 0.03;

      interpolateGuestLocalState(state, () => false, 500, 'peer_me');
      expect(state.retreatTimer).toBe(0);
    });

    it('counts down triggered mine fuses on client side (50ms tick) and clamps at 0', () => {
      const state = createMockGameState();
      state.mines = [{ id: 'm1', x: 100, y: 150, isTriggered: true, fuseTimerMs: 25 }];

      interpolateGuestLocalState(state, () => false, 500, 'peer_me');
      expect(state.mines[0].fuseTimerMs).toBe(0);
    });

    it('smoothly fills aim power while charging power on guest up to 100 max', () => {
      const state = createMockGameState();
      state.slugs[0].isChargingPower = true;
      state.slugs[0].aimPower = 99;

      interpolateGuestLocalState(state, () => false, 500, 'peer_me');
      expect(state.slugs[0].aimPower).toBe(100);
    });

    it('simulates falling supply crate descent and lands on solid ground or water level', () => {
      const state = createMockGameState();
      state.wind = 2.0;
      state.supplyCrates = [
        { id: 'c1', x: 200, y: 100, vy: 2.0, isLanded: false, crateType: 'health', healAmount: 50 },
      ];

      // Step 1: In mid-air
      interpolateGuestLocalState(state, () => false, 500, 'peer_me');
      expect(state.supplyCrates[0].x).toBeCloseTo(200.3, 1);
      expect(state.supplyCrates[0].y).toBe(102.0);
      expect(state.supplyCrates[0].isLanded).toBe(false);

      // Step 2: Hits ground (solid at y + 10)
      interpolateGuestLocalState(state, (_x, y) => y >= 112, 500, 'peer_me');
      expect(state.supplyCrates[0].isLanded).toBe(true);
      expect(state.supplyCrates[0].vy).toBe(0);

      // Step 3: Hits water level (y >= waterLevel - 15)
      const waterState = createMockGameState();
      waterState.supplyCrates = [
        { id: 'c2', x: 200, y: 485, vy: 2.0, isLanded: false, crateType: 'ammo', healAmount: 0 },
      ];
      interpolateGuestLocalState(waterState, () => false, 500, 'peer_me');
      expect(waterState.supplyCrates[0].isLanded).toBe(true);
      expect(waterState.supplyCrates[0].vy).toBe(0);
    });

    it('executes core stepSupplyCrateDescent cleanly', () => {
      const crate = { id: 'c_test', x: 100, y: 50, vy: 1.8, isLanded: false, crateType: 'health' as const };
      const moved = stepSupplyCrateDescent(crate, 4.0, () => false, 500);
      expect(moved).toBe(true);
      expect(crate.x).toBeCloseTo(100.6, 1);
      expect(crate.y).toBeCloseTo(51.8, 1);
      expect(crate.isLanded).toBe(false);
    });
  });

  describe('resolveLobbyPlayerName() & TEAM_COLORS', () => {
    it('returns custom username when provided and valid', () => {
      expect(resolveLobbyPlayerName('SniperSlug', undefined, 'abc12345')).toBe('SniperSlug');
    });

    it('falls back to trusted username when username is generic', () => {
      expect(resolveLobbyPlayerName('Joueur-8821', 'SlugCommander', 'abc12345')).toBe('SlugCommander');
      expect(resolveLobbyPlayerName(undefined, 'SlugCommander', 'abc12345')).toBe('SlugCommander');
    });

    it('falls back to Limace prefix with peer ID slice when all else is generic', () => {
      expect(resolveLobbyPlayerName(undefined, undefined, 'f8b2c4e1')).toBe('Limace f8b2');
      expect(resolveLobbyPlayerName('Joueur 1', 'Joueur-8821', 'f8b2c4e1')).toBe('Limace f8b2');
    });

    it('provides 6 distinct valid hex colors for teams in protocol', () => {
      expect(TEAM_COLORS).toHaveLength(6);
      expect(new Set(TEAM_COLORS).size).toBe(6);
      TEAM_COLORS.forEach((color) => expect(color).toMatch(/^#[0-9a-f]{6}$/i));
    });
  });
});

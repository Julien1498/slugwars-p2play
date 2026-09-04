import { describe, it, expect } from 'vitest';
import { GameState } from '../core/types';
import {
  getIsLocalPlayerTurn,
  isSenderAuthorizedForTurn,
  isPlayablePhase,
} from '../core/turnAuthority';

function createTestGameState(): GameState {
  return {
    phase: 'AIMING',
    activeTeamId: 'host_1',
    activeSlugId: 'slug_host_1',
    turnTimer: 45,
    wind: 0,
    turnCount: 1,
    particles: [],
    floatingDamages: [],
    journal: [],
    mines: [],
    helicopters: [],
    projectiles: [],
    explosions: [],
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
        id: 'host_1',
        name: 'Host Team',
        color: '#ef4444',
        avatar: '👑',
        isHost: true,
        inventory: {},
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'guest_1',
        name: 'Guest Team',
        color: '#3b82f6',
        avatar: '🐌',
        isHost: false,
        inventory: {},
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ],
    slugs: [
      {
        id: 'slug_host_1',
        teamId: 'host_1',
        name: 'Host Slug',
        x: 100,
        y: 100,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'right',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_guest_1',
        teamId: 'guest_1',
        name: 'Guest Slug',
        x: 300,
        y: 100,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      },
    ],
  };
}

describe('Turn Authority & Permissions', () => {
  describe('getIsLocalPlayerTurn', () => {
    it('returns true when in single-player or testing mode with 1 team', () => {
      const state = createTestGameState();
      state.teams = [state.teams[0]];
      expect(getIsLocalPlayerTurn(state, 'any_peer', false)).toBe(true);
      expect(getIsLocalPlayerTurn(state, null, false)).toBe(true);
    });

    it('returns true for host when activeTeam is host and isHost is true', () => {
      const state = createTestGameState();
      state.activeTeamId = 'host_1';
      expect(getIsLocalPlayerTurn(state, 'host_1', true)).toBe(true);
    });

    it('returns false for guest when activeTeam is host', () => {
      const state = createTestGameState();
      state.activeTeamId = 'host_1';
      expect(getIsLocalPlayerTurn(state, 'guest_1', false)).toBe(false);
    });

    it('returns true for guest when activeTeam is guest and peer ID matches', () => {
      const state = createTestGameState();
      state.activeTeamId = 'guest_1';
      expect(getIsLocalPlayerTurn(state, 'guest_1', false)).toBe(true);
    });

    it('returns false for host when activeTeam is guest', () => {
      const state = createTestGameState();
      state.activeTeamId = 'guest_1';
      expect(getIsLocalPlayerTurn(state, 'host_1', true)).toBe(false);
    });
  });

  describe('isSenderAuthorizedForTurn', () => {
    it('authorizes host on host turn', () => {
      const state = createTestGameState();
      state.activeTeamId = 'host_1';
      expect(isSenderAuthorizedForTurn(state, 'host_1', 'host_1')).toBe(true);
    });

    it('rejects guest on host turn', () => {
      const state = createTestGameState();
      state.activeTeamId = 'host_1';
      expect(isSenderAuthorizedForTurn(state, 'guest_1', 'host_1')).toBe(false);
    });

    it('authorizes guest on guest turn', () => {
      const state = createTestGameState();
      state.activeTeamId = 'guest_1';
      expect(isSenderAuthorizedForTurn(state, 'guest_1', 'host_1')).toBe(true);
    });
  });

  describe('isPlayablePhase', () => {
    it('returns true for interactive phases', () => {
      expect(isPlayablePhase('AIMING')).toBe(true);
      expect(isPlayablePhase('TURN_TIME')).toBe(true);
      expect(isPlayablePhase('RETREAT')).toBe(true);
      expect(isPlayablePhase('PLACEMENT')).toBe(true);
      expect(isPlayablePhase('PROJECTILE_ACTIVE')).toBe(true);
    });

    it('returns false for non-interactive phases', () => {
      expect(isPlayablePhase('LOBBY')).toBe(false);
      expect(isPlayablePhase('GAME_OVER')).toBe(false);
    });
  });
});

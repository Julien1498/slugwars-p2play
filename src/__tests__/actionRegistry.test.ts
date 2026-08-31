import { describe, it, expect } from 'vitest';
import {
  NETWORK_ACTION_REGISTRY,
  checkActionPermission,
  canExecuteInPhase,
  HostActionContext,
} from '../network/actions';
import { SlugWarsEngine } from '../core/gameEngine';
import { SlugWarsActionType } from '../network/protocol';

describe('Data-Driven Action Registry & Permissions', () => {
  it('contains definitions for all standard network action types', () => {
    const requiredActions: SlugWarsActionType[] = [
      'JOIN_GAME',
      'CHANGE_CONFIG',
      'START_GAME',
      'START_MOVE',
      'STOP_MOVE',
      'JUMP',
      'STOP_JUMP',
      'AIM',
      'START_STEER',
      'STOP_STEER',
      'START_CHARGE',
      'RELEASE_CHARGE',
      'DETONATE',
      'SELECT_WEAPON',
      'FIRE',
      'PLACE_SLUG',
      'NEXT_TURN',
      'ENTER_VEHICLE',
      'EXIT_VEHICLE',
      'STEER_VEHICLE',
      'REQUEST_FULL_STATE',
      'SET_FUSE_TIMER',
      'RESTART_GAME',
      'DEV_ACTION',
    ];

    for (const action of requiredActions) {
      expect(NETWORK_ACTION_REGISTRY[action]).toBeDefined();
      expect(NETWORK_ACTION_REGISTRY[action].permission).toBeDefined();
      expect(typeof NETWORK_ACTION_REGISTRY[action].executeHost).toBe('function');
    }
  });

  describe('checkActionPermission', () => {
    it('handles ANY, HOST_ONLY, and ACTIVE_TURN_ONLY properly', () => {
      const engine = new SlugWarsEngine();
      engine.addTeam('host_1', 'Host', '#ef4444', '👑', true);
      engine.addTeam('guest_1', 'Guest', '#3b82f6', '🐌', false);
      engine.startGame();

      const hostCtx: HostActionContext = {
        engine,
        playerId: 'host_1',
        hostId: 'host_1',
        peerManager: {} as any,
        syncState: () => {},
        broadcastState: () => {},
      };

      const guestCtx: HostActionContext = {
        engine,
        playerId: 'guest_1',
        hostId: 'host_1',
        peerManager: {} as any,
        syncState: () => {},
        broadcastState: () => {},
      };

      expect(checkActionPermission('ANY', hostCtx)).toBe(true);
      expect(checkActionPermission('ANY', guestCtx)).toBe(true);

      expect(checkActionPermission('HOST_ONLY', hostCtx)).toBe(true);
      expect(checkActionPermission('HOST_ONLY', guestCtx)).toBe(false);

      // In placement phase, host is active first
      engine.state.activeTeamId = 'host_1';
      expect(checkActionPermission('ACTIVE_TURN_ONLY', hostCtx)).toBe(true);
      expect(checkActionPermission('ACTIVE_TURN_ONLY', guestCtx)).toBe(false);

      // Now guest is active
      engine.state.activeTeamId = 'guest_1';
      expect(checkActionPermission('ACTIVE_TURN_ONLY', guestCtx)).toBe(true);
    });
  });

  describe('canExecuteInPhase', () => {
    it('allows actions matching allowed phases', () => {
      expect(canExecuteInPhase(['AIMING', 'TURN_TIME'], 'AIMING')).toBe(true);
      expect(canExecuteInPhase(['AIMING', 'TURN_TIME'], 'LOBBY')).toBe(false);
      expect(canExecuteInPhase(undefined, 'LOBBY')).toBe(true);
    });
  });
});

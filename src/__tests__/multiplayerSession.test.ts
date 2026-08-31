import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { processHostAction } from '../hooks/game/useHostActionHandler';
import { buildStateDelta, applyStateDelta } from '../network/netSerializer';
import { encodeBinaryDelta, decodeBinaryDelta } from '../network/netBinarySerializer';
import { sanitizeGameState, SlugWarsNetworkMessage } from '../network/protocol';
import { GameState } from '../core/types';

describe('Multiplayer P2P Session & Network Replication', () => {
  let hostEngine: SlugWarsEngine;
  let lastBroadcastedState: GameState | null = null;
  let syncStateCalled = false;

  const mockPeerManager = {
    myPeerId: 'host_peer_123',
    getTrustedUsername: (id: string) => `User_${id}`,
    connections: new Map<string, any>(),
  };

  const syncState = () => {
    syncStateCalled = true;
  };

  const broadcastState = (state: GameState) => {
    lastBroadcastedState = sanitizeGameState(state);
  };

  const dispatchAction = (senderPeerId: string, msg: SlugWarsNetworkMessage) => {
    processHostAction(
      hostEngine,
      true, // isHost
      'host_peer_123',
      mockPeerManager as any,
      syncState,
      broadcastState,
      senderPeerId,
      msg
    );
  };

  beforeEach(() => {
    hostEngine = new SlugWarsEngine({
      turnDuration: 45,
      slugsPerTeam: 2,
      mapTheme: 'FORTRESS',
      mapSeed: 999,
    });
    syncStateCalled = false;
    lastBroadcastedState = null;
  });

  describe('Lobby Management & Player Authentication', () => {
    it('allows guest to join via JOIN_GAME and registers new team', () => {
      const joinMsg: SlugWarsNetworkMessage = {
        type: 'ACTION',
        actionName: 'JOIN_GAME',
        payload: { name: 'Invité Bob', color: '#3b82f6', avatar: '🤠' },
      };
      dispatchAction('guest_peer_456', joinMsg);
      expect(hostEngine.state.teams.length).toBe(1);
      expect(hostEngine.state.teams[0].id).toBe('guest_peer_456');
      expect(hostEngine.state.teams[0].name).toBe('Invité Bob');
      expect(lastBroadcastedState).not.toBeNull();
      expect(syncStateCalled).toBe(true);
    });

    it('registers late-joining players into teams when host is in dev mode', () => {
      hostEngine.state.isDevHost = true;
      hostEngine.addTeam('host_peer_123', 'Host Alice', '#ef4444', '👑', true);
      hostEngine.startGame();
      expect(hostEngine.state.phase).toBe('PLACEMENT');

      const lateJoinMsg: SlugWarsNetworkMessage = {
        type: 'ACTION',
        actionName: 'JOIN_GAME',
        payload: { name: 'Invité LateJoin', color: '#10b981', avatar: '⚡' },
      };
      dispatchAction('guest_peer_789', lateJoinMsg);

      expect(hostEngine.state.teams.length).toBe(2);
      expect(hostEngine.state.teams[1].id).toBe('guest_peer_789');
      const lateSlugs = hostEngine.state.slugs.filter((s) => s.teamId === 'guest_peer_789');
      expect(lateSlugs.length).toBe(2);
      expect(lateSlugs.every((s) => !s.isPlaced && s.isAlive)).toBe(true);
    });

    it('rejects late-joining players during active match when host is not in dev mode', () => {
      hostEngine.state.isDevHost = false;
      hostEngine.addTeam('host_peer_123', 'Host Alice', '#ef4444', '👑', true);
      hostEngine.startGame();
      const lateJoinMsg: SlugWarsNetworkMessage = {
        type: 'ACTION',
        actionName: 'JOIN_GAME',
        payload: { name: 'Late Guest', color: '#10b981', avatar: '⚡' },
      };
      dispatchAction('guest_peer_999', lateJoinMsg);
      expect(hostEngine.state.teams.length).toBe(1);
    });

    it('rejects CHANGE_CONFIG from non-host players', () => {
      hostEngine.addTeam('host_peer_123', 'Host Alice', '#ef4444', '👑', true);
      hostEngine.addTeam('guest_peer_456', 'Guest Bob', '#3b82f6', '🐌', false);
      const configMsg: SlugWarsNetworkMessage = {
        type: 'ACTION',
        actionName: 'CHANGE_CONFIG',
        payload: { config: { turnDuration: 10 } },
      };
      dispatchAction('guest_peer_456', configMsg);
      expect(hostEngine.state.config.turnDuration).toBe(45); // Unchanged

      dispatchAction('host_peer_123', configMsg);
      expect(hostEngine.state.config.turnDuration).toBe(10); // Changed
    });

    it('rejects START_GAME from non-host players', () => {
      hostEngine.addTeam('host_peer_123', 'Host Alice', '#ef4444', '👑', true);
      hostEngine.addTeam('guest_peer_456', 'Guest Bob', '#3b82f6', '🐌', false);
      const startMsg: SlugWarsNetworkMessage = { type: 'ACTION', actionName: 'START_GAME' };

      dispatchAction('guest_peer_456', startMsg);
      expect(hostEngine.state.phase).toBe('LOBBY'); // Did not start

      dispatchAction('host_peer_123', startMsg);
      expect(hostEngine.state.phase).toBe('PLACEMENT'); // Started
    });
  });

  describe('Turn-based Action Permissions (Anti-Cheat / Anti-Conflict)', () => {
    beforeEach(() => {
      hostEngine.addTeam('host_peer_123', 'Team Red', '#ef4444', '🐌', true);
      hostEngine.addTeam('guest_peer_456', 'Team Blue', '#3b82f6', '🐌', false);
      hostEngine.startGame();

      let offset = 0;
      while (hostEngine.state.phase === 'PLACEMENT') {
        hostEngine.placeSlug({ x: 300 + offset * 80, y: 250 });
        offset++;
      }

      // Ensure active team is host_peer_123
      hostEngine.state.activeTeamId = 'host_peer_123';
      const activeSlug = hostEngine.state.slugs.find((s) => s.teamId === 'host_peer_123')!;
      hostEngine.state.activeSlugId = activeSlug.id;
    });

    it('rejects move, jump, and weapon fire from inactive guest during host turn', () => {
      const activeSlug = hostEngine.state.slugs.find((s) => s.id === hostEngine.state.activeSlugId)!;
      activeSlug.x = 200;
      activeSlug.y = 200;
      activeSlug.selectedWeaponId = 'bazooka';

      // Guest tries to move
      dispatchAction('guest_peer_456', {
        type: 'ACTION',
        actionName: 'START_MOVE',
        payload: { dir: 'right' },
      });
      expect(activeSlug.movingDir).toBeFalsy();
      expect(activeSlug.vx).toBe(0);

      // Guest tries to fire
      const projCountBefore = hostEngine.state.projectiles.length;
      dispatchAction('guest_peer_456', {
        type: 'ACTION',
        actionName: 'FIRE',
      });
      expect(hostEngine.state.projectiles.length).toBe(projCountBefore);
    });

    it('accepts move and fire from active player during their turn', () => {
      const activeSlug = hostEngine.state.slugs.find((s) => s.id === hostEngine.state.activeSlugId)!;
      activeSlug.x = 200;
      activeSlug.y = 200;
      activeSlug.selectedWeaponId = 'bazooka';

      // Active player starts moving
      dispatchAction('host_peer_123', {
        type: 'ACTION',
        actionName: 'START_MOVE',
        payload: { dir: 'right' },
      });
      expect(activeSlug.movingDir).toBe('right');
      expect(activeSlug.vx).toBe(2.4);
      expect(activeSlug.facing).toBe('right');

      // Active player stops moving
      dispatchAction('host_peer_123', {
        type: 'ACTION',
        actionName: 'STOP_MOVE',
      });
      expect(activeSlug.movingDir).toBeNull();
      expect(activeSlug.vx).toBe(0);

      // Active player fires
      const projCountBefore = hostEngine.state.projectiles.length;
      dispatchAction('host_peer_123', {
        type: 'ACTION',
        actionName: 'FIRE',
      });
      expect(hostEngine.state.projectiles.length).toBe(projCountBefore + 1);
    });

    it('accepts move and fire from guest when it is guest turn', () => {
      hostEngine.state.activeTeamId = 'guest_peer_456';
      const guestSlug = hostEngine.state.slugs.find((s) => s.teamId === 'guest_peer_456')!;
      hostEngine.state.activeSlugId = guestSlug.id;
      guestSlug.x = 400;
      guestSlug.y = 200;
      guestSlug.selectedWeaponId = 'bazooka';

      dispatchAction('guest_peer_456', {
        type: 'ACTION',
        actionName: 'START_MOVE',
        payload: { dir: 'left' },
      });
      expect(guestSlug.movingDir).toBe('left');
      expect(guestSlug.vx).toBe(-2.4);

      const count = hostEngine.state.projectiles.length;
      dispatchAction('guest_peer_456', { type: 'ACTION', actionName: 'FIRE' });
      expect(hostEngine.state.projectiles.length).toBe(count + 1);
    });

    it('allows autojoin late-joining player in dev mode to place unplaced slugs and take turns', () => {
      hostEngine.state.isDevHost = true;
      const joinMsg: SlugWarsNetworkMessage = {
        type: 'ACTION',
        actionName: 'JOIN_GAME',
        payload: { name: 'Late Joiner', color: '#10b981', avatar: '⚡' },
      };
      dispatchAction('guest_peer_999', joinMsg);

      expect(hostEngine.state.teams.some((t) => t.id === 'guest_peer_999')).toBe(true);
      const guestSlugs = hostEngine.state.slugs.filter((s) => s.teamId === 'guest_peer_999');
      expect(guestSlugs.length).toBe(2);

      // It becomes guest_peer_999's turn
      hostEngine.state.activeTeamId = 'guest_peer_999';
      hostEngine.state.activeSlugId = guestSlugs[0].id;
      guestSlugs[0].x = 450;
      guestSlugs[0].y = 200;

      dispatchAction('guest_peer_999', {
        type: 'ACTION',
        actionName: 'START_MOVE',
        payload: { dir: 'right' },
      });
      expect(guestSlugs[0].movingDir).toBe('right');
      expect(guestSlugs[0].vx).toBe(2.4);
    });
  });

  describe('State Delta & Binary Compression Synchronization', () => {
    it('computes, serializes, transmits and applies state deltas accurately from host to guest', () => {
      hostEngine.addTeam('team_1', 'Red', '#ef4444', '🐌', true);
      hostEngine.startGame();
      let offset = 0;
      while (hostEngine.state.phase === 'PLACEMENT') {
        hostEngine.placeSlug({ x: 300 + offset * 80, y: 250 });
        offset++;
      }

      // Deep copy state to simulate guest
      const guestState: GameState = JSON.parse(JSON.stringify(hostEngine.state));
      const prevState: GameState = JSON.parse(JSON.stringify(hostEngine.state));

      // Host state modifies: slug takes damage and moves, a crater is carved
      const hostSlug = hostEngine.state.slugs[0];
      hostSlug.hp = 65;
      hostSlug.x += 15;
      hostEngine.devDigTerrain(300, 250, 45);
      hostEngine.devBuildTerrain(400, 260, 35);

      // Host generates delta
      const delta = buildStateDelta(prevState, hostEngine.state);
      expect(delta).not.toBeNull();
      expect(delta!.terrainBuilds).toBeDefined();
      expect(delta!.craters).toBeDefined();

      // Guest applies delta
      applyStateDelta(guestState, delta!);

      // Verify guest state is now synchronized with host
      const guestSlug = guestState.slugs.find((s) => s.id === hostSlug.id)!;
      expect(guestSlug.hp).toBe(65);
      expect(guestSlug.x).toBe(hostSlug.x);
      expect(guestState.craters?.length).toBe(hostEngine.state.craters?.length);
      expect(guestState.terrainBuilds?.length).toBe(hostEngine.state.terrainBuilds?.length);
    });

    it('encodes and decodes binary deltas without data loss', () => {
      hostEngine.addTeam('team_1', 'Red', '#ef4444', '🐌', true);
      hostEngine.startGame();
      let offset = 0;
      while (hostEngine.state.phase === 'PLACEMENT') {
        hostEngine.placeSlug({ x: 300 + offset * 80, y: 250 });
        offset++;
      }

      const prevState: GameState = JSON.parse(JSON.stringify(hostEngine.state));
      hostEngine.state.wind = -3.5;
      hostEngine.state.turnTimer = 32;
      Object.assign(hostEngine.state.slugs[0], { x: 450.5, y: 220.0, hp: 80 });

      const delta = buildStateDelta(prevState, hostEngine.state)!;
      expect(delta).not.toBeNull();

      const binBuffer = encodeBinaryDelta(delta);
      expect(binBuffer.byteLength).toBeGreaterThan(0);

      // Decode from binary buffer
      const decodedDelta = decodeBinaryDelta(binBuffer);
      expect(decodedDelta).not.toBeNull();

      // Apply decoded delta to guest
      const guestState: GameState = JSON.parse(JSON.stringify(prevState));
      applyStateDelta(guestState, decodedDelta!);

      expect(guestState.wind).toBeCloseTo(-3.5, 1);
      expect(guestState.turnTimer).toBe(32);
      expect(guestState.slugs[0].hp).toBe(80);
      expect(guestState.slugs[0].x).toBeCloseTo(450.5, 1);
    });
  });
});

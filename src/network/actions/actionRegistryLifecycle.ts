import { sanitizeGameState, TEAM_COLORS, SlugWarsActionType } from '../protocol';
import { resolveLobbyPlayerName } from '../../core/profile';
import { netMetrics } from '../../core/networkMetrics';
import { isHostDevModeActive } from '../devSession';
import { NetworkActionDefinition } from './actionRegistryTypes';

export const LIFECYCLE_ACTION_REGISTRY: Partial<Record<SlugWarsActionType, NetworkActionDefinition<any>>> = {
  JOIN_GAME: {
    permission: 'ANY',
    executeHost: (ctx, payload) => {
      const { engine, playerId, hostId, peerManager, syncState, broadcastState } = ctx;
      const isDev = isHostDevModeActive(engine.state, playerId === hostId || !engine.state.teams.some((t) => t.isHost));
      if (isDev) engine.state.isDevHost = true;

      if (engine.state.phase !== 'LOBBY' && !engine.state.isDevHost) {
        console.warn(`[P2P] Late join/autojoin rejected from player ${playerId}: Host is not in dev mode.`);
        return;
      }
      const requestedName = payload?.name?.trim();
      const trusted = resolveLobbyPlayerName(requestedName, peerManager.getTrustedUsername?.(playerId), playerId);
      const existing = engine.state.teams.find((t) => t.id === playerId);
      if (existing) {
        if (requestedName && !requestedName.startsWith('Joueur-')) existing.name = requestedName;
        if (payload?.avatar) existing.avatar = payload.avatar;
        if (payload?.hat) existing.hat = payload.hat;
      } else {
        const colorIdx = engine.state.teams.length % TEAM_COLORS.length;
        engine.addTeam(
          playerId,
          trusted,
          payload?.color || TEAM_COLORS[colorIdx],
          payload?.avatar || '🐌',
          playerId === hostId,
          payload?.hat
        );
      }
      syncState();
      broadcastState(engine.state);

      const conn = peerManager.connections?.get(playerId) || Array.from(peerManager.connections?.values() || []).find((c: any) => c.peer === playerId);
      if (conn && conn.open) {
        const sanitized = sanitizeGameState(engine.state);
        const resMsg = { type: 'STATE_UPDATE', state: sanitized };
        conn.send(resMsg);
        netMetrics.recordUpload(resMsg);
      }
    },
  },

  CHANGE_CONFIG: {
    permission: 'HOST_ONLY',
    allowedPhases: ['LOBBY'],
    executeHost: ({ engine, broadcastState }, payload) => {
      if (payload?.config) {
        engine.setConfig(payload.config);
        broadcastState(engine.state);
      }
    },
  },

  START_GAME: {
    permission: 'HOST_ONLY',
    allowedPhases: ['LOBBY'],
    executeHost: ({ engine, broadcastState }) => {
      engine.startGame();
      broadcastState(engine.state);
    },
  },

  RESTART_GAME: {
    permission: 'HOST_ONLY',
    executeHost: ({ engine, broadcastState }) => {
      engine.restartGame();
      broadcastState(engine.state);
    },
  },

  REQUEST_FULL_STATE: {
    permission: 'ANY',
    executeHost: ({ engine, playerId, hostId, peerManager, broadcastState }) => {
      if (engine.state.phase === 'LOBBY' && !engine.state.teams.some((t) => t.id === playerId)) {
        const trusted = resolveLobbyPlayerName(undefined, peerManager.getTrustedUsername?.(playerId), playerId);
        const colorIdx = engine.state.teams.length % TEAM_COLORS.length;
        engine.addTeam(playerId, trusted, TEAM_COLORS[colorIdx], '🐌', playerId === hostId);
        broadcastState(engine.state);
      } else {
        const conn = peerManager.connections?.get(playerId) || Array.from(peerManager.connections?.values() || []).find((c: any) => c.peer === playerId);
        const sanitized = sanitizeGameState(engine.state);
        if (conn && conn.open) {
          const resMsg = { type: 'STATE_UPDATE', state: sanitized };
          conn.send(resMsg);
          netMetrics.recordUpload(resMsg);
        } else {
          broadcastState(engine.state);
        }
      }
    },
  },

  NEXT_TURN: {
    permission: 'HOST_ONLY',
    executeHost: ({ engine }) => {
      engine.endTurn();
    },
  },

  SET_TEAM_HAT: {
    permission: 'ANY',
    allowedPhases: ['LOBBY'],
    executeHost: ({ engine, playerId, hostId, syncState, broadcastState }, payload) => {
      const targetTeamId = payload?.teamId || playerId;
      if (playerId !== targetTeamId && playerId !== hostId) return;
      const team = engine.state.teams.find((t) => t.id === targetTeamId);
      if (team && payload?.hat) {
        team.hat = payload.hat;
        syncState();
        broadcastState(engine.state);
      }
    },
  },

  DEV_ACTION: {
    permission: 'DEV_OR_HOST',
    executeHost: ({ engine, syncState, broadcastState }, payload) => {
      const method = payload?.devMethod;
      const args = payload?.devArgs || [];
      if (method && typeof (engine as any)[method] === 'function') {
        (engine as any)[method](...args);
        syncState();
        broadcastState(engine.state);
      }
    },
  },
};

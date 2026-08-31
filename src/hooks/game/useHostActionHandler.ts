import { useCallback, MutableRefObject } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { SlugWarsNetworkMessage, sanitizeGameState, TEAM_COLORS } from '../../network/protocol';
import { netMetrics } from '../../core/networkMetrics';
import { GameState } from '../../core/types';
import { PeerManagerLike } from 'p2play-core';
import { resolveLobbyPlayerName } from './useHostLobbySync';

export function processHostAction(
  engine: SlugWarsEngine,
  isHost: boolean,
  myPeerId: string,
  peerManager: PeerManagerLike,
  syncState: () => void,
  broadcastState: (state: GameState) => void,
  senderPeerId: string,
  rawMsg: any
) {
  netMetrics.recordDownload(rawMsg);
  const msg = rawMsg as SlugWarsNetworkMessage;
  if (!isHost) return;
  const playerId = senderPeerId;
  const hostId = myPeerId || peerManager.myPeerId;

  if (msg.type === 'ACTION') {
    switch (msg.actionName) {
      case 'JOIN_GAME': {
        const isDev = engine.state.isDevHost || (typeof window !== 'undefined' && (
          new URLSearchParams(window.location.search).get('dev') === 'true' ||
          new URLSearchParams(window.location.search).get('dev') === '1' ||
          new URLSearchParams(window.location.search).get('debug') === 'true' ||
          new URLSearchParams(window.location.search).get('debug') === '1' ||
          sessionStorage.getItem('slugwars_dev_enabled') === 'true'
        ));
        if (isDev) engine.state.isDevHost = true;

        if (engine.state.phase !== 'LOBBY' && !engine.state.isDevHost) {
          console.warn(`[P2P] Late join/autojoin rejected from player ${playerId}: Host is not in dev mode.`);
          break;
        }
        const requestedName = msg.payload?.name?.trim();
        const trusted = resolveLobbyPlayerName(requestedName, peerManager.getTrustedUsername?.(playerId), playerId);
        const existing = engine.state.teams.find((t) => t.id === playerId);
        if (existing) {
          if (requestedName && !requestedName.startsWith('Joueur-')) existing.name = requestedName;
          if (msg.payload?.avatar) existing.avatar = msg.payload.avatar;
        } else {
          const colorIdx = engine.state.teams.length % TEAM_COLORS.length;
          engine.addTeam(
            playerId,
            trusted,
            msg.payload?.color || TEAM_COLORS[colorIdx],
            msg.payload?.avatar || '🐌',
            playerId === hostId
          );
        }
        syncState();
        broadcastState(engine.state);

        const conn = peerManager.connections?.get(playerId);
        if (conn && conn.open) {
          const sanitized = sanitizeGameState(engine.state);
          const resMsg = { type: 'STATE_UPDATE', state: sanitized };
          conn.send(resMsg);
          netMetrics.recordUpload(resMsg);
        }
        break;
      }
          case 'CHANGE_CONFIG':
            if (msg.payload?.config && playerId === hostId) {
              engine.setConfig(msg.payload.config);
              broadcastState(engine.state);
            }
            break;
          case 'START_GAME':
            if (playerId === hostId) {
              engine.startGame();
              broadcastState(engine.state);
            }
            break;
          case 'START_MOVE':
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.dir) {
              engine.startMove(msg.payload.dir);
            }
            break;
          case 'STOP_MOVE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.stopMove();
            }
            break;
          case 'JUMP':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.jumpSlug();
            }
            break;
          case 'START_STEER':
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.dir) {
              engine.startSteer(msg.payload.dir);
            }
            break;
          case 'STOP_STEER':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.stopSteer();
            }
            break;
          case 'ENTER_VEHICLE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.enterVehicle();
            }
            break;
          case 'EXIT_VEHICLE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.exitVehicle();
            }
            break;
          case 'STEER_VEHICLE':
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.dir) {
              engine.steerVehicle(msg.payload.dir);
            }
            break;
          case 'START_CHARGE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.startCharge(msg.payload?.targetPoint);
            }
            break;
          case 'RELEASE_CHARGE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug) {
                if (msg.payload?.aimAngle !== undefined) activeSlug.aimAngle = msg.payload.aimAngle;
                if (msg.payload?.aimPower !== undefined) activeSlug.aimPower = msg.payload.aimPower;
                if (msg.payload?.facing) activeSlug.facing = msg.payload.facing;
              }
              engine.releaseCharge(msg.payload?.targetPoint);
            }
            break;
          case 'DETONATE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              engine.detonateSheep();
            }
            break;
          case 'AIM': {
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug) {
                if (msg.payload?.aimAngle !== undefined) activeSlug.aimAngle = msg.payload.aimAngle;
                if (msg.payload?.aimPower !== undefined && !activeSlug.isChargingPower) {
                  activeSlug.aimPower = msg.payload.aimPower;
                }
                if (msg.payload?.facing) activeSlug.facing = msg.payload.facing;
                if (msg.payload?.targetPoint) activeSlug.currentTargetPoint = msg.payload.targetPoint;
              }
            }
            break;
          }
          case 'SELECT_WEAPON': {
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.weaponId) {
              engine.selectWeapon(msg.payload.weaponId);
            }
            break;
          }
          case 'SET_FUSE_TIMER': {
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.seconds !== undefined) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug) {
                engine.setFuseTimer(activeSlug.id, msg.payload.seconds);
              }
            }
            break;
          }
          case 'FIRE':
            if (playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug) {
                if (msg.payload?.aimAngle !== undefined) activeSlug.aimAngle = msg.payload.aimAngle;
                if (msg.payload?.aimPower !== undefined) activeSlug.aimPower = msg.payload.aimPower;
                if (msg.payload?.facing) activeSlug.facing = msg.payload.facing;
              }
              engine.fireWeapon(msg.payload?.targetPoint);
            }
            break;
          case 'PLACE_SLUG':
            if ((playerId === engine.state.activeTeamId || playerId === hostId || engine.state.teams.length <= 1) && msg.payload?.point) {
              engine.placeSlug(msg.payload.point);
              syncState();
              broadcastState(engine.state);
            }
            break;
          case 'RESTART_GAME':
            if (playerId === hostId) {
              engine.restartGame();
              broadcastState(engine.state);
            }
            break;
          case 'REQUEST_FULL_STATE': {
            if (engine.state.phase === 'LOBBY' && !engine.state.teams.some((t) => t.id === playerId)) {
              const trusted = resolveLobbyPlayerName(undefined, peerManager.getTrustedUsername?.(playerId), playerId);
              const colorIdx = engine.state.teams.length % TEAM_COLORS.length;
              engine.addTeam(playerId, trusted, TEAM_COLORS[colorIdx], '🐌', playerId === hostId);
              broadcastState(engine.state);
            } else {
              const conn = peerManager.connections?.get(playerId);
              const sanitized = sanitizeGameState(engine.state);
              if (conn && conn.open) {
                const resMsg = { type: 'STATE_UPDATE', state: sanitized };
                conn.send(resMsg);
                netMetrics.recordUpload(resMsg);
              } else {
                broadcastState(engine.state);
              }
            }
            break;
          }
          case 'DEV_ACTION': {
            if (playerId === hostId || engine.state.teams.length <= 1) {
              const method = msg.payload?.devMethod;
              const args = msg.payload?.devArgs || [];
              if (method && typeof (engine as any)[method] === 'function') {
                (engine as any)[method](...args);
                syncState();
                broadcastState(engine.state);
              }
            }
            break;
          }
        }
        syncState();
      }
    }
export function useHostActionHandler(
  engineRef: MutableRefObject<SlugWarsEngine>,
  isHost: boolean,
  myPeerId: string,
  peerManager: PeerManagerLike,
  syncState: () => void,
  broadcastState: (state: GameState) => void
) {
  const handleHostAction = useCallback(
    (senderPeerId: string, rawMsg: any) => {
      processHostAction(
        engineRef.current,
        isHost,
        myPeerId,
        peerManager,
        syncState,
        broadcastState,
        senderPeerId,
        rawMsg
      );
    },
    [isHost, myPeerId, peerManager, syncState, broadcastState, engineRef]
  );

  return { handleHostAction };
}

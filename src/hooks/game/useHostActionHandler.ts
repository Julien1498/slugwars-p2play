import { useCallback, MutableRefObject } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { SlugWarsNetworkMessage, sanitizeGameState } from '../../network/protocol';
import { netMetrics } from '../../core/networkMetrics';
import { GameState } from '../../core/types';
import { PeerManagerLike } from 'p2play-core';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
        const requestedName = msg.payload?.name?.trim();
            const isGeneric = (n?: string) => !n || n.startsWith('Joueur-') || n.startsWith('Joueur ') || n.startsWith('Player-');
            const trusted = (!isGeneric(requestedName) ? requestedName : null) || peerManager.getTrustedUsername?.(playerId) || requestedName || `Limace ${playerId.slice(0, 4)}`;
            const existing = engine.state.teams.find((t) => t.id === playerId);
            if (existing) {
              if (requestedName && !isGeneric(requestedName)) existing.name = requestedName;
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
            broadcastState(engine.state);
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
              const trusted = peerManager.getTrustedUsername?.(playerId) || `Limace ${playerId.slice(0, 4)}`;
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

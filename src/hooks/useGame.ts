import { useState, useRef, useCallback, useEffect } from 'react';
import { usePeer } from './usePeer';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameState, Vector2D } from '../core/types';
import { SlugWarsNetworkMessage, sanitizeGameState } from '../network/protocol';
import { attachPresenceHandlers, createSeatEngine } from 'p2play-core/presence';
import type { PeerManagerLike } from 'p2play-core';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function useGame(options?: {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
}) {
  const p2p = usePeer({ externalPeerManager: options?.externalPeerManager });
  const {
    isHost,
    myPeerId,
    hostPeerId,
    peerManager,
    status,
    error,
    chatMessages,
    sendChat: sendChatRaw,
    disconnect,
    hostGame,
    joinGame,
  } = p2p;

  const engineRef = useRef<SlugWarsEngine>(new SlugWarsEngine());
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const prevMapKeyRef = useRef<string | null>(null);

  const syncState = useCallback(() => {
    setGameState({ ...engineRef.current.state });
  }, []);

  const broadcastState = useCallback(
    (state: GameState) => {
      const activeId = myPeerId || peerManager.myPeerId;
      if (!activeId) return;
      const sanitized = sanitizeGameState(state);

      if (peerManager.onStateReceived) {
        peerManager.onStateReceived(sanitized);
      }

      if (peerManager.connections) {
        for (const conn of peerManager.connections.values()) {
          if (conn.open) {
            conn.send({ type: 'STATE_UPDATE', state: sanitized });
          }
        }
      }
    },
    [peerManager, myPeerId]
  );

  // Host Action Handler
  const handleHostAction = useCallback(
    (senderPeerId: string, rawMsg: any) => {
      const msg = rawMsg as SlugWarsNetworkMessage;
      if (!isHost) return;
      const engine = engineRef.current;
      const playerId = senderPeerId;

      if (msg.type === 'ACTION') {
        switch (msg.actionName) {
          case 'JOIN_GAME': {
            const trusted = peerManager.getTrustedUsername?.(playerId) || msg.payload?.name || `Limace ${playerId.slice(0, 4)}`;
            const colorIdx = engine.state.teams.length % TEAM_COLORS.length;
            engine.addTeam(
              playerId,
              trusted,
              msg.payload?.color || TEAM_COLORS[colorIdx],
              msg.payload?.avatar || '🐌',
              playerId === (myPeerId || peerManager.myPeerId)
            );
            break;
          }
          case 'CHANGE_CONFIG':
            if (msg.payload?.config) {
              engine.setConfig(msg.payload.config);
            }
            break;
          case 'START_GAME':
            engine.startGame();
            break;
          case 'START_MOVE':
            if (msg.payload?.dir) {
              engine.startMove(msg.payload.dir);
            }
            break;
          case 'STOP_MOVE':
            engine.stopMove();
            break;
          case 'JUMP':
            engine.jumpSlug();
            break;
          case 'START_STEER':
            if (msg.payload?.dir) {
              engine.startSteer(msg.payload.dir);
            }
            break;
          case 'STOP_STEER':
            engine.stopSteer();
            break;
          case 'ENTER_VEHICLE':
            engine.enterVehicle();
            break;
          case 'EXIT_VEHICLE':
            engine.exitVehicle();
            break;
          case 'STEER_VEHICLE':
            if (msg.payload?.dir) {
              engine.steerVehicle(msg.payload.dir);
            }
            break;
          case 'START_CHARGE':
            engine.startCharge(msg.payload?.targetPoint);
            break;
          case 'RELEASE_CHARGE':
            engine.releaseCharge(msg.payload?.targetPoint);
            break;
          case 'AIM': {
            const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
            if (activeSlug && activeSlug.teamId === playerId) {
              if (msg.payload?.aimAngle !== undefined) activeSlug.aimAngle = msg.payload.aimAngle;
              if (msg.payload?.aimPower !== undefined) activeSlug.aimPower = msg.payload.aimPower;
              if (msg.payload?.facing) activeSlug.facing = msg.payload.facing;
            }
            break;
          }
          case 'SELECT_WEAPON': {
            const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
            if (activeSlug && activeSlug.teamId === playerId && msg.payload?.weaponId) {
              activeSlug.selectedWeaponId = msg.payload.weaponId;
            }
            break;
          }
          case 'FIRE':
            engine.fireWeapon(msg.payload?.targetPoint);
            break;
          case 'PLACE_SLUG':
            if (msg.payload?.point) {
              engine.placeSlug(msg.payload.point);
            }
            break;
          case 'RESTART_GAME':
            engine.state.phase = 'LOBBY';
            break;
        }
        syncState();
        broadcastState(engine.state);
      }
    },
    [isHost, myPeerId, peerManager, syncState, broadcastState]
  );

  // Presence / Reconnect Handlers
  useEffect(() => {
    if (!isHost) return;
    const presence = attachPresenceHandlers({
      peerManager,
      getEngine: () =>
        createSeatEngine({
          getPhase: () => engineRef.current.state.phase,
          getPlayers: () => engineRef.current.state.teams,
          markDisconnected: () => {},
          isDisconnected: () => false,
          remapPlayerId: () => false,
          removePlayer: (id) => engineRef.current.removeTeam(id),
        }),
      onBroadcast: () => broadcastState(engineRef.current.state),
      onHostAction: handleHostAction,
    });
    return () => presence.dispose();
  }, [isHost, peerManager, handleHostAction, broadcastState]);

  // Set guest state receiver callback
  useEffect(() => {
    if (isHost) return;
    peerManager.onStateReceived = (newState: any) => {
      if (newState && newState.config) {
        const engine = engineRef.current;
        engine.state = newState;

        const mapKey = `${newState.config.mapSeed}_${newState.config.mapTheme}`;
        if (prevMapKeyRef.current !== mapKey) {
          prevMapKeyRef.current = mapKey;
          engine.initTerrain();
        }

        if (newState.explosions && newState.explosions.length > 0) {
          for (const ex of newState.explosions) {
            engine.terrain.carveExplosion(ex.x, ex.y, ex.radius);
          }
        }

        setGameState(newState);
      }
    };
  }, [isHost, peerManager]);

  // Host room creation wrapper
  const hostRoom = useCallback(
    async (name: string, avatar: string) => {
      const roomId = await hostGame(undefined, { username: name, avatar });
      const engine = new SlugWarsEngine();
      engineRef.current = engine;
      engine.addTeam(roomId, name, TEAM_COLORS[0], avatar, true);
      syncState();
      broadcastState(engine.state);
    },
    [hostGame, syncState, broadcastState]
  );

  // Guest room join wrapper
  const joinRoom = useCallback(
    async (name: string, avatar: string, roomId: string) => {
      const { peerId } = await joinGame(roomId, { username: name, avatar });
      const sendJoin = () => {
        peerManager.sendToHost('ACTION', {
          actionName: 'JOIN_GAME',
          playerId: peerId,
          payload: { name, avatar },
        });
      };
      [200, 800, 2000].forEach((ms) => setTimeout(sendJoin, ms));
    },
    [joinGame, peerManager]
  );

  // Embedded mode lobby initialization
  useEffect(() => {
    if (options?.isEmbedded && isHost && engineRef.current.state.phase === 'LOBBY' && myPeerId) {
      const hostName = options.playerName || peerManager.getTrustedUsername?.(myPeerId) || 'Hôte';
      const hostAvatar = options.playerAvatar || '🐌';
      engineRef.current.addTeam(myPeerId, hostName, TEAM_COLORS[0], hostAvatar, true);

      if (peerManager.lobbyPlayers) {
        peerManager.lobbyPlayers.forEach((p) => {
          if (p.peerId && p.peerId !== myPeerId) {
            const colorIdx = engineRef.current.state.teams.length % TEAM_COLORS.length;
            engineRef.current.addTeam(
              p.peerId,
              p.username || `Joueur ${p.peerId.slice(0, 4)}`,
              TEAM_COLORS[colorIdx],
              p.avatar || '🐌',
              false
            );
          }
        });
      }

      syncState();
      broadcastState(engineRef.current.state);
    }
  }, [isHost, myPeerId, options?.isEmbedded, options?.playerName, options?.playerAvatar, peerManager.lobbyPlayers, syncState, broadcastState]);

  // Physics Loop (50ms interval) with throttled React state sync (20 FPS UI sync to preserve 60 FPS Canvas)
  useEffect(() => {
    if (!isHost || gameState.phase === 'LOBBY' || gameState.phase === 'GAME_OVER') return;
    let tickCount = 0;

    const interval = setInterval(() => {
      engineRef.current.tick();
      tickCount++;

      // Broadcast state to peers and update local state every tick (50ms / 20Hz)
      broadcastState(engineRef.current.state);
      setGameState({ ...engineRef.current.state });
    }, 50);
    return () => clearInterval(interval);
  }, [isHost, gameState.phase, broadcastState]);

  // Action Sender
  const sendAction = useCallback(
    (actionName: string, payload?: any) => {
      const msg: SlugWarsNetworkMessage = { type: 'ACTION', actionName: actionName as any, payload };
      if (isHost) {
        if (myPeerId) handleHostAction(myPeerId, msg);
      } else {
        peerManager.sendToHost('ACTION', { actionName, payload });
      }
    },
    [isHost, myPeerId, peerManager, handleHostAction]
  );

  const sendChat = useCallback(
    (text: string) => {
      sendChatRaw(options?.playerName || 'Limace', text);
    },
    [sendChatRaw, options?.playerName]
  );

  return {
    peerManager,
    gameState,
    engine: engineRef.current,
    sendAction,
    sendChat,
    chatMessages,
    status,
    error,
    isHost,
    myPeerId: myPeerId || '',
    hostPeerId: hostPeerId || '',
    disconnect,
    hostRoom,
    joinRoom,
  };
}

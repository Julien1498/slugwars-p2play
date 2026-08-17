import { useState, useRef, useCallback, useEffect } from 'react';
import { usePeer } from './usePeer';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameState } from '../core/types';
import { SlugWarsNetworkMessage } from '../network/protocol';
import { attachPresenceHandlers, createSeatEngine } from 'p2play-core/presence';
import { syncRoomUrlToAddressBar, type PeerManagerLike } from 'p2play-core';
import { createWorkerInterval } from '../core/workerTimer';
import { netMetrics } from '../core/networkMetrics';
import { perfTracker } from '../core/perfTracker';
import { useGameBroadcast } from './game/useGameBroadcast';
import { useHostActionHandler } from './game/useHostActionHandler';
import { useGuestStateReceiver } from './game/useGuestStateReceiver';

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

  const engineRef = useRef<SlugWarsEngine>(null!);
  if (!engineRef.current) {
    engineRef.current = new SlugWarsEngine();
  }
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const lastSentStateRef = useRef<GameState | null>(null);

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setGameState({ ...engineRef.current.state });
    }
  }, []);

  useEffect(() => {
    netMetrics.setPeerManager(peerManager);
  }, [peerManager]);

  const { broadcastState, broadcastDeltaState } = useGameBroadcast(peerManager, myPeerId || '', lastSentStateRef);
  const { handleHostAction } = useHostActionHandler(engineRef, isHost, myPeerId || '', peerManager, syncState, broadcastState);
  useGuestStateReceiver(engineRef, isHost, peerManager, setGameState);

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

  // Guest Local Timer Countdown (smooth 50ms countdown between 1 Hz host sync ticks, unthrottled in background)
  useEffect(() => {
    if (isHost || gameState.phase === 'LOBBY' || gameState.phase === 'GAME_OVER') return;

    const stopWorker = createWorkerInterval(() => {
      const state = engineRef.current.state;
      let changed = false;
      if (state.phase === 'AIMING' || state.phase === 'PLACEMENT' || state.phase === 'TURN_START') {
        if (state.turnTimer > 0) {
          state.turnTimer = Math.max(0, state.turnTimer - 0.05);
          changed = true;
        }
      } else if (state.phase === 'RETREAT' && state.retreatTimer !== undefined) {
        if (state.retreatTimer > 0) {
          state.retreatTimer = Math.max(0, state.retreatTimer - 0.05);
          changed = true;
        }
      }
      if (changed) {
        setGameState({ ...state });
      }
    }, 50);

    return () => stopWorker();
  }, [isHost, gameState.phase]);

  // Host room creation wrapper
  const hostRoom = useCallback(
    async (name: string, avatar: string) => {
      const roomId = await hostGame(undefined, { username: name, avatar });
      syncRoomUrlToAddressBar(roomId);
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
      syncRoomUrlToAddressBar(roomId);
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

  // Host Physics Loop (Web Worker 50ms / 20 Hz delta broadcasting during gameplay - unthrottled in background tabs!)
  useEffect(() => {
    if (!isHost || gameState.phase === 'LOBBY' || gameState.phase === 'GAME_OVER') return;

    const stopWorker = createWorkerInterval(() => {
      const t0 = performance.now();
      engineRef.current.tick();
      const dt = performance.now() - t0;
      perfTracker.recordPhysicsTick(dt);

      broadcastDeltaState(engineRef.current.state);
      setGameState({ ...engineRef.current.state });
    }, 50);

    return () => stopWorker();
  }, [isHost, gameState.phase, broadcastDeltaState]);

  // Tab-Switch / Focus Recovery: Instantly re-synchronize full state when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && engineRef.current.state.phase !== 'LOBBY') {
        if (isHost) {
          broadcastState(engineRef.current.state);
        } else {
          peerManager.sendToHost('ACTION', { actionName: 'REQUEST_FULL_STATE' });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isHost, broadcastState, peerManager]);

  // Action Sender
  const sendAction = useCallback(
    (actionName: string, payload?: any) => {
      const msg: SlugWarsNetworkMessage = { type: 'ACTION', actionName: actionName as any, payload };
      if (isHost) {
        if (myPeerId) handleHostAction(myPeerId, msg);
      } else {
        peerManager.sendToHost('ACTION', { actionName, payload });
        netMetrics.recordUpload(msg);
      }
    },
    [isHost, myPeerId, peerManager, handleHostAction]
  );

  const sendChat = useCallback(
    (text: string) => {
      netMetrics.recordUpload(text);
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

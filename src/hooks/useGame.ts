import { useState, useRef, useCallback, useEffect } from 'react';
import { usePeer } from './usePeer';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameState } from '../core/types';
import { attachPresenceHandlers, createSeatEngine } from 'p2play-core/presence';
import { syncRoomUrlToAddressBar, type PeerManagerLike } from 'p2play-core';
import { netMetrics } from '../core/networkMetrics';
import { useGameBroadcast } from './game/useGameBroadcast';
import { useHostActionHandler } from './game/useHostActionHandler';
import { useGuestStateReceiver } from './game/useGuestStateReceiver';
import { useGuestLocalTimer } from './game/useGuestLocalTimer';
import { useHostPhysicsLoop } from './game/useHostPhysicsLoop';
import { useHostLobbySync } from './game/useHostLobbySync';
import { useVisibilityRecovery } from './game/useVisibilityRecovery';
import { useActionDispatcher } from './game/useActionDispatcher';
import { TEAM_COLORS } from '../network/protocol';
import { shouldUpdateReactUi } from '../core/uiSyncUtils';

export function useGame(options?: {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isHost?: boolean;
}) {
  const p2p = usePeer({ externalPeerManager: options?.externalPeerManager });
  const isHost = options?.isHost !== undefined ? options.isHost : p2p.isHost;
  const {
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
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDevParam =
        params.get('dev') === 'true' ||
        params.get('dev') === '1' ||
        params.get('debug') === 'true' ||
        params.get('debug') === '1';
      if (isDevParam) {
        engineRef.current.state.isDevHost = true;
      }
    }
  }
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const lastSentStateRef = useRef<GameState | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && isHost && engineRef.current) {
      const params = new URLSearchParams(window.location.search);
      const isDevParam =
        params.get('dev') === 'true' ||
        params.get('dev') === '1' ||
        params.get('debug') === 'true' ||
        params.get('debug') === '1';
      engineRef.current.state.isDevHost = isDevParam;
    }
  }, [isHost]);

  const lastUiUpdateRef = useRef<number>(0);
  const lastUiStateRef = useRef<GameState | null>(null);

  const updateReactState = useCallback((state: GameState, force: boolean = false) => {
    const now = performance.now();
    if (force || shouldUpdateReactUi(lastUiStateRef.current, state, lastUiUpdateRef.current, now)) {
      lastUiUpdateRef.current = now;
      lastUiStateRef.current = { ...state };
      setGameState(lastUiStateRef.current);
    }
  }, []);

  const syncState = useCallback(() => {
    if (engineRef.current) {
      updateReactState(engineRef.current.state, true);
    }
  }, [updateReactState]);

  useEffect(() => {
    netMetrics.setPeerManager(peerManager);
  }, [peerManager]);

  const { broadcastState, broadcastDeltaState } = useGameBroadcast(peerManager, myPeerId || '', lastSentStateRef);
  const { handleHostAction } = useHostActionHandler(engineRef, isHost, myPeerId || '', peerManager, syncState, broadcastState);
  useGuestStateReceiver(engineRef, isHost, peerManager, updateReactState, myPeerId || '');

  // 1. Presence / Reconnect Handlers
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

  // 2. Guest Local Timer & Countdown Interpolation (50ms worker loop)
  useGuestLocalTimer({
    engineRef,
    isHost,
    phase: gameState.phase,
    myPeerId: myPeerId || '',
    updateReactState,
  });

  // 3. Host Physics Loop (50ms worker loop & 20Hz delta broadcasting)
  useHostPhysicsLoop({
    engineRef,
    isHost,
    phase: gameState.phase,
    broadcastDeltaState,
    updateReactState,
  });

  // 4. Host Dynamic Lobby Sync
  useHostLobbySync({
    engineRef,
    isHost,
    myPeerId,
    peerManager,
    syncState,
    broadcastState,
    playerName: options?.playerName,
    playerAvatar: options?.playerAvatar,
  });

  // 5. Guest Embedded Mount: Send JOIN_GAME & request state from host on mount
  useEffect(() => {
    if (options?.isEmbedded && !isHost && peerManager && myPeerId) {
      const sendJoinAndSync = () => {
        peerManager.sendToHost('ACTION', {
          actionName: 'JOIN_GAME',
          playerId: myPeerId,
          payload: {
            name: options.playerName || peerManager.getTrustedUsername?.(myPeerId),
            avatar: options.playerAvatar || '🐌',
          },
        });
        peerManager.sendToHost('ACTION', {
          actionName: 'REQUEST_FULL_STATE',
        });
      };
      [100, 400, 1000, 2500].forEach((ms) => setTimeout(sendJoinAndSync, ms));
    }
  }, [options?.isEmbedded, isHost, peerManager, myPeerId, options?.playerName, options?.playerAvatar]);

  // 6. Tab-Switch / Focus Recovery
  useVisibilityRecovery({
    engineRef,
    isHost,
    broadcastState,
    peerManager,
  });

  // 7. Action Dispatcher with Optimistic Prediction and 30Hz AIM throttling
  const { sendAction } = useActionDispatcher({
    engineRef,
    isHost,
    myPeerId,
    peerManager,
    handleHostAction,
    syncState,
    setGameState,
  });

  // Host room creation wrapper
  const hostRoom = useCallback(
    async (name: string, avatar: string) => {
      const roomId = await hostGame(undefined, { username: name, avatar });
      syncRoomUrlToAddressBar(roomId);
      const engine = new SlugWarsEngine();
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const isDevParam =
        params?.get('dev') === 'true' ||
        params?.get('dev') === '1' ||
        params?.get('debug') === 'true' ||
        params?.get('debug') === '1' ||
        (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('slugwars_dev_enabled') === 'true');
      engine.state.isDevHost = !!isDevParam;
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
      const reqState = () => {
        peerManager.sendToHost('ACTION', {
          actionName: 'REQUEST_FULL_STATE',
          playerId: peerId,
        });
      };
      [100, 400, 1000, 2500].forEach((ms) => {
        setTimeout(sendJoin, ms);
        setTimeout(reqState, ms + 50);
      });
    },
    [joinGame, peerManager]
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

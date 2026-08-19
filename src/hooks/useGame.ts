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
import { sfx } from '../core/audio';
import { useGameBroadcast } from './game/useGameBroadcast';
import { useHostActionHandler } from './game/useHostActionHandler';
import { useGuestStateReceiver } from './game/useGuestStateReceiver';

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

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
  }
  const [gameState, setGameState] = useState<GameState>(engineRef.current.state);
  const lastSentStateRef = useRef<GameState | null>(null);
  const lastAimSendTimeRef = useRef<number>(0);
  const pendingAimPayloadRef = useRef<any>(null);
  const aimThrottleTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  useGuestStateReceiver(engineRef, isHost, peerManager, setGameState, myPeerId || '');

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

      // Smooth guest-side countdown for triggered landmines (2.0s -> 0.0s)
      if (state.mines && state.mines.length > 0) {
        for (const m of state.mines) {
          if (m.isTriggered && m.fuseTimerMs !== undefined && m.fuseTimerMs > 0) {
            m.fuseTimerMs = Math.max(0, m.fuseTimerMs - 50);
            changed = true;
          }
        }
      }

      // Smooth charge power filling on guest (2.5% per 50ms)
      const isMyTurn = myPeerId && state.activeTeamId === myPeerId && state.phase === 'AIMING';
      const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;
      if (activeSlug && activeSlug.isChargingPower) {
        activeSlug.aimPower = Math.min(100, (activeSlug.aimPower || 0) + 2.5);
        changed = true;
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

  // Host: Dynamic lobby sync for newly connected players while in LOBBY phase
  useEffect(() => {
    if (!isHost) return;

    const syncLobbyTeams = () => {
      if (engineRef.current.state.phase !== 'LOBBY') return;
      let changed = false;

      // Ensure host is present
      if (myPeerId && !engineRef.current.state.teams.some((t) => t.id === myPeerId)) {
        const hostName = options?.playerName || peerManager.getTrustedUsername?.(myPeerId) || 'Hôte';
        const hostAvatar = options?.playerAvatar || '🐌';
        engineRef.current.addTeam(myPeerId, hostName, TEAM_COLORS[0], hostAvatar, true);
        changed = true;
      }

      // Check all lobby players from peerManager
      if (peerManager.lobbyPlayers) {
        peerManager.lobbyPlayers.forEach((p) => {
          if (p.peerId && !engineRef.current.state.teams.some((t) => t.id === p.peerId)) {
            const colorIdx = engineRef.current.state.teams.length % TEAM_COLORS.length;
            engineRef.current.addTeam(
              p.peerId,
              p.username || `Joueur ${p.peerId.slice(0, 4)}`,
              TEAM_COLORS[colorIdx],
              p.avatar || '🐌',
              p.peerId === myPeerId
            );
            changed = true;
          }
        });
      }

      // Check all connected peer IDs from peerManager
      peerManager.connections?.forEach((conn, peerId) => {
        if (conn.open && !engineRef.current.state.teams.some((t) => t.id === peerId)) {
          const trusted = peerManager.getTrustedUsername?.(peerId) || `Joueur ${peerId.slice(0, 4)}`;
          const colorIdx = engineRef.current.state.teams.length % TEAM_COLORS.length;
          engineRef.current.addTeam(peerId, trusted, TEAM_COLORS[colorIdx], '🐌', false);
          changed = true;
        }
      });

      if (changed) {
        syncState();
        broadcastState(engineRef.current.state);
      }
    };

    syncLobbyTeams();

    const origPeerStatusChange = peerManager.onPeerStatusChange;
    peerManager.onPeerStatusChange = (peerId, st) => {
      origPeerStatusChange?.(peerId, st);
      if (st === 'CONNECTED') {
        syncLobbyTeams();
      }
    };

    const origPlayersUpdate = (peerManager as any).onPlayersUpdate;
    (peerManager as any).onPlayersUpdate = () => {
      origPlayersUpdate?.();
      syncLobbyTeams();
    };

    return () => {
      peerManager.onPeerStatusChange = origPeerStatusChange;
      (peerManager as any).onPlayersUpdate = origPlayersUpdate;
    };
  }, [isHost, myPeerId, options?.isEmbedded, options?.playerName, options?.playerAvatar, peerManager, syncState, broadcastState]);

  // Guest Embedded Mount: Send JOIN_GAME & request state from host on mount
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
        // Optimistic local state update for instantaneous 0ms client responsiveness
        const state = engineRef.current.state;
        const isMyTurn = myPeerId && state.activeTeamId === myPeerId && (state.phase === 'AIMING' || state.phase === 'TURN_TIME' || state.phase === 'RETREAT');
        const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;

        if (activeSlug) {
          if (actionName === 'AIM') {
            if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
            if (payload?.aimPower !== undefined && !activeSlug.isChargingPower) activeSlug.aimPower = payload.aimPower;
            if (payload?.facing !== undefined) activeSlug.facing = payload.facing;
            if (payload?.targetPoint !== undefined) activeSlug.currentTargetPoint = payload.targetPoint;
            setGameState({ ...state });
          } else if (actionName === 'SELECT_WEAPON') {
            if (payload?.weaponId) {
              activeSlug.selectedWeaponId = payload.weaponId;
              setGameState({ ...state });
            }
          } else if (actionName === 'SET_FUSE_TIMER') {
            if (payload?.seconds !== undefined) {
              activeSlug.fuseTimerSec = payload.seconds;
              setGameState({ ...state });
            }
          } else if (actionName === 'START_CHARGE') {
            activeSlug.isChargingPower = true;
            activeSlug.aimPower = 5;
            if (payload?.targetPoint) activeSlug.currentTargetPoint = payload.targetPoint;
            setGameState({ ...state });
          } else if (actionName === 'FIRE') {
            activeSlug.isChargingPower = false;
            if (activeSlug.selectedWeaponId === 'blowtorch') {
              activeSlug.isBlowtorching = true;
            }
            setGameState({ ...state });
          } else if (actionName === 'RELEASE_CHARGE') {
            activeSlug.isChargingPower = false;
            if (activeSlug.isBlowtorching) {
              activeSlug.isBlowtorching = false;
            }
            setGameState({ ...state });
          } else if (actionName === 'START_MOVE') {
            if (payload?.dir) {
              activeSlug.movingDir = payload.dir;
              activeSlug.facing = payload.dir;
              setGameState({ ...state });
            }
          } else if (actionName === 'STOP_MOVE') {
            activeSlug.movingDir = null;
            setGameState({ ...state });
          } else if (actionName === 'JUMP') {
            sfx.play('jump');
          }
        }

        // Throttle high-frequency AIM network packets over WebRTC (approx 30Hz / 33ms) to prevent network congestion
        if (actionName === 'AIM') {
          pendingAimPayloadRef.current = payload;
          const now = performance.now();
          if (now - lastAimSendTimeRef.current >= 33) {
            lastAimSendTimeRef.current = now;
            peerManager.sendToHost('ACTION', { actionName, payload });
            netMetrics.recordUpload(msg);
          } else if (!aimThrottleTimerRef.current) {
            aimThrottleTimerRef.current = setTimeout(() => {
              aimThrottleTimerRef.current = null;
              if (pendingAimPayloadRef.current) {
                lastAimSendTimeRef.current = performance.now();
                peerManager.sendToHost('ACTION', { actionName: 'AIM', payload: pendingAimPayloadRef.current });
                netMetrics.recordUpload({ type: 'ACTION', actionName: 'AIM', payload: pendingAimPayloadRef.current });
                pendingAimPayloadRef.current = null;
              }
            }, 33);
          }
          return;
        }

        // If firing or charging, flush any pending throttled aim packet immediately
        if (aimThrottleTimerRef.current) {
          clearTimeout(aimThrottleTimerRef.current);
          aimThrottleTimerRef.current = null;
          pendingAimPayloadRef.current = null;
        }

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

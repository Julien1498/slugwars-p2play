import { useState, useRef, useCallback, useEffect } from 'react';
import { usePeer } from './usePeer';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameState, Vector2D } from '../core/types';
import { SlugWarsNetworkMessage, sanitizeGameState } from '../network/protocol';
import { buildStateDelta, applyStateDelta, isDeltaEmpty, CompactStateDelta } from '../network/netSerializer';
import { encodeBinaryDelta, decodeBinaryDelta } from '../network/netBinarySerializer';
import { attachPresenceHandlers, createSeatEngine } from 'p2play-core/presence';
import { syncRoomUrlToAddressBar, clearRoomUrlFromAddressBar, type PeerManagerLike } from 'p2play-core';
import { createWorkerInterval } from '../core/workerTimer';
import { sfx } from '../core/audio';
import { netMetrics } from '../core/networkMetrics';
import { perfTracker } from '../core/perfTracker';

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
  const prevMapKeyRef = useRef<string | null>(null);
  const lastSentStateRef = useRef<GameState | null>(null);

  const syncState = useCallback(() => {
    if (engineRef.current) {
      setGameState({ ...engineRef.current.state });
    }
  }, []);

  useEffect(() => {
    netMetrics.setPeerManager(peerManager);
  }, [peerManager]);

  // Broadcast Full State (Lobby, Map Gen, Turn Init, Reconnect)
  const broadcastState = useCallback(
    (state: GameState) => {
      const activeId = myPeerId || peerManager.myPeerId;
      if (!activeId) return;
      const sanitized = sanitizeGameState(state);
      lastSentStateRef.current = JSON.parse(JSON.stringify(sanitized));

      if (peerManager.onStateReceived) {
        peerManager.onStateReceived(sanitized);
      }

      if (peerManager.connections) {
        for (const conn of peerManager.connections.values()) {
          if (conn.open) {
            const msg = { type: 'STATE_UPDATE', state: sanitized };
            conn.send(msg);
            netMetrics.recordUpload(msg);
          }
        }
      }
    },
    [peerManager, myPeerId]
  );

  // Broadcast Binary Buffer Delta State (Active Gameplay 20 Hz Ticks - 100% synchronized & ultra-compact)
  const broadcastDeltaState = useCallback(
    (state: GameState) => {
      const activeId = myPeerId || peerManager.myPeerId;
      if (!activeId) return;

      const delta = buildStateDelta(lastSentStateRef.current, state);
      if (isDeltaEmpty(delta)) return; // 100% Zero-bandwidth when idle!

      lastSentStateRef.current = JSON.parse(JSON.stringify(state));

      const binaryBuffer = encodeBinaryDelta(delta);
      const msg = { type: 'STATE_UPDATE', state: binaryBuffer };

      if (peerManager.connections) {
        for (const conn of peerManager.connections.values()) {
          if (conn.open) {
            conn.send(msg);
            netMetrics.recordUpload(binaryBuffer, delta);
          }
        }
      }
    },
    [peerManager, myPeerId]
  );

  // Host Action Handler with Strict Anti-Cheat Validation
  const handleHostAction = useCallback(
    (senderPeerId: string, rawMsg: any) => {
      netMetrics.recordDownload(rawMsg);
      const msg = rawMsg as SlugWarsNetworkMessage;
      if (!isHost) return;
      const engine = engineRef.current;
      const playerId = senderPeerId;
      const hostId = myPeerId || peerManager.myPeerId;

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
              playerId === hostId
            );
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
            if (playerId === engine.state.activeTeamId && msg.payload?.dir) {
              engine.startMove(msg.payload.dir);
            }
            break;
          case 'STOP_MOVE':
            if (playerId === engine.state.activeTeamId) {
              engine.stopMove();
            }
            break;
          case 'JUMP':
            if (playerId === engine.state.activeTeamId) {
              engine.jumpSlug();
            }
            break;
          case 'START_STEER':
            if (playerId === engine.state.activeTeamId && msg.payload?.dir) {
              engine.startSteer(msg.payload.dir);
            }
            break;
          case 'STOP_STEER':
            if (playerId === engine.state.activeTeamId) {
              engine.stopSteer();
            }
            break;
          case 'ENTER_VEHICLE':
            if (playerId === engine.state.activeTeamId) {
              engine.enterVehicle();
            }
            break;
          case 'EXIT_VEHICLE':
            if (playerId === engine.state.activeTeamId) {
              engine.exitVehicle();
            }
            break;
          case 'STEER_VEHICLE':
            if (playerId === engine.state.activeTeamId && msg.payload?.dir) {
              engine.steerVehicle(msg.payload.dir);
            }
            break;
          case 'START_CHARGE':
            if (playerId === engine.state.activeTeamId) {
              engine.startCharge(msg.payload?.targetPoint);
            }
            break;
          case 'RELEASE_CHARGE':
            if (playerId === engine.state.activeTeamId) {
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
            if (playerId === engine.state.activeTeamId) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug && activeSlug.teamId === playerId) {
                if (msg.payload?.aimAngle !== undefined) activeSlug.aimAngle = msg.payload.aimAngle;
                if (msg.payload?.aimPower !== undefined) activeSlug.aimPower = msg.payload.aimPower;
                if (msg.payload?.facing) activeSlug.facing = msg.payload.facing;
              }
            }
            break;
          }
          case 'SELECT_WEAPON': {
            if (playerId === engine.state.activeTeamId) {
              const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
              if (activeSlug && activeSlug.teamId === playerId && msg.payload?.weaponId) {
                activeSlug.selectedWeaponId = msg.payload.weaponId;
              }
            }
            break;
          }
          case 'FIRE':
            if (playerId === engine.state.activeTeamId) {
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
            if (playerId === engine.state.activeTeamId && msg.payload?.point) {
              engine.placeSlug(msg.payload.point);
            }
            break;
          case 'RESTART_GAME':
            if (playerId === hostId) {
              engine.state.phase = 'LOBBY';
              broadcastState(engine.state);
            }
            break;
          case 'REQUEST_FULL_STATE': {
            const conn = peerManager.connections?.get(playerId);
            const sanitized = sanitizeGameState(engine.state);
            if (conn && conn.open) {
              const resMsg = { type: 'STATE_UPDATE', state: sanitized };
              conn.send(resMsg);
              netMetrics.recordUpload(resMsg);
            } else {
              broadcastState(engine.state);
            }
            break;
          }
        }
        syncState();
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

  const knownProjIdsRef = useRef<Set<string>>(new Set());
  const knownExplosionIdsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsRef = useRef<Set<string>>(new Set());
  const knownCraterIdsRef = useRef<Set<string>>(new Set());
  const knownCrateIdsRef = useRef<Set<string>>(new Set());
  const knownMineTriggerIdsRef = useRef<Set<string>>(new Set());
  const prevPhaseRef = useRef<string>('LOBBY');

  // Set guest state / delta receiver callback with local sound effects and terrain carving
  useEffect(() => {
    if (isHost) return;
    peerManager.onStateReceived = (payload: any) => {
      if (!payload) return;
      const engine = engineRef.current;
      if (!engine) return;

      let delta: CompactStateDelta | null = null;
      if (payload instanceof ArrayBuffer || ArrayBuffer.isView(payload)) {
        try {
          delta = decodeBinaryDelta(payload);
        } catch (err) {
          console.warn('Binary decode error:', err);
        }
      } else if (payload.isDelta && payload.delta) {
        delta = payload.delta;
      }

      netMetrics.recordDownload(payload, delta || payload);

      if (delta) {
        // Sound effects for Guest on incoming new projectiles or bounces
        if (delta.projectiles && Array.isArray(delta.projectiles)) {
          for (const p of delta.projectiles) {
            if (p.id && !knownProjIdsRef.current.has(p.id)) {
              knownProjIdsRef.current.add(p.id);
              if (p.weaponId === 'super_sheep') {
                sfx.play('baah');
              } else if (p.weaponId === 'baseball_bat') {
                sfx.play('melee');
              } else if (p.weaponId !== 'teleport') {
                sfx.play('fire');
              }
            } else if (p.id && p.bounces) {
              const existing = engine.state.projectiles.find((ep) => ep.id === p.id);
              if (existing && p.vx !== undefined && Math.sign(p.vx) !== Math.sign(existing.vx) && Math.abs(p.vx - existing.vx) > 1.5) {
                sfx.play('bounce');
              }
            }
          }
        }

        // Sound effects for Guest on incoming explosions
        if (delta.explosions && Array.isArray(delta.explosions)) {
          for (const ex of delta.explosions) {
            if (ex.id && !knownExplosionIdsRef.current.has(ex.id)) {
              knownExplosionIdsRef.current.add(ex.id);
              sfx.play('explosion');
            }
          }
        }

        // Sound effects for Guest on Supply Crates dropped
        if (delta.supplyCrates && Array.isArray(delta.supplyCrates)) {
          for (const c of delta.supplyCrates) {
            if (c.id && !knownCrateIdsRef.current.has(c.id)) {
              knownCrateIdsRef.current.add(c.id);
              sfx.play('airdrop');
            }
          }
        }

        // Sound effects for Guest on Mines triggered
        if (delta.mines && Array.isArray(delta.mines)) {
          for (const m of delta.mines) {
            if (m.id && m.isTriggered && !knownMineTriggerIdsRef.current.has(m.id)) {
              knownMineTriggerIdsRef.current.add(m.id);
              sfx.play('tick');
            }
          }
        }

        // Sound effects for Guest on Slugs (Placement, Jump, Teleport, Rope, Splash)
        if (delta.slugs && Array.isArray(delta.slugs)) {
          const waterLevel = engine.terrain.data.waterLevel;
          for (const dSlug of delta.slugs) {
            const slug = dSlug.idx !== undefined ? engine.state.slugs[dSlug.idx] : engine.state.slugs.find((s) => s.id === dSlug.i);
            if (slug) {
              if (dSlug.pl && !slug.isPlaced) {
                sfx.play('jump');
              }
              if (dSlug.rs && !slug.ropeState) {
                sfx.play('rope_shoot');
              }
              if (dSlug.vy !== undefined && dSlug.vy < -3 && Math.abs(slug.vy) < 0.5 && !slug.inVehicleId) {
                sfx.play('jump');
              }
              if (dSlug.x !== undefined && Math.hypot(dSlug.x - slug.x, (dSlug.y || slug.y) - slug.y) > 120) {
                sfx.play('teleport');
              }
              if (dSlug.y !== undefined && dSlug.y >= waterLevel && slug.y < waterLevel) {
                sfx.play('splash');
              }
            }
          }
        }

        // Victory sound on Game Over & Fresh Terrain Reset on Match Start
        if (delta.phase && delta.phase !== prevPhaseRef.current) {
          if (delta.phase === 'GAME_OVER') {
            sfx.play('victory');
          }
          if (delta.phase === 'PLACEMENT' && prevPhaseRef.current === 'LOBBY') {
            engine.initTerrain();
            knownGirderIdsRef.current.clear();
            knownCraterIdsRef.current.clear();
            knownProjIdsRef.current.clear();
            knownExplosionIdsRef.current.clear();
          }
          prevPhaseRef.current = delta.phase;
        }

        // Apply state delta
        applyStateDelta(engine.state, delta);

        // Stamp newly received girders into guest's terrain grid
        if (engine.state.girders && engine.state.girders.length > 0) {
          for (const g of engine.state.girders) {
            if (!knownGirderIdsRef.current.has(g.id)) {
              knownGirderIdsRef.current.add(g.id);
              const rad = (g.angleDeg * Math.PI) / 180;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);
              const halfL = g.length / 2;
              const halfT = g.thickness / 2;
              const w = engine.terrain.data.width;
              const h = engine.terrain.data.height;

              for (let dl = -halfL; dl <= halfL; dl++) {
                for (let dt = -halfT; dt <= halfT; dt++) {
                  const px = Math.round(g.x + dl * cos - dt * sin);
                  const py = Math.round(g.y + dl * sin + dt * cos);
                  if (px >= 0 && px < w && py >= 0 && py < h) {
                    engine.terrain.data.grid[py * w + px] = 1;
                  }
                }
              }
              sfx.play('girder');
            }
          }
        }

        // Stamp newly received persistent craters into guest's terrain grid
        if (engine.state.craters && engine.state.craters.length > 0) {
          for (const c of engine.state.craters) {
            if (!knownCraterIdsRef.current.has(c.id)) {
              knownCraterIdsRef.current.add(c.id);
              engine.terrain.carveExplosion(c.x, c.y, c.radius);
            }
          }
        }

        if (engine.state.explosions && engine.state.explosions.length > 0) {
          for (const ex of engine.state.explosions) {
            engine.terrain.carveExplosion(ex.x, ex.y, ex.radius);
          }
        }

        setGameState({ ...engine.state });
      } else if (payload.config) {
        const newState = payload as GameState;
        engine.state = newState;

        const isNewMatch = (newState.phase === 'PLACEMENT' && prevPhaseRef.current === 'LOBBY') ||
          prevMapKeyRef.current !== `${newState.config.mapSeed}_${newState.config.mapTheme}`;
        if (isNewMatch) {
          prevMapKeyRef.current = `${newState.config.mapSeed}_${newState.config.mapTheme}`;
          engine.initTerrain();
          knownGirderIdsRef.current.clear();
          knownCraterIdsRef.current.clear();
          knownProjIdsRef.current.clear();
          knownExplosionIdsRef.current.clear();
        }
        prevPhaseRef.current = newState.phase;

        if (newState.girders && newState.girders.length > 0) {
          for (const g of newState.girders) {
            if (!knownGirderIdsRef.current.has(g.id)) {
              knownGirderIdsRef.current.add(g.id);
              const rad = (g.angleDeg * Math.PI) / 180;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);
              const halfL = g.length / 2;
              const halfT = g.thickness / 2;
              const w = engine.terrain.data.width;
              const h = engine.terrain.data.height;

              for (let dl = -halfL; dl <= halfL; dl++) {
                for (let dt = -halfT; dt <= halfT; dt++) {
                  const px = Math.round(g.x + dl * cos - dt * sin);
                  const py = Math.round(g.y + dl * sin + dt * cos);
                  if (px >= 0 && px < w && py >= 0 && py < h) {
                    engine.terrain.data.grid[py * w + px] = 1;
                  }
                }
              }
            }
          }
        }

        if (newState.craters && newState.craters.length > 0) {
          for (const c of newState.craters) {
            if (!knownCraterIdsRef.current.has(c.id)) {
              knownCraterIdsRef.current.add(c.id);
              engine.terrain.carveExplosion(c.x, c.y, c.radius);
            }
          }
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
          // Host returns to focus: broadcast full authoritative state snapshot to all peers
          broadcastState(engineRef.current.state);
        } else {
          // Guest returns to focus: request immediate full state snapshot from host
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

import { useRef, useCallback } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { SlugWarsNetworkMessage, SlugWarsActionType, SlugWarsNetworkPayload } from '../../network/protocol';
import { netMetrics } from '../../core/networkMetrics';
import { sfx } from '../../core/audio';
import { type PeerManagerLike } from 'p2play-core';

export function applyOptimisticAction(
  state: GameState,
  actionName: SlugWarsActionType | string,
  payload: SlugWarsNetworkPayload | any,
  myPeerId: string
): boolean {
  const isMyTurn =
    myPeerId &&
    state.activeTeamId === myPeerId &&
    (state.phase === 'AIMING' || state.phase === 'TURN_TIME' || state.phase === 'RETREAT');

  const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;
  if (!activeSlug) return false;

  if (actionName === 'AIM') {
    if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
    if (payload?.aimPower !== undefined && !activeSlug.isChargingPower) {
      activeSlug.aimPower = payload.aimPower;
    }
    if (payload?.facing !== undefined) activeSlug.facing = payload.facing;
    if (payload?.targetPoint !== undefined) activeSlug.currentTargetPoint = payload.targetPoint;
    return true;
  }
  if (actionName === 'SELECT_WEAPON') {
    if (payload?.weaponId) {
      activeSlug.selectedWeaponId = payload.weaponId;
      return true;
    }
  }
  if (actionName === 'SET_FUSE_TIMER') {
    if (payload?.seconds !== undefined) {
      activeSlug.fuseTimerSec = payload.seconds;
      return true;
    }
  }
  if (actionName === 'START_CHARGE') {
    activeSlug.isChargingPower = true;
    activeSlug.aimPower = 5;
    if (payload?.targetPoint) activeSlug.currentTargetPoint = payload.targetPoint;
    return true;
  }
  if (actionName === 'FIRE') {
    activeSlug.isChargingPower = false;
    if (activeSlug.selectedWeaponId === 'blowtorch') {
      activeSlug.isBlowtorching = true;
    }
    return true;
  }
  if (actionName === 'RELEASE_CHARGE') {
    activeSlug.isChargingPower = false;
    if (activeSlug.isBlowtorching) {
      activeSlug.isBlowtorching = false;
    }
    return true;
  }
  if (actionName === 'START_MOVE') {
    if (payload?.dir) {
      activeSlug.movingDir = payload.dir;
      activeSlug.facing = payload.dir;
      return true;
    }
  }
  if (actionName === 'STOP_MOVE') {
    activeSlug.movingDir = null;
    return true;
  }
  return false;
}

interface UseActionDispatcherOptions {
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  myPeerId?: string | null;
  peerManager: PeerManagerLike;
  handleHostAction: (senderId: string, msg: SlugWarsNetworkMessage) => void;
  syncState: () => void;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export function useActionDispatcher({
  engineRef,
  isHost,
  myPeerId,
  peerManager,
  handleHostAction,
  syncState,
  setGameState,
}: UseActionDispatcherOptions) {
  const lastAimSendTimeRef = useRef<number>(0);
  const pendingAimPayloadRef = useRef<any>(null);
  const aimThrottleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendAction = useCallback(
    (actionName: string, payload?: any) => {
      const msg: SlugWarsNetworkMessage = { type: 'ACTION', actionName: actionName as any, payload };
      if (isHost) {
        const senderId = myPeerId || engineRef.current.state.activeTeamId || 'host';
        handleHostAction(senderId, msg);
        syncState();
      } else {
        // Optimistic local state update for instantaneous 0ms client responsiveness
        const state = engineRef.current.state;
        const updated = applyOptimisticAction(state, actionName, payload, myPeerId || '');
        if (updated) {
          setGameState({ ...state });
        }
        if (actionName === 'JUMP') {
          sfx.play('jump');
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
    [isHost, myPeerId, peerManager, handleHostAction, syncState, setGameState, engineRef]
  );

  return { sendAction };
}

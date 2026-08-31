import { useRef, useCallback, MutableRefObject, Dispatch, SetStateAction } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { SlugWarsNetworkMessage, SlugWarsActionType } from '../../network/protocol';
import { netMetrics } from '../../core/networkMetrics';
import { sfx } from '../../core/audio';
import { type PeerManagerLike } from 'p2play-core';
import { getIsLocalPlayerTurn, isPlayablePhase } from '../../core/turnAuthority';
import { NETWORK_ACTION_REGISTRY, canExecuteInPhase } from '../../network/actions';

export function applyOptimisticAction(
  state: GameState,
  actionName: SlugWarsActionType | string,
  payload: any,
  myPeerId: string
): boolean {
  const isMyTurn = getIsLocalPlayerTurn(state, myPeerId, false);
  const actionDef = NETWORK_ACTION_REGISTRY[actionName as SlugWarsActionType];
  if (!isMyTurn || !actionDef || !isPlayablePhase(state.phase)) return false;
  if (!canExecuteInPhase(actionDef.allowedPhases, state.phase)) return false;

  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug) return false;

  if (actionDef.applyOptimistic) {
    actionDef.applyOptimistic(state, activeSlug, payload);
    return true;
  }

  return false;
}

interface UseActionDispatcherOptions {
  engineRef: MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  myPeerId?: string | null;
  peerManager: PeerManagerLike;
  handleHostAction: (senderId: string, msg: SlugWarsNetworkMessage) => void;
  syncState: () => void;
  setGameState: Dispatch<SetStateAction<GameState>>;
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
        const state = engineRef.current.state;
        const updated = applyOptimisticAction(state, actionName, payload, myPeerId || '');
        if (updated) {
          setGameState({ ...state });
        }
        if (actionName === 'JUMP') {
          sfx.play('jump');
        }

        // Throttle high-frequency AIM network packets over WebRTC (approx 30Hz / 33ms)
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

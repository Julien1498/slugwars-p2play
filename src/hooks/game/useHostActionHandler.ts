import { useCallback, useEffect, MutableRefObject } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { SlugWarsNetworkMessage } from '../../network/protocol';
import { netMetrics } from '../../core/networkMetrics';
import { GameState } from '../../core/types';
import { PeerManagerLike } from 'p2play-core';
import {
  NETWORK_ACTION_REGISTRY,
  checkActionPermission,
  canExecuteInPhase,
  HostActionContext,
} from '../../network/actions';

export { isSenderAuthorizedForTurn } from '../../core/turnAuthority';

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
  if (!isHost || !msg || msg.type !== 'ACTION' || !msg.actionName) return;

  const actionDef = NETWORK_ACTION_REGISTRY[msg.actionName];
  if (!actionDef) {
    console.warn(`[P2P] Unrecognized action received: ${msg.actionName}`);
    return;
  }

  const ctx: HostActionContext = {
    engine,
    playerId: senderPeerId,
    hostId: myPeerId || peerManager.myPeerId || '',
    peerManager,
    syncState,
    broadcastState,
  };

  if (!checkActionPermission(actionDef.permission, ctx)) {
    return;
  }

  if (!canExecuteInPhase(actionDef.allowedPhases, engine.state.phase)) {
    return;
  }

  actionDef.executeHost(ctx, msg.payload || {});
  syncState();
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

  useEffect(() => {
    if (isHost && peerManager) {
      peerManager.hostActionHandler = handleHostAction;
    }
  }, [isHost, peerManager, handleHostAction]);

  return { handleHostAction };
}

import { useCallback, MutableRefObject } from 'react';
import { GameState } from '../../core/types';
import { sanitizeGameState } from '../../network/protocol';
import { buildStateDelta, isDeltaEmpty } from '../../network/netSerializer';
import { encodeBinaryDelta } from '../../network/netBinarySerializer';
import { netMetrics } from '../../core/networkMetrics';
import { PeerManagerLike } from 'p2play-core';

export function useGameBroadcast(
  peerManager: PeerManagerLike,
  myPeerId: string,
  lastSentStateRef: MutableRefObject<GameState | null>
) {
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
    [peerManager, myPeerId, lastSentStateRef]
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
    [peerManager, myPeerId, lastSentStateRef]
  );

  return { broadcastState, broadcastDeltaState };
}

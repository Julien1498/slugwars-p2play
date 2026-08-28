import { useEffect } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { type PeerManagerLike } from 'p2play-core';

interface UseVisibilityRecoveryOptions {
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  broadcastState: (state: GameState) => void;
  peerManager: PeerManagerLike;
}

export function useVisibilityRecovery({
  engineRef,
  isHost,
  broadcastState,
  peerManager,
}: UseVisibilityRecoveryOptions) {
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
  }, [isHost, broadcastState, peerManager, engineRef]);
}

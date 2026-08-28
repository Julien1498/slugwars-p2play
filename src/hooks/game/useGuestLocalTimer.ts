import { useEffect } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { createWorkerInterval } from '../../core/workerTimer';
import { interpolateGuestLocalState } from './gameActionUtils';

interface UseGuestLocalTimerOptions {
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  phase: string;
  myPeerId: string;
  updateReactState: (state: GameState, force?: boolean) => void;
}

export function useGuestLocalTimer({
  engineRef,
  isHost,
  phase,
  myPeerId,
  updateReactState,
}: UseGuestLocalTimerOptions) {
  useEffect(() => {
    if (isHost || phase === 'LOBBY' || phase === 'GAME_OVER') return;

    const stopWorker = createWorkerInterval(() => {
      const state = engineRef.current.state;
      const terrain = engineRef.current.terrain;
      const isSolid = (x: number, y: number) => terrain.isSolid(x, y);
      const waterLevel = terrain.data.waterLevel;

      const changed = interpolateGuestLocalState(state, isSolid, waterLevel, myPeerId);
      if (changed) {
        updateReactState(state, true);
      }
    }, 50);

    return () => stopWorker();
  }, [isHost, phase, myPeerId, updateReactState, engineRef]);
}

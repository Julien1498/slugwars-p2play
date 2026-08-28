import { useEffect } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { createWorkerInterval } from '../../core/workerTimer';
import { perfTracker } from '../../core/perfTracker';

interface UseHostPhysicsLoopOptions {
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  phase: string;
  broadcastDeltaState: (state: GameState) => void;
  updateReactState: (state: GameState) => void;
}

export function useHostPhysicsLoop({
  engineRef,
  isHost,
  phase,
  broadcastDeltaState,
  updateReactState,
}: UseHostPhysicsLoopOptions) {
  useEffect(() => {
    if (!isHost || phase === 'LOBBY' || phase === 'GAME_OVER') return;

    const stopWorker = createWorkerInterval(() => {
      const t0 = performance.now();
      engineRef.current.tick();
      const dt = performance.now() - t0;
      perfTracker.recordPhysicsTick(dt);

      broadcastDeltaState(engineRef.current.state);
      updateReactState(engineRef.current.state);
    }, 50);

    return () => stopWorker();
  }, [isHost, phase, broadcastDeltaState, updateReactState, engineRef]);
}

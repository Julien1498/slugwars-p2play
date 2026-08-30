import { useEffect } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState } from '../../core/types';
import { createWorkerInterval } from '../../core/workerTimer';
import { stepSupplyCrateDescent } from '../../core/engine/supplyDropManager';

export function interpolateGuestLocalState(
  state: GameState,
  isSolid: (x: number, y: number) => boolean,
  waterLevel: number,
  myPeerId: string
): boolean {
  let changed = false;

  if (state.phase === 'AIMING' || state.phase === 'PLACEMENT' || state.phase === 'TURN_START') {
    if (!state.isTimerFrozen && state.turnTimer > 0) {
      state.turnTimer = Math.max(0, state.turnTimer - 0.05);
      changed = true;
    }
  } else if (state.phase === 'RETREAT' && state.retreatTimer !== undefined) {
    if (state.retreatTimer > 0) {
      state.retreatTimer = Math.max(0, state.retreatTimer - 0.05);
      changed = true;
    }
  }

  if (state.mines && state.mines.length > 0) {
    for (const m of state.mines) {
      if (m.isTriggered && m.fuseTimerMs !== undefined && m.fuseTimerMs > 0) {
        m.fuseTimerMs = Math.max(0, m.fuseTimerMs - 50);
        changed = true;
      }
    }
  }

  const isMyTurn = myPeerId && state.activeTeamId === myPeerId && state.phase === 'AIMING';
  const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;
  if (activeSlug && activeSlug.isChargingPower) {
    activeSlug.aimPower = Math.min(100, (activeSlug.aimPower || 0) + 2.5);
    changed = true;
  }

  if (state.supplyCrates && state.supplyCrates.length > 0) {
    for (const crate of state.supplyCrates) {
      if (!crate.isLanded) {
        stepSupplyCrateDescent(crate, state.wind, isSolid, waterLevel);
        changed = true;
      }
    }
  }

  return changed;
}

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

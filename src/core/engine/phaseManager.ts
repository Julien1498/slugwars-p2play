import { GameState, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import * as transitions from './phase/phaseTransitions';
import { advanceToNextTurn as advanceTurnFn } from './phase/turnProgression';
import { updatePhaseTick as updateTickFn } from './phase/phaseTickUpdater';

export class PhaseManager {
  public static startLobby(state: GameState): void {
    transitions.startLobby(state);
  }

  public static startPlacement(state: GameState): void {
    transitions.startPlacement(state);
  }

  public static startTurnStart(state: GameState, durationSec = 0.8): void {
    transitions.startTurnStart(state, durationSec);
  }

  public static startAiming(state: GameState, durationSec?: number): void {
    transitions.startAiming(state, durationSec);
  }

  public static startRetreat(
    state: GameState,
    durationSec = 4.0,
    addLog?: (msg: string, type?: JournalEntry['type']) => void
  ): void {
    transitions.startRetreat(state, durationSec, addLog);
  }

  public static startProjectileActive(state: GameState): void {
    transitions.startProjectileActive(state);
  }

  public static startResolving(
    state: GameState,
    options: {
      settleTimer?: number;
      phaseTimeout?: number;
      reason?: string;
      addLog?: (msg: string, type?: JournalEntry['type']) => void;
    } = {}
  ): void {
    transitions.startResolving(state, options);
  }

  public static startGameOver(
    state: GameState,
    winnerTeamId?: string,
    addLog?: (msg: string, type?: JournalEntry['type']) => void
  ): void {
    transitions.startGameOver(state, winnerTeamId, addLog);
  }

  public static advanceToNextTurn(
    state: GameState,
    terrain: DestructibleTerrain,
    callbacks: {
      addLog: (msg: string, type?: JournalEntry['type']) => void;
      randomizeWind: (state: GameState) => void;
      getNextSlugForTeam: (teamId: string) => string;
      checkWinner: () => void;
    }
  ): void {
    advanceTurnFn(state, terrain, callbacks);
  }

  public static updatePhaseTick(
    state: GameState,
    terrain: DestructibleTerrain,
    dt: number,
    callbacks: {
      addLog: (msg: string, type?: JournalEntry['type']) => void;
      advanceToNextTurn: () => void;
    }
  ): void {
    updateTickFn(state, terrain, dt, callbacks);
  }
}

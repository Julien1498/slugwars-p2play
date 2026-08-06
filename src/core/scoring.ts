import { GameState } from './types';

export interface MatchStats {
  winnerTeamName?: string;
  totalTurns: number;
  totalDamageDealt: number;
  slugsKilled: number;
}

export function computeMatchStats(state: GameState): MatchStats {
  const winner = state.teams.find((t) => t.id === state.winnerTeamId);
  const totalKilled = state.slugs.filter((s) => !s.isAlive).length;

  return {
    winnerTeamName: winner?.name,
    totalTurns: state.turnCount,
    totalDamageDealt: 0,
    slugsKilled: totalKilled,
  };
}

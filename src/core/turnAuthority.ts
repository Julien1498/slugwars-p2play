import { GamePhase, GameState } from './types';

/**
 * Pure Domain Turn Authority:
 * Determines if it is the local player's turn to take gameplay actions.
 */
export function getIsLocalPlayerTurn(
  state: GameState,
  myPeerId: string | null | undefined,
  isHost: boolean
): boolean {
  if (state.teams.length <= 1) return true;

  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
  if (!activeTeam) return false;

  if (activeTeam.isHost) {
    return isHost === true;
  }

  return myPeerId ? myPeerId === activeTeam.id : !isHost;
}

/**
 * Validates whether a remote network sender is authorized to execute turn-bound actions.
 */
export function isSenderAuthorizedForTurn(
  state: GameState,
  senderPeerId: string,
  hostPeerId: string
): boolean {
  if (state.teams.length <= 1) return true;
  if (senderPeerId === hostPeerId && hostPeerId === state.activeTeamId) return true;
  if (senderPeerId === state.activeTeamId) return true;

  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId);
  if (!activeTeam) return false;
  if (activeTeam.id === senderPeerId) return true;

  if (!activeTeam.isHost && state.teams.some((t) => t.id === senderPeerId && !t.isHost)) {
    return true;
  }

  return false;
}

/**
 * Checks if the current game phase allows active player interactions (movement, aiming, placing).
 */
export function isPlayablePhase(phase: GamePhase | string): boolean {
  return phase === 'AIMING' || phase === 'TURN_TIME' || phase === 'RETREAT' || phase === 'PLACEMENT';
}

import { GamePhase } from '../../core/types';
import { isSenderAuthorizedForTurn } from '../../core/turnAuthority';
import { ActionPermission, HostActionContext } from './actionRegistryTypes';

/**
 * Validates if the sender has permission to trigger the requested action.
 */
export function checkActionPermission(
  permission: ActionPermission,
  ctx: HostActionContext
): boolean {
  const { engine, playerId, hostId } = ctx;

  switch (permission) {
    case 'ANY':
      return true;

    case 'HOST_ONLY':
      return playerId === hostId;

    case 'ACTIVE_TURN_ONLY':
      return isSenderAuthorizedForTurn(engine.state, playerId, hostId);

    case 'DEV_OR_HOST':
      return playerId === hostId || engine.state.teams.length <= 1;

    default:
      return false;
  }
}

/**
 * Validates if the action is allowed during the current match lifecycle phase.
 */
export function canExecuteInPhase(
  allowedPhases: GamePhase[] | undefined,
  currentPhase: GamePhase | string
): boolean {
  if (!allowedPhases || allowedPhases.length === 0) return true;
  return allowedPhases.includes(currentPhase as GamePhase);
}

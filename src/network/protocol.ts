import { GameState, Vector2D } from '../core/types';

export type SlugWarsActionType =
  | 'JOIN_GAME'
  | 'CHANGE_CONFIG'
  | 'START_GAME'
  | 'AIM'
  | 'SELECT_WEAPON'
  | 'FIRE'
  | 'NEXT_TURN'
  | 'RESTART_GAME';

export interface SlugWarsNetworkPayload {
  name?: string;
  avatar?: string;
  color?: string;
  config?: any;
  aimAngle?: number;
  aimPower?: number;
  facing?: 'left' | 'right';
  weaponId?: string;
  targetPoint?: Vector2D;
}

export interface SlugWarsNetworkMessage {
  type: 'ACTION' | 'STATE_UPDATE';
  actionName?: SlugWarsActionType;
  payload?: SlugWarsNetworkPayload;
  state?: GameState;
}

export function sanitizeGameState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state));
}

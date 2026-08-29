import { GameState, Vector2D } from '../core/types';

export type SlugWarsActionType =
  | 'JOIN_GAME'
  | 'CHANGE_CONFIG'
  | 'START_GAME'
  | 'START_MOVE'
  | 'STOP_MOVE'
  | 'JUMP'
  | 'AIM'
  | 'START_STEER'
  | 'STOP_STEER'
  | 'START_CHARGE'
  | 'RELEASE_CHARGE'
  | 'DETONATE'
  | 'SELECT_WEAPON'
  | 'FIRE'
  | 'PLACE_SLUG'
  | 'NEXT_TURN'
  | 'ENTER_VEHICLE'
  | 'EXIT_VEHICLE'
  | 'STEER_VEHICLE'
  | 'REQUEST_FULL_STATE'
  | 'SET_FUSE_TIMER'
  | 'RESTART_GAME';

export interface SlugWarsNetworkPayload {
  name?: string;
  avatar?: string;
  color?: string;
  config?: any;
  dir?: 'left' | 'right';
  steerDir?: 'left' | 'right' | 'up' | 'down';
  aimAngle?: number;
  aimPower?: number;
  facing?: 'left' | 'right';
  weaponId?: string;
  seconds?: number;
  targetPoint?: Vector2D;
  point?: Vector2D;
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

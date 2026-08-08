import { GameState, Vector2D, JournalEntry } from '../core/types';
import { CompactStateDelta } from './netSerializer';

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
  | 'RESTART_GAME';

export interface SlugWarsNetworkPayload {
  name?: string;
  avatar?: string;
  color?: string;
  config?: any;
  dir?: 'left' | 'right';
  aimAngle?: number;
  aimPower?: number;
  facing?: 'left' | 'right';
  weaponId?: string;
  targetPoint?: Vector2D;
  point?: Vector2D;
}

export interface SlugWarsNetworkMessage {
  type: 'ACTION' | 'STATE_UPDATE' | 'DELTA_STATE_UPDATE' | 'FULL_STATE_UPDATE' | 'JOURNAL_LOG';
  actionName?: SlugWarsActionType;
  payload?: SlugWarsNetworkPayload;
  state?: GameState;
  delta?: CompactStateDelta;
  journalEntry?: JournalEntry;
}

export function sanitizeGameState(state: GameState): GameState {
  const cleanState = JSON.parse(JSON.stringify(state));
  // Remove temporary visual particles & floating damages from network payload
  delete cleanState.particles;
  delete cleanState.floatingDamages;
  return cleanState;
}

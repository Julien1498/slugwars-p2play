import { Vector2D, GameConfig } from '../../core/types';
import { SlugWarsActionType, SlugWarsNetworkMessage } from '../../network/protocol';

export type GameAction =
  | { type: 'JOIN_GAME'; payload?: { name?: string; avatar?: string; color?: string } }
  | { type: 'CHANGE_CONFIG'; payload?: { config?: Partial<GameConfig> } }
  | { type: 'START_GAME' }
  | { type: 'START_MOVE'; payload: { dir: 'left' | 'right' } }
  | { type: 'STOP_MOVE' }
  | { type: 'JUMP' }
  | { type: 'AIM'; payload: { aimAngle: number; aimPower: number; facing: 'left' | 'right'; targetPoint?: Vector2D } }
  | { type: 'START_STEER'; payload: { dir: 'left' | 'right' } }
  | { type: 'STOP_STEER' }
  | { type: 'START_CHARGE'; payload?: { targetPoint?: Vector2D } }
  | { type: 'RELEASE_CHARGE'; payload?: { x?: number; y?: number; aimAngle?: number; aimPower?: number; facing?: 'left' | 'right'; targetPoint?: Vector2D } }
  | { type: 'DETONATE' }
  | { type: 'SELECT_WEAPON'; payload: { weaponId: string } }
  | { type: 'FIRE'; payload?: { x?: number; y?: number; aimAngle?: number; aimPower?: number; facing?: 'left' | 'right'; targetPoint?: Vector2D } }
  | { type: 'PLACE_SLUG'; payload: { point: Vector2D } }
  | { type: 'NEXT_TURN' }
  | { type: 'ENTER_VEHICLE' }
  | { type: 'EXIT_VEHICLE' }
  | { type: 'STEER_VEHICLE'; payload: { steerDir: 'left' | 'right' | 'up' | 'down' } }
  | { type: 'SET_FUSE_TIMER'; payload: { seconds: number } }
  | { type: 'RESTART_GAME' }
  | { type: 'REQUEST_FULL_STATE' };

export interface PeerManagerBroadcaster {
  broadcast: (msg: SlugWarsNetworkMessage) => void;
  sendToHost?: (type: string, data: any) => void;
}

export function dispatchGameAction(
  peerManager: PeerManagerBroadcaster,
  action: GameAction
): void {
  const actionName: SlugWarsActionType =
    action.type === 'START_MOVE' ? 'MOVE' as any : (action.type as SlugWarsActionType);

  const payload = 'payload' in action ? action.payload : undefined;

  const msg: SlugWarsNetworkMessage = {
    type: 'ACTION',
    actionName,
    payload,
  };

  peerManager.broadcast(msg);
}

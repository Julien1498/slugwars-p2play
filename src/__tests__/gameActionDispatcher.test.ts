import { describe, it, expect, vi } from 'vitest';
import { GameAction, dispatchGameAction } from '../hooks/game/gameActionDispatcher';
import { SlugWarsNetworkMessage } from '../network/protocol';

describe('GameAction Discriminated Union & Unified Dispatcher', () => {
  const createMockBroadcaster = () => {
    return {
      broadcast: vi.fn(),
    };
  };

  it('dispatches AIM action with angle, power, facing, and optional target', () => {
    const peerManager = createMockBroadcaster();
    const action: GameAction = {
      type: 'AIM',
      payload: {
        aimAngle: 45,
        aimPower: 80,
        facing: 'right',
        targetPoint: { x: 500, y: 300 },
      },
    };

    dispatchGameAction(peerManager, action);

    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'AIM',
      payload: action.payload,
    } as SlugWarsNetworkMessage);
  });

  it('dispatches FIRE action with optional targetPoint', () => {
    const peerManager = createMockBroadcaster();
    const action: GameAction = {
      type: 'FIRE',
      payload: {
        x: 100,
        y: 200,
        aimAngle: 30,
        aimPower: 50,
        facing: 'right',
      },
    };

    dispatchGameAction(peerManager, action);

    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'FIRE',
      payload: action.payload,
    });
  });

  it('dispatches movement actions (START_MOVE, STOP_MOVE, JUMP)', () => {
    const peerManager = createMockBroadcaster();

    dispatchGameAction(peerManager, { type: 'START_MOVE', payload: { dir: 'left' } });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'MOVE',
      payload: { dir: 'left' },
    });

    dispatchGameAction(peerManager, { type: 'STOP_MOVE' });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'STOP_MOVE',
      payload: undefined,
    });

    dispatchGameAction(peerManager, { type: 'JUMP' });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'JUMP',
      payload: undefined,
    });
  });

  it('dispatches weapon selection and fuse timer configuration', () => {
    const peerManager = createMockBroadcaster();

    dispatchGameAction(peerManager, { type: 'SELECT_WEAPON', payload: { weaponId: 'holy_grenade' } });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'SELECT_WEAPON',
      payload: { weaponId: 'holy_grenade' },
    });

    dispatchGameAction(peerManager, { type: 'SET_FUSE_TIMER', payload: { seconds: 3 } });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'SET_FUSE_TIMER',
      payload: { seconds: 3 },
    });
  });

  it('dispatches vehicle interactions (ENTER_VEHICLE, EXIT_VEHICLE, STEER_VEHICLE)', () => {
    const peerManager = createMockBroadcaster();

    dispatchGameAction(peerManager, { type: 'ENTER_VEHICLE' });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'ENTER_VEHICLE',
      payload: undefined,
    });

    dispatchGameAction(peerManager, { type: 'STEER_VEHICLE', payload: { steerDir: 'up' } });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'STEER_VEHICLE',
      payload: { steerDir: 'up' },
    });

    dispatchGameAction(peerManager, { type: 'EXIT_VEHICLE' });
    expect(peerManager.broadcast).toHaveBeenCalledWith({
      type: 'ACTION',
      actionName: 'EXIT_VEHICLE',
      payload: undefined,
    });
  });
});

import { describe, it, expect } from 'vitest';
import { GameAction, dispatchGameAction } from '../hooks/game/gameActionDispatcher';
import { isFullscreenSupported, toggleFullscreen } from '../hooks/useFullscreen';
import { SlugWarsNetworkMessage } from '../network/protocol';

describe('Audit 3: Type Safety, Strict Types & Safe Error Handling', () => {
  it('safely handles error types and non-Error objects without throwing', async () => {
    // Testing isFullscreenSupported in Node environment without crashing
    expect(typeof isFullscreenSupported()).toBe('boolean');

    // Testing toggleFullscreen in non-DOM environment
    await expect(toggleFullscreen()).resolves.toBeUndefined();
  });

  it('validates strictly-typed Discriminated Union GameAction instances', () => {
    const actions: GameAction[] = [
      { type: 'START_GAME' },
      { type: 'STOP_MOVE' },
      { type: 'JUMP' },
      { type: 'NEXT_TURN' },
      { type: 'DETONATE' },
      { type: 'ENTER_VEHICLE' },
      { type: 'EXIT_VEHICLE' },
      { type: 'RESTART_GAME' },
      { type: 'REQUEST_FULL_STATE' },
      { type: 'START_MOVE', payload: { dir: 'right' } },
      { type: 'START_STEER', payload: { dir: 'left' } },
      { type: 'SELECT_WEAPON', payload: { weaponId: 'bazooka' } },
      { type: 'SET_FUSE_TIMER', payload: { seconds: 4 } },
      { type: 'STEER_VEHICLE', payload: { steerDir: 'down' } },
      { type: 'PLACE_SLUG', payload: { point: { x: 100, y: 200 } } },
      {
        type: 'AIM',
        payload: {
          aimAngle: 45,
          aimPower: 90,
          facing: 'left',
          targetPoint: { x: 300, y: 400 },
        },
      },
    ];

    expect(actions).toHaveLength(16);

    const sentMessages: SlugWarsNetworkMessage[] = [];
    const mockPeerManager = {
      broadcast: (msg: SlugWarsNetworkMessage) => {
        sentMessages.push(msg);
      },
    };

    for (const act of actions) {
      dispatchGameAction(mockPeerManager, act);
    }

    expect(sentMessages).toHaveLength(16);
    expect(sentMessages[0].type).toBe('ACTION');
    expect(sentMessages[0].actionName).toBe('START_GAME');
    expect(sentMessages[15].actionName).toBe('AIM');
  });
});

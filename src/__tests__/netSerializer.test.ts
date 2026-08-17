import { describe, it, expect } from 'vitest';
import { buildStateDelta, applyStateDelta, isDeltaEmpty } from '../network/netSerializer';
import { encodeBinaryDelta, decodeBinaryDelta } from '../network/netBinarySerializer';
import { GameState } from '../core/types';

function createMockGameState(): GameState {
  return {
    phase: 'AIMING',
    winnerTeamId: undefined,
    activeTeamId: 'team_1',
    activeSlugId: 'slug_1',
    turnTimer: 45,
    retreatTimer: undefined,
    wind: 2.5,
    waterLevel: 0,
    turnCount: 1,
    particles: [],
    floatingDamages: [],
    journal: [],
    config: {
      turnDuration: 45,
      slugsPerTeam: 2,
      slugHp: 100,
      weaponSetId: 'classic',
      windEnabled: true,
      vehiclesEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: 12345,
    },
    teams: [
      {
        id: 'team_1',
        name: 'Rouges',
        color: '#ef4444',
        avatar: '🐌',
        isHost: true,
        inventory: { bazooka: -1, grenade: 5, dynamite: 2 },
      },
    ],
    slugs: [
      {
        id: 'slug_1',
        name: 'Limace Alpha',
        teamId: 'team_1',
        x: 150,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        facing: 'right',
        aimAngle: 30,
        aimPower: 60,
        selectedWeaponId: 'grenade',
        fuseTimerSec: 3,
      },
    ],
    helicopters: [],
    mines: [],
    projectiles: [],
    explosions: [],
    supplyCrates: [],
    girders: [],
    craters: [],
  };
}

describe('Network Serialization & Binary Delta', () => {
  it('returns empty delta when state is unchanged', () => {
    const stateA = createMockGameState();
    const stateB = createMockGameState();

    const delta = buildStateDelta(stateA, stateB);
    expect(isDeltaEmpty(delta)).toBe(true);
  });

  it('correctly diffs and synchronizes slug position and custom fuse timer', () => {
    const prevState = createMockGameState();
    const nextState = createMockGameState();

    // Modify state on host
    nextState.slugs[0].x = 185.5;
    nextState.slugs[0].fuseTimerSec = 5;
    nextState.slugs[0].hp = 75;

    const delta = buildStateDelta(prevState, nextState);
    expect(isDeltaEmpty(delta)).toBe(false);
    expect(delta.slugs).toBeDefined();
    expect(delta.slugs?.[0].x).toBe(185.5);
    expect(delta.slugs?.[0].ft).toBe(5);
    expect(delta.slugs?.[0].hp).toBe(75);

    // Apply delta to guest local state
    const guestState = createMockGameState();
    applyStateDelta(guestState, delta);

    expect(guestState.slugs[0].x).toBe(185.5);
    expect(guestState.slugs[0].fuseTimerSec).toBe(5);
    expect(guestState.slugs[0].hp).toBe(75);
  });

  it('losslessly encodes and decodes delta packets via binary Tag-Value serializer', () => {
    const prevState = createMockGameState();
    const nextState = createMockGameState();

    nextState.turnTimer = 32;
    nextState.wind = -4.2;
    nextState.slugs[0].aimAngle = 65;
    nextState.slugs[0].fuseTimerSec = 2;
    nextState.slugs[0].selectedWeaponId = 'dynamite';

    const delta = buildStateDelta(prevState, nextState);

    // Encode to Uint8Array binary buffer
    const binaryBuffer = encodeBinaryDelta(delta);
    expect(binaryBuffer).toBeInstanceOf(Uint8Array);
    expect(binaryBuffer.byteLength).toBeGreaterThan(0);

    // Decode back from binary buffer
    const decodedDelta = decodeBinaryDelta(binaryBuffer);

    // Apply decoded delta to guest state
    const guestState = createMockGameState();
    applyStateDelta(guestState, decodedDelta);

    expect(guestState.turnTimer).toBe(32);
    expect(guestState.wind).toBe(-4.2);
    expect(guestState.slugs[0].aimAngle).toBe(65);
    expect(guestState.slugs[0].fuseTimerSec).toBe(2);
    expect(guestState.slugs[0].selectedWeaponId).toBe('dynamite');
  });
});

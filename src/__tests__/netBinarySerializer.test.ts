import { describe, it, expect } from 'vitest';
import { encodeBinaryDelta, decodeBinaryDelta } from '../network/netBinarySerializer';
import { CompactStateDelta } from '../network/netSerializer';

describe('netBinarySerializer - Binary Network State Compression', () => {
  it('encodes and decodes an empty delta object', () => {
    const delta: CompactStateDelta = {};
    const encoded = encodeBinaryDelta(delta);
    expect(encoded).toBeInstanceOf(Uint8Array);
    expect(encoded.length).toBeGreaterThan(0);

    const decoded = decodeBinaryDelta(encoded);
    expect(decoded).toEqual({});
  });

  it('encodes and decodes primitive fields and dictionary keys', () => {
    const delta: CompactStateDelta = {
      phase: 'TURN_START',
      activeTeamId: 'team_red',
      activeSlugId: 'slug_1',
      turnTimer: 45,
      retreatTimer: 0,
      wind: 12.5,
      winnerTeamId: null,
    };

    const encoded = encodeBinaryDelta(delta);
    const decoded = decodeBinaryDelta(encoded);

    expect(decoded.phase).toBe('TURN_START');
    expect(decoded.activeTeamId).toBe('team_red');
    expect(decoded.activeSlugId).toBe('slug_1');
    expect(decoded.turnTimer).toBe(45);
    expect(decoded.retreatTimer).toBe(0);
    expect(decoded.wind).toBeCloseTo(12.5, 2);
    expect(decoded.winnerTeamId).toBeNull();
  });

  it('encodes and decodes slug array with indexed coordinates and attributes', () => {
    const delta: CompactStateDelta = {
      slugs: [
        {
          idx: 0,
          x: 450.25,
          y: 120.75,
          vx: -1.2,
          vy: 0.5,
          hp: 85,
          f: 'left',
          a: 45,
          w: 'bazooka',
          al: true,
          pl: true,
        },
        {
          idx: 1,
          x: 820.0,
          y: 340.0,
          vx: 0,
          vy: 0,
          hp: 0,
          al: false,
          pl: true,
        },
      ],
    };

    const encoded = encodeBinaryDelta(delta);
    const decoded = decodeBinaryDelta(encoded);

    expect(decoded.slugs).toHaveLength(2);
    expect(decoded.slugs![0].idx).toBe(0);
    expect(decoded.slugs![0].x).toBeCloseTo(450.25, 2);
    expect(decoded.slugs![0].y).toBeCloseTo(120.75, 2);
    expect(decoded.slugs![0].vx).toBeCloseTo(-1.2, 2);
    expect(decoded.slugs![0].vy).toBeCloseTo(0.5, 2);
    expect(decoded.slugs![0].hp).toBe(85);
    expect(decoded.slugs![0].f).toBe('left');
    expect(decoded.slugs![0].a).toBe(45);
    expect(decoded.slugs![0].w).toBe('bazooka');
    expect(decoded.slugs![0].al).toBe(true);

    expect(decoded.slugs![1].idx).toBe(1);
    expect(decoded.slugs![1].hp).toBe(0);
    expect(decoded.slugs![1].al).toBe(false);
  });

  it('encodes and decodes projectiles, explosions, craters, and girders', () => {
    const delta: CompactStateDelta = {
      projectiles: [
        {
          id: 'proj_1',
          weaponId: 'grenade',
          x: 100.5,
          y: 200.5,
          vx: 12.0,
          vy: -8.0,
          radius: 6,
          fuseTimerMs: 2500,
        },
      ],
      explosions: [
        {
          id: 'ex_1',
          x: 300,
          y: 400,
          radius: 35,
          damage: 50,
          createdAt: 1000,
        },
      ],
      craters: [
        {
          id: 'c_1',
          x: 300,
          y: 400,
          radius: 35,
        },
      ],
      girders: [
        {
          id: 'girder_1',
          x: 500,
          y: 350,
          angleDeg: 45,
          length: 80,
          thickness: 10,
        },
      ],
      supplyCrates: [
        {
          id: 'crate_1',
          x: 250,
          y: 100,
          isLanded: false,
          crateType: 'ammo',
        },
      ],
    };

    const encoded = encodeBinaryDelta(delta);
    const decoded = decodeBinaryDelta(encoded);

    expect(decoded.projectiles).toHaveLength(1);
    expect(decoded.projectiles![0].weaponId).toBe('grenade');
    expect(decoded.projectiles![0].fuseTimerMs).toBe(2500);

    expect(decoded.explosions).toHaveLength(1);
    expect(decoded.explosions![0].x).toBe(300);
    expect(decoded.explosions![0].radius).toBe(35);

    expect(decoded.craters).toHaveLength(1);
    expect(decoded.craters![0].x).toBe(300);

    expect(decoded.girders).toHaveLength(1);
    expect(decoded.girders![0].id).toBe('girder_1');

    expect(decoded.supplyCrates).toHaveLength(1);
    expect(decoded.supplyCrates![0].isLanded).toBe(false);
  });

  it('handles unknown keys outside standard dictionary with fallback string keys', () => {
    const deltaWithCustomKeys: any = {
      customSecretKeyXYZ: 'super_secret_payload',
      nestedCustomObj: {
        anotherCustom123: 99999,
        flag: true,
      },
    };

    const encoded = encodeBinaryDelta(deltaWithCustomKeys);
    const decoded: any = decodeBinaryDelta(encoded);

    expect(decoded.customSecretKeyXYZ).toBe('super_secret_payload');
    expect(decoded.nestedCustomObj).toBeDefined();
    expect(decoded.nestedCustomObj.anotherCustom123).toBe(99999);
    expect(decoded.nestedCustomObj.flag).toBe(true);
  });

  it('handles dynamic buffer resizing when payload exceeds initial 8KB capacity', () => {
    // Generate large list of craters
    const largeCraters: any[] = [];
    for (let i = 0; i < 500; i++) {
      largeCraters.push({
        id: `crater_${i}`,
        x: i * 2,
        y: i * 3,
        radius: 20 + (i % 30),
      });
    }

    const largeDelta: CompactStateDelta = {
      craters: largeCraters,
    };

    const encoded = encodeBinaryDelta(largeDelta);
    expect(encoded.byteLength).toBeGreaterThan(8192);

    const decoded = decodeBinaryDelta(encoded);
    expect(decoded.craters).toHaveLength(500);
    expect(decoded.craters![499].x).toBe(998);
  });

  it('correctly decodes from ArrayBuffer directly (not just Uint8Array)', () => {
    const delta: CompactStateDelta = {
      turnTimer: 25,
      activeTeamId: 'team_blue',
    };

    const uint8 = encodeBinaryDelta(delta);
    const rawBuffer = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

    const decoded = decodeBinaryDelta(rawBuffer);
    expect(decoded.turnTimer).toBe(25);
    expect(decoded.activeTeamId).toBe('team_blue');
  });
});

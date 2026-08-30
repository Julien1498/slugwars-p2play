import { describe, it, expect } from 'vitest';
import {
  buildStateDelta,
  applyStateDelta,
  isDeltaEmpty,
  quantizeFloat,
} from '../network/netSerializer';
import { encodeBinaryDelta, decodeBinaryDelta } from '../network/netBinarySerializer';
import { GameState, Landmine, HelicopterVehicle, SupplyCrate, PlacedGirder, CraterRecord, ActiveProjectile, ExplosionEvent } from '../core/types';

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
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
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

describe('Network Serialization & Delta Engine (netSerializer)', () => {
  describe('quantizeFloat()', () => {
    it('rounds numbers to specified decimal places and handles edge cases safely', () => {
      expect(quantizeFloat(123.4567, 2)).toBe(123.46);
      expect(quantizeFloat(-45.6789, 1)).toBe(-45.7);
      expect(quantizeFloat(10, 2)).toBe(10);
      expect(quantizeFloat(undefined)).toBe(0);
      expect(quantizeFloat(null)).toBe(0);
      expect(quantizeFloat(NaN)).toBe(0);
    });
  });

  describe('Delta Diffing & Application Lifecycle', () => {
    it('generates full baseline delta when prevState is null (initial peer join)', () => {
      const currentState = createMockGameState();
      const delta = buildStateDelta(null, currentState);

      expect(isDeltaEmpty(delta)).toBe(false);
      expect(delta.phase).toBe('AIMING');
      expect(delta.activeTeamId).toBe('team_1');
      expect(delta.turnTimer).toBe(45);
      expect(delta.wind).toBe(2.5);
      expect(delta.slugs).toBeDefined();
      expect(delta.slugs?.[0].i).toBe('slug_1'); // UUID included on baseline
    });

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
      nextState.slugs[0].x = 185.543;
      nextState.slugs[0].fuseTimerSec = 5;
      nextState.slugs[0].hp = 75;
      nextState.slugs[0].isChargingPower = true;
      nextState.slugs[0].isBlowtorching = true;
      nextState.slugs[0].currentTargetPoint = { x: 300, y: 150 };

      const delta = buildStateDelta(prevState, nextState);
      expect(isDeltaEmpty(delta)).toBe(false);
      expect(delta.slugs).toBeDefined();
      expect(delta.slugs?.[0].x).toBe(185.54);
      expect(delta.slugs?.[0].ft).toBe(5);
      expect(delta.slugs?.[0].hp).toBe(75);
      expect(delta.slugs?.[0].c).toBe(true);
      expect(delta.slugs?.[0].bt).toBe(true);
      expect(delta.slugs?.[0].tp).toEqual({ x: 300, y: 150 });

      // Apply delta to guest local state
      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);

      expect(guestState.slugs[0].x).toBe(185.54);
      expect(guestState.slugs[0].fuseTimerSec).toBe(5);
      expect(guestState.slugs[0].hp).toBe(75);
      expect(guestState.slugs[0].isChargingPower).toBe(true);
      expect(guestState.slugs[0].isBlowtorching).toBe(true);
      expect(guestState.slugs[0].currentTargetPoint).toEqual({ x: 300, y: 150 });
    });

    it('applies slug delta fallback by UUID string identifier when idx is omitted', () => {
      const guestState = createMockGameState();
      const customDelta = {
        slugs: [
          {
            i: 'slug_1',
            hp: 60,
            x: 210,
          },
        ],
      };

      applyStateDelta(guestState, customDelta);
      expect(guestState.slugs[0].hp).toBe(60);
      expect(guestState.slugs[0].x).toBe(210);
    });

    it('synchronizes ninja rope attachment and detachment', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      // Attach ninja rope
      nextState.slugs[0].ropeState = {
        hookX: 250.4,
        hookY: 80.2,
        length: 120.5,
        angleRad: 1.256,
        angularVelocity: -0.152,
      };

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.slugs?.[0].rs).toBeDefined();
      expect(delta.slugs?.[0].rs?.hx).toBe(250.4);
      expect(delta.slugs?.[0].rs?.hy).toBe(80.2);

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.slugs[0].ropeState).toBeDefined();
      expect(guestState.slugs[0].ropeState?.hookX).toBe(250.4);

      // Detach ninja rope
      const releaseState = JSON.parse(JSON.stringify(nextState));
      releaseState.slugs[0].ropeState = null;

      const releaseDelta = buildStateDelta(nextState, releaseState);
      expect(releaseDelta.slugs?.[0].rs).toBeNull();

      applyStateDelta(guestState, releaseDelta);
      expect(guestState.slugs[0].ropeState).toBeNull();
    });

    it('synchronizes flying projectiles and client-side explosion triggers', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      const proj: ActiveProjectile = {
        id: 'proj_1',
        weaponId: 'bazooka',
        x: 200.45,
        y: 180.3,
        vx: 15.2,
        vy: -8.4,
        radius: 4,
        bounces: false,
        ownerSlugId: 'slug_1',
        windAffected: true,
      };
      const exp: ExplosionEvent = {
        id: 'exp_1',
        x: 200,
        y: 180,
        radius: 45,
        damage: 50,
        createdAt: 1000,
      };

      nextState.projectiles = [proj];
      nextState.explosions = [exp];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.projectiles).toHaveLength(1);
      expect(delta.explosions).toHaveLength(1);
      expect(delta.projectiles?.[0].weaponId).toBe('bazooka');
      expect(delta.explosions?.[0].radius).toBe(45);

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.projectiles).toHaveLength(1);
      expect(guestState.explosions).toHaveLength(1);

      // Clear projectiles when hitting terrain
      const impactState = createMockGameState();
      const clearDelta = buildStateDelta(nextState, impactState);
      expect(clearDelta.projectiles).toHaveLength(0);

      applyStateDelta(guestState, clearDelta);
      expect(guestState.projectiles).toHaveLength(0);
    });

    it('synchronizes landmines triggers and countdown fuse', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      const mine: Landmine = {
        id: 'mine_1',
        x: 320,
        y: 400,
        isTriggered: true,
        fuseTimerMs: 1450,
      };
      nextState.mines = [mine];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.mines).toBeDefined();
      expect(delta.mines?.[0].id).toBe('mine_1');
      expect(delta.mines?.[0].isTriggered).toBe(true);
      expect(delta.mines?.[0].fuseTimerMs).toBe(1450);

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.mines).toHaveLength(1);
      expect(guestState.mines[0].isTriggered).toBe(true);
      expect(guestState.mines[0].fuseTimerMs).toBe(1450);
    });

    it('synchronizes helicopters movement, health, and pilot embark/disembark', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      const heli: HelicopterVehicle = {
        id: 'heli_1',
        x: 450,
        y: 120,
        vx: 2.5,
        vy: -0.5,
        hp: 80,
        maxHp: 100,
        facing: 'left',
        pilotSlugId: 'slug_1',
        rotorAngle: 0,
      };
      nextState.helicopters = [heli];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.helicopters).toBeDefined();
      expect(delta.helicopters?.[0].id).toBe('heli_1');
      expect(delta.helicopters?.[0].pilotSlugId).toBe('slug_1');

      const guestState = createMockGameState();
      guestState.helicopters = [{ ...heli, x: 0, y: 0, pilotSlugId: undefined }];
      applyStateDelta(guestState, delta);

      expect(guestState.helicopters[0].x).toBe(450);
      expect(guestState.helicopters[0].pilotSlugId).toBe('slug_1');
    });

    it('synchronizes falling and landed supply crates with health rewards', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      const crate: SupplyCrate = {
        id: 'crate_1',
        x: 500,
        y: 250,
        vy: 1.5,
        isLanded: false,
        crateType: 'health',
        healAmount: 40,
      };
      nextState.supplyCrates = [crate];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.supplyCrates).toBeDefined();
      expect(delta.supplyCrates?.[0].crateType).toBe('health');
      expect(delta.supplyCrates?.[0].healAmount).toBe(40);

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.supplyCrates).toBeDefined();
      expect(guestState.supplyCrates![0].healAmount).toBe(40);
    });

    it('synchronizes girders and permanent terrain craters', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      const girder: PlacedGirder = {
        id: 'girder_1',
        x: 300,
        y: 350,
        angleDeg: 45,
        length: 80,
        thickness: 12,
      };
      const crater: CraterRecord = {
        id: 'crater_1',
        x: 400,
        y: 350,
        radius: 35,
        createdAt: 1000,
      };

      nextState.girders = [girder];
      nextState.craters = [crater];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.girders).toBeDefined();
      expect(delta.craters).toBeDefined();

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.girders).toBeDefined();
      expect(guestState.craters).toBeDefined();
      expect(guestState.girders![0].id).toBe('girder_1');
      expect(guestState.craters![0].id).toBe('crater_1');
    });

    it('synchronizes team battle statistics and consumable ammo consumption in real-time', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      nextState.teams[0].stats = {
        kills: 2,
        deaths: 0,
        damageDealt: 185,
        damageTaken: 25,
      };
      nextState.teams[0].inventory = { bazooka: -1, grenade: 4, dynamite: 1 };

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.teams).toBeDefined();
      expect(delta.teams?.[0].kills).toBe(2);
      expect(delta.teams?.[0].damageDealt).toBe(185);
      expect(delta.teams?.[0].inventory?.grenade).toBe(4);

      const guestState = createMockGameState();
      // Test missing stats auto-initialization
      guestState.teams[0].stats = undefined as any;
      applyStateDelta(guestState, delta);
      expect(guestState.teams[0].stats?.kills).toBe(2);
      expect(guestState.teams[0].stats?.damageDealt).toBe(185);
      expect(guestState.teams[0].inventory?.grenade).toBe(4);
    });

    it('synchronizes real-time combat log entries without duplicate entries', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      nextState.journal = [
        {
          id: 'log_1',
          timestamp: Date.now(),
          message: 'Limace Alpha inflige 50 dégâts !',
          type: 'combat',
        },
      ];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.journal).toBeDefined();
      expect(delta.journal?.[0].message).toContain('50 dégâts');

      const guestState = createMockGameState();
      applyStateDelta(guestState, delta);
      expect(guestState.journal).toHaveLength(1);
      expect(guestState.journal[0].id).toBe('log_1');

      // Applying same delta again must not duplicate log
      applyStateDelta(guestState, delta);
      expect(guestState.journal).toHaveLength(1);
    });

    it('synchronizes rising water level, retreat timer nullification, and victory declaration', () => {
      const prevState = createMockGameState();
      prevState.retreatTimer = 3.5;

      const nextState = createMockGameState();
      nextState.waterLevel = 120.5;
      nextState.winnerTeamId = 'team_1';
      nextState.phase = 'GAME_OVER';
      nextState.retreatTimer = undefined;

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.waterLevel).toBe(120.5);
      expect(delta.winnerTeamId).toBe('team_1');
      expect(delta.phase).toBe('GAME_OVER');
      expect(delta.retreatTimer).toBeNull();

      const guestState = createMockGameState();
      guestState.retreatTimer = 3.5;
      applyStateDelta(guestState, delta);
      expect(guestState.waterLevel).toBe(120.5);
      expect(guestState.winnerTeamId).toBe('team_1');
      expect(guestState.phase).toBe('GAME_OVER');
      expect(guestState.retreatTimer).toBeUndefined();
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

    it('synchronizes floatingDamages and journal messages to guest correctly', () => {
      const prevState = createMockGameState();
      const nextState = createMockGameState();

      nextState.journal = [
        { id: 'j_new', timestamp: 1000, message: '📦 Limace 1 a trouvé une Caisse (+1 Bazooka) !', type: 'combat' },
        { id: 'j_old', timestamp: 500, message: 'Phase de Tir', type: 'info' },
      ];
      nextState.floatingDamages = [
        { id: 'weap_1', x: 120, y: 180, text: '+1 💣 Bazooka', color: '#e879f9', damage: -1, createdAt: 1000 },
      ];

      const delta = buildStateDelta(prevState, nextState);
      expect(delta.journal).toBeDefined();
      expect(delta.floatingDamages).toBeDefined();
      expect(delta.floatingDamages?.[0].text).toBe('+1 💣 Bazooka');

      const binaryBuffer = encodeBinaryDelta(delta);
      const decodedDelta = decodeBinaryDelta(binaryBuffer);

      const guestState = createMockGameState();
      applyStateDelta(guestState, decodedDelta);

      expect(guestState.journal).toBeDefined();
      expect(guestState.journal?.[0].message).toContain('Caisse (+1 Bazooka)');
      expect(guestState.floatingDamages).toBeDefined();
      expect(guestState.floatingDamages?.[0].text).toBe('+1 💣 Bazooka');
    });
  });
});

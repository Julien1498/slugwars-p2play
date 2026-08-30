import { describe, it, expect, vi } from 'vitest';
import { PhaseManager } from '../core/engine/phaseManager';
import { updateMines, updateSupplyCrates } from '../core/engine/supplyDropManager';
import { enterVehicle, exitVehicle } from '../core/engine/vehicleManager';
import { selectWeapon, setFuseTimer, detonateOilDrum } from '../core/engine/weaponHandler';
import { GameState, Team, Slug, Landmine, SupplyCrate, HelicopterVehicle, SolidProp } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';
import { TerrainData } from '../core/terrainGenerator';

describe('engineManagers - PhaseManager, SupplyDropManager, VehicleManager & WeaponHandler', () => {
  const createMockTerrain = (width: number = 800, height: number = 500): DestructibleTerrain => {
    const grid = new Uint8Array(width * height);
    // Fill bottom half with solid ground (y >= 300)
    for (let y = 300; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y * width + x] = 1;
      }
    }
    const data: TerrainData = {
      seed: 12345,
      width,
      height,
      theme: 'ISLAND',
      grid,
      decorItems: [],
      solidProps: [],
      spawnPoints: [{ x: 200, y: 280 }, { x: 500, y: 280 }],
      minePoints: [],
      waterLevel: 450,
    };
    return new DestructibleTerrain(data);
  };

  const createMockGameState = (): GameState => {
    const teams: Team[] = [
      {
        id: 'team_red',
        name: 'Red Team',
        color: '#ef4444',
        avatar: 'slug',
        isHost: true,
        inventory: { bazooka: -1, grenade: 3, dynamite: 0 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'team_blue',
        name: 'Blue Team',
        color: '#3b82f6',
        avatar: 'slug',
        isHost: true,
        inventory: { bazooka: 3 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ];

    const slugs: Slug[] = [
      {
        id: 'slug_1',
        teamId: 'team_red',
        name: 'Sluggy',
        x: 200,
        y: 280,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'right',
        aimAngle: 30,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_2',
        teamId: 'team_blue',
        name: 'Shelly',
        x: 500,
        y: 280,
        vx: 0,
        vy: 0,
        hp: 75,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 30,
        aimPower: 5,
        selectedWeaponId: 'grenade',
      },
    ];

    return {
      phase: 'AIMING',
      activeTeamId: 'team_red',
      activeSlugId: 'slug_1',
      roundNumber: 1,
      turnTimer: 45,
      wind: 5,
      teams,
      slugs,
      helicopters: [],
      mines: [],
      supplyCrates: [],
      projectiles: [],
      particles: [],
      explosions: [],
      craters: [],
      floatingDamages: [],
      journal: [],
      girders: [],
      winnerTeamId: null,
    } as unknown as GameState;
  };

  describe('PhaseManager', () => {
    it('handles startLobby, startPlacement, startRetreat, and startResolving transitions', () => {
      const state = createMockGameState();
      const addLog = vi.fn();

      PhaseManager.startLobby(state);
      expect(state.phase).toBe('LOBBY');
      expect(state.turnTimer).toBe(0);

      PhaseManager.startPlacement(state);
      expect(state.phase).toBe('PLACEMENT');
      expect(state.turnTimer).toBe(30);

      PhaseManager.startRetreat(state, 5, addLog);
      expect(state.phase).toBe('RETREAT');
      expect(state.retreatTimer).toBe(5);

      PhaseManager.startResolving(state, { settleTimer: 1.5, addLog, reason: 'Shot finished' });
      expect(state.phase).toBe('RESOLVING');
      expect(state.settleTimer).toBe(1.5);
    });

    it('declares game over and assigns winner when only one team remains alive', () => {
      const state = createMockGameState();
      state.slugs[1].isAlive = false; // Blue team dead
      state.slugs[1].hp = 0;

      PhaseManager.startGameOver(state, 'team_red', vi.fn());
      expect(state.phase).toBe('GAME_OVER');
      expect(state.winnerTeamId).toBe('team_red');
    });
  });

  describe('SupplyDropManager', () => {
    it('triggers proximity mines when a slug moves close', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      const carveCrater = vi.fn();
      const addLog = vi.fn();

      const mine: Landmine = {
        id: 'mine_1',
        x: 210,
        y: 280, // Within 25px of slug_1 (at x=200, y=280)
        isTriggered: false,
      };
      state.mines = [mine];

      updateMines(state, terrain, carveCrater, addLog);
      expect(mine.isTriggered).toBe(true);
      expect(mine.fuseTimerMs).toBe(3000);
      expect(addLog).toHaveBeenCalled();
    });

    it('collects a supply crate when a slug touches it and restores HP', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      const addLog = vi.fn();

      // slug_2 has 75 HP (max 100) and is at x=500, y=280
      const crate: SupplyCrate = {
        id: 'crate_1',
        x: 505,
        y: 275,
        vy: 0,
        isLanded: true,
        healAmount: 20,
        crateType: 'health',
      };
      state.supplyCrates = [crate];

      updateSupplyCrates(state, terrain, addLog);
      expect(state.slugs[1].hp).toBe(95); // 75 + 20
      expect(state.supplyCrates).toHaveLength(0); // crate consumed
      expect(addLog).toHaveBeenCalledWith(expect.stringContaining('+20 HP'), 'combat');
    });
  });

  describe('VehicleManager', () => {
    it('allows active slug to enter and exit a helicopter', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      const addLog = vi.fn();

      const heli: HelicopterVehicle = {
        id: 'heli_1',
        x: 220,
        y: 270, // close to slug_1 at x=200, y=280
        vx: 0,
        vy: 0,
        hp: 120,
        maxHp: 120,
        facing: 'right',
        pilotSlugId: null,
        rotorAngle: 0,
      };
      state.helicopters = [heli];

      const entered = enterVehicle(state, addLog);
      expect(entered).toBe(true);
      expect(heli.pilotSlugId).toBe('slug_1');
      expect(state.slugs[0].inVehicleId).toBe('heli_1');

      const exited = exitVehicle(state, addLog, terrain);
      expect(exited).toBe(true);
      expect(heli.pilotSlugId).toBeNull();
      expect(state.slugs[0].inVehicleId).toBeNull();
    });
  });

  describe('WeaponHandler', () => {
    it('selects weapon if ammo is available, or rejects if ammo is 0', () => {
      const state = createMockGameState();

      // Selected weapon with infinite ammo (-1)
      const bazookaSelected = selectWeapon(state, 'bazooka');
      expect(bazookaSelected).toBe(true);
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');

      // Selected weapon with 3 ammo
      const grenadeSelected = selectWeapon(state, 'grenade');
      expect(grenadeSelected).toBe(true);
      expect(state.slugs[0].selectedWeaponId).toBe('grenade');

      // Selected weapon with 0 ammo (dynamite) -> should reject
      const dynamiteSelected = selectWeapon(state, 'dynamite');
      expect(dynamiteSelected).toBe(false);
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');
    });

    it('sets fuse timer clamped between 1 and 5 seconds', () => {
      const state = createMockGameState();
      setFuseTimer(state, 'slug_1', 4);
      expect(state.slugs[0].fuseTimerSec).toBe(4);

      setFuseTimer(state, 'slug_1', 10);
      expect(state.slugs[0].fuseTimerSec).toBe(5);

      setFuseTimer(state, 'slug_1', -2);
      expect(state.slugs[0].fuseTimerSec).toBe(1);
    });

    it('detonates oil drums and applies explosion damage', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      const carveCrater = vi.fn();
      const addLog = vi.fn();

      const drum: SolidProp = {
        id: 'drum_1',
        type: 'oil_drum',
        x: 205,
        y: 280,
        width: 16,
        height: 24,
      };

      detonateOilDrum(state, terrain, drum, carveCrater, addLog);
      expect(state.explosions).toHaveLength(1);
      expect(state.explosions[0].damage).toBe(50);
      expect(carveCrater).toHaveBeenCalledWith(205, 268, 65);
      expect(addLog).toHaveBeenCalled();
    });
  });
});

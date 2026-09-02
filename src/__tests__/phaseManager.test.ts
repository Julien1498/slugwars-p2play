import { describe, it, expect } from 'vitest';
import { PhaseManager } from '../core/engine/phaseManager';
import { GameState, ActiveProjectile } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';
import { generateProceduralTerrain } from '../core/terrainGenerator';

function createMockTerrain(): DestructibleTerrain {
  const data = generateProceduralTerrain(12345, 'ISLAND', 1400, 800);
  return new DestructibleTerrain(data);
}

function createMockGameState(): GameState {
  return {
    phase: 'AIMING',
    activeTeamId: 'team_1',
    activeSlugId: 'slug_1',
    turnTimer: 45,
    wind: 0,
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
        name: 'Équipe Rouge',
        color: '#ef4444',
        avatar: '🐌',
        isHost: true,
        inventory: { bazooka: -1, grenade: 0, dynamite: 2 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'team_2',
        name: 'Équipe Bleue',
        color: '#3b82f6',
        avatar: '🐌',
        isHost: false,
        inventory: { bazooka: -1, grenade: 3, dynamite: 2 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ],
    slugs: [
      {
        id: 'slug_1',
        name: 'Alpha 1',
        teamId: 'team_1',
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'right',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'grenade',
      },
      {
        id: 'slug_2',
        name: 'Alpha 2',
        teamId: 'team_1',
        x: 150,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'right',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_3',
        name: 'Bravo 1',
        teamId: 'team_2',
        x: 600,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_4',
        name: 'Bravo 2',
        teamId: 'team_2',
        x: 650,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        isPlaced: true,
        facing: 'left',
        aimAngle: 20,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
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

describe('PhaseManager State Machine & Turn Progression', () => {
  describe('Direct Phase Transitions & State Cleanup', () => {
    it('startLobby() resets timers and cleans up aiming input flags', () => {
      const state = createMockGameState();
      state.slugs[0].movingDir = 'left';
      state.slugs[0].isChargingPower = true;
      state.slugs[0].isBlowtorching = true;
      state.slugs[0].currentTargetPoint = { x: 100, y: 100 };

      PhaseManager.startLobby(state);

      expect(state.phase).toBe('LOBBY');
      expect(state.turnTimer).toBe(0);
      expect(state.slugs[0].movingDir).toBeNull();
      expect(state.slugs[0].isChargingPower).toBe(false);
      expect(state.slugs[0].isBlowtorching).toBe(false);
      expect(state.slugs[0].currentTargetPoint).toBeUndefined();
    });

    it('startPlacement() selects first unplaced slug and initializes placement countdown (30s)', () => {
      const state = createMockGameState();
      state.slugs[0].isPlaced = true;
      state.slugs[1].isPlaced = false;

      PhaseManager.startPlacement(state);

      expect(state.phase).toBe('PLACEMENT');
      expect(state.turnTimer).toBe(30);
      expect(state.activeTeamId).toBeDefined();
    });

    it('startTurnStart() sets brief camera focus duration (0.8s default)', () => {
      const state = createMockGameState();
      PhaseManager.startTurnStart(state, 0.5);

      expect(state.phase).toBe('TURN_START');
      expect(state.phaseTimer).toBe(0.5);
    });

    it('startAiming() verifies weapon ammunition and falls back to bazooka if ammo is 0', () => {
      const state = createMockGameState();
      // Team 1 has 0 grenades in inventory
      expect(state.teams[0].inventory['grenade']).toBe(0);
      state.slugs[0].selectedWeaponId = 'grenade';

      PhaseManager.startAiming(state);

      expect(state.phase).toBe('AIMING');
      expect(state.turnTimer).toBe(45);
      // Ammo check replaced grenade with infinite bazooka
      expect(state.slugs[0].selectedWeaponId).toBe('bazooka');
    });

    it('startRetreat() initializes retreat timer and adds journal entry', () => {
      const state = createMockGameState();
      const logs: string[] = [];
      PhaseManager.startRetreat(state, 4.0, (msg) => logs.push(msg));

      expect(state.phase).toBe('RETREAT');
      expect(state.retreatTimer).toBe(4.0);
      expect(logs).toHaveLength(1);
      expect(logs[0]).toContain('TEMPS DE FUITE');
    });

    it('startProjectileActive() transitions to projectile tracking', () => {
      const state = createMockGameState();
      PhaseManager.startProjectileActive(state);

      expect(state.phase).toBe('PROJECTILE_ACTIVE');
    });

    it('startResolving() disconnects ninja ropes and sets settle timer', () => {
      const state = createMockGameState();
      state.slugs[0].ropeState = {
        hookX: 100,
        hookY: 50,
        length: 80,
        angleRad: 0,
        angularVelocity: 0,
      };

      const logs: string[] = [];
      PhaseManager.startResolving(state, {
        settleTimer: 1.2,
        reason: 'Impact confirmé',
        addLog: (msg) => logs.push(msg),
      });

      expect(state.phase).toBe('RESOLVING');
      expect(state.settleTimer).toBe(1.2);
      expect(state.slugs[0].ropeState).toBeNull();
      expect(logs[0]).toBe('Impact confirmé');
    });

    it('startGameOver() sets winnerTeamId and logs victory or draw', () => {
      const state = createMockGameState();
      const logs: string[] = [];

      PhaseManager.startGameOver(state, 'team_1', (msg) => logs.push(msg));
      expect(state.phase).toBe('GAME_OVER');
      expect(state.winnerTeamId).toBe('team_1');
      expect(logs[0]).toContain('Victoire');

      // Draw match
      logs.length = 0;
      PhaseManager.startGameOver(state, undefined, (msg) => logs.push(msg));
      expect(state.winnerTeamId).toBeUndefined();
      expect(logs[0]).toContain('Match nul');
    });
  });

  describe('updatePhaseTick() Timer & Transition Loop', () => {
    it('advances from TURN_START to AIMING when phaseTimer runs out', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      PhaseManager.startTurnStart(state, 0.1);

      PhaseManager.updatePhaseTick(state, terrain, 0.15, {
        addLog: () => {},
        advanceToNextTurn: () => {},
      });

      expect(state.phase).toBe('AIMING');
    });

    it('transitions from AIMING to RESOLVING with timeout reason when turnTimer reaches 0', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.turnTimer = 0.5;

      const logs: string[] = [];
      PhaseManager.updatePhaseTick(state, terrain, 0.6, {
        addLog: (msg) => logs.push(msg),
        advanceToNextTurn: () => {},
      });

      expect(state.phase).toBe('RESOLVING');
      expect(logs[0]).toContain('Temps écoulé');
    });

    it('transitions from RETREAT to RESOLVING when retreatTimer reaches 0 and no projectiles exist', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      PhaseManager.startRetreat(state, 0.2);

      PhaseManager.updatePhaseTick(state, terrain, 0.25, {
        addLog: () => {},
        advanceToNextTurn: () => {},
      });

      expect(state.phase).toBe('RESOLVING');
    });

    it('transitions from PROJECTILE_ACTIVE to RESOLVING when all projectiles have disappeared', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      PhaseManager.startProjectileActive(state);
      state.projectiles = [];

      PhaseManager.updatePhaseTick(state, terrain, 0.05, {
        addLog: () => {},
        advanceToNextTurn: () => {},
      });

      expect(state.phase).toBe('RESOLVING');
    });

    it('advances to next turn during RESOLVING when world is at rest and settleTimer has elapsed', () => {
      const terrain = createMockTerrain();
      const state = createMockGameState();
      state.phase = 'RESOLVING';
      state.settleTimer = 0; // Settle delay elapsed
      state.phaseTimer = 25.0;

      // Position slugs solidly on ground so isWorldAtRest is true
      for (let i = 0; i < state.slugs.length; i++) {
        const slug = state.slugs[i];
        slug.x = 400 + i * 100;
        for (let y = 100; y < 700; y++) {
          if (terrain.isSolid(slug.x, y)) {
            slug.y = y - 1; // resting on solid ground
            slug.vx = 0;
            slug.vy = 0;
            break;
          }
        }
      }

      let nextTurnCalled = false;
      PhaseManager.updatePhaseTick(state, terrain, 0.1, {
        addLog: () => {},
        advanceToNextTurn: () => { nextTurnCalled = true; },
      });

      expect(nextTurnCalled).toBe(true);
    });
  });

  describe('advanceToNextTurn() & Water Rising Mechanic', () => {
    it('rotates to next alive team, resets slug power/inputs and starts aiming', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();

      let checkWinnerCalled = false;
      let randomizeWindCalled = false;

      PhaseManager.advanceToNextTurn(state, terrain, {
        addLog: () => {},
        checkWinner: () => { checkWinnerCalled = true; },
        randomizeWind: () => { randomizeWindCalled = true; },
        getNextSlugForTeam: () => 'slug_3',
      });

      expect(checkWinnerCalled).toBe(true);
      expect(randomizeWindCalled).toBe(true);
      expect(state.activeTeamId).toBe('team_2');
      expect(state.activeSlugId).toBe('slug_3');
      expect(state.phase).toBe('AIMING');
    });

    it('rises water level during ROUND_CYCLE only when full round completes back to team 0', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.config.waterRiseSpeed = 'NORMAL';
      state.config.waterRiseFreq = 'ROUND_CYCLE';
      state.waterLevel = 600;
      terrain.data.waterLevel = 600;

      // Active team is team_1 (index 0). Next team will be team_2 (index 1) -> not round cycle completed
      PhaseManager.advanceToNextTurn(state, terrain, {
        addLog: () => {},
        checkWinner: () => {},
        randomizeWind: () => {},
        getNextSlugForTeam: () => 'slug_3',
      });
      expect(state.waterLevel).toBe(600); // Did not rise

      // Now active team is team_2 (index 1). Next will be team_1 (index 0) -> round cycle completed!
      PhaseManager.advanceToNextTurn(state, terrain, {
        addLog: () => {},
        checkWinner: () => {},
        randomizeWind: () => {},
        getNextSlugForTeam: () => 'slug_1',
      });
      expect(state.waterLevel).toBe(564); // 600 - 36 (NORMAL ROUND_CYCLE)
    });

    it('submerges and eliminates slugs when water level rises', () => {
      const state = createMockGameState();
      const terrain = createMockTerrain();
      state.config.waterRiseSpeed = 'NORMAL'; // 12 px per turn
      state.config.waterRiseFreq = 'EVERY_TURN';

      // Place slug 4 deep at bottom
      state.slugs[3].y = 590;
      state.waterLevel = 600;
      terrain.data.waterLevel = 600;

      const deathLogs: string[] = [];

      PhaseManager.advanceToNextTurn(state, terrain, {
        addLog: (msg, type) => {
          if (type === 'death') deathLogs.push(msg);
        },
        checkWinner: () => {},
        randomizeWind: () => {},
        getNextSlugForTeam: () => 'slug_3',
      });

      expect(state.waterLevel).toBe(588); // 600 - 12
      expect(state.slugs[3].isAlive).toBe(false);
      expect(state.slugs[3].hp).toBe(0);
      expect(deathLogs).toHaveLength(1);
      expect(deathLogs[0]).toContain('englouti');
    });
  });
});

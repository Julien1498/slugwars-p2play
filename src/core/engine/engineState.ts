import { GameState, GameConfig, Team, MAP_SIZE_CONFIGS } from '../types';
import { getWeaponSet } from '../weapons/weaponSets';
import { generateProceduralTerrain } from '../terrainGenerator';
import { DestructibleTerrain } from '../terrain';

export function createInitialConfig(initialConfig?: Partial<GameConfig>): GameConfig {
  return {
    weaponSetId: 'CLASSIC',
    slugHp: 100,
    slugsPerTeam: 3,
    turnDuration: 45,
    windEnabled: true,
    vehiclesEnabled: true,
    dayNightCycle: 'DAY',
    mapTheme: 'ISLAND',
    mapSize: 'NORMAL',
    mapSeed: Math.floor(Math.random() * 1000000),
    ...initialConfig,
  };
}

export function createInitialState(config: GameConfig): GameState {
  return {
    phase: 'LOBBY',
    config,
    teams: [],
    slugs: [],
    mines: [],
    helicopters: [],
    activeTeamId: '',
    activeSlugId: '',
    turnTimer: config.turnDuration,
    wind: 0,
    projectiles: [],
    explosions: [],
    particles: [],
    floatingDamages: [],
    journal: [],
    turnCount: 0,
  };
}

export function initializeTerrainForConfig(config: GameConfig): { terrain: DestructibleTerrain; waterLevel: number } {
  const sizeCfg = MAP_SIZE_CONFIGS[config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;
  const data = generateProceduralTerrain(
    config.mapSeed,
    config.mapTheme,
    sizeCfg.width,
    sizeCfg.height
  );
  const terrain = new DestructibleTerrain(data);
  return { terrain, waterLevel: data.waterLevel };
}

import { findSafePlacementPoint } from './turnManager';

export function registerTeam(
  state: GameState,
  id: string,
  name: string,
  color: string,
  avatar: string,
  isHost: boolean,
  terrain?: DestructibleTerrain
) {
  if (state.teams.some((t) => t.id === id)) return;
  const wSet = getWeaponSet(state.config.weaponSetId);
  const newTeam: Team = {
    id,
    name,
    color,
    avatar,
    isHost,
    inventory: { ...wSet.inventory },
  };
  state.teams.push(newTeam);

  // If joining mid-game (late join), spawn active slugs so the team isn't considered dead
  if (state.phase !== 'LOBBY') {
    const slugsCount = state.config.slugsPerTeam || 3;
    const width = terrain?.data.width || 1920;
    const spawnPoints = terrain?.data.spawnPoints || [];

    for (let i = 0; i < slugsCount; i++) {
      let targetX = 100 + (i / slugsCount) * (width - 200) + (Math.random() - 0.5) * 50;
      let targetY = 150;
      if (spawnPoints[i % spawnPoints.length]) {
        targetX = spawnPoints[i % spawnPoints.length].x;
        targetY = spawnPoints[i % spawnPoints.length].y;
      }
      const safePt = terrain ? findSafePlacementPoint(terrain, targetX, targetY, state.slugs) : { x: targetX, y: targetY };

      state.slugs.push({
        id: `slug_${id}_${i}_${Date.now()}`,
        teamId: id,
        name: `${name} #${i + 1}`,
        x: safePt.x,
        y: safePt.y,
        vx: 0,
        vy: 0,
        hp: state.config.slugHp,
        maxHp: state.config.slugHp,
        isAlive: true,
        isPlaced: true,
        facing: i % 2 === 0 ? 'right' : 'left',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      });
    }

    if (!state.activeSlugId && state.slugs.length > 0) {
      state.activeSlugId = state.slugs[0].id;
    }
  }
}

export function unregisterTeam(state: GameState, id: string) {
  state.teams = state.teams.filter((t) => t.id !== id);
}

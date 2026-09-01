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
    craters: [],
    terrainBuilds: [],
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
    stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
  };
  state.teams.push(newTeam);

  // If match has already started (PLACEMENT or mid-game), register the slugs for this team
  if (state.phase !== 'LOBBY') {
    const isPlacementPhase = state.phase === 'PLACEMENT';
    const slugsCount = state.config.slugsPerTeam || 3;
    const width = terrain?.data.width || 1920;
    const spawnPoints = terrain?.data.spawnPoints || [];

    for (let i = 0; i < slugsCount; i++) {
      let posX = 0;
      let posY = 0;
      if (!isPlacementPhase && terrain) {
        let targetX = 100 + (i / slugsCount) * (width - 200) + (Math.random() - 0.5) * 50;
        let targetY = 150;
        if (spawnPoints[i % spawnPoints.length]) {
          targetX = spawnPoints[i % spawnPoints.length].x;
          targetY = spawnPoints[i % spawnPoints.length].y;
        }
        const safePt = findSafePlacementPoint(terrain, targetX, targetY, state.slugs);
        posX = safePt.x;
        posY = safePt.y;
      }

      state.slugs.push({
        id: `slug_${id}_${i}`,
        teamId: id,
        name: `${name} #${i + 1}`,
        x: posX,
        y: posY,
        vx: 0,
        vy: 0,
        hp: state.config.slugHp,
        maxHp: state.config.slugHp,
        isAlive: true,
        isPlaced: !isPlacementPhase,
        facing: i % 2 === 0 ? 'right' : 'left',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      });
    }

    if (isPlacementPhase) {
      const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
      if (!activeSlug || activeSlug.isPlaced) {
        const unplaced = state.slugs.find((s) => !s.isPlaced && s.isAlive);
        if (unplaced) {
          state.activeSlugId = unplaced.id;
          state.activeTeamId = unplaced.teamId;
        }
      }
    }
  }
}

export function unregisterTeam(state: GameState, id: string) {
  state.teams = state.teams.filter((t) => t.id !== id);
}

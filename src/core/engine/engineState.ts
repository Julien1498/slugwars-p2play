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

export function registerTeam(state: GameState, id: string, name: string, color: string, avatar: string, isHost: boolean) {
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
}

export function unregisterTeam(state: GameState, id: string) {
  state.teams = state.teams.filter((t) => t.id !== id);
}

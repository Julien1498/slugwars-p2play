import { GameState, Vector2D, SolidProp } from '../types';
import { DestructibleTerrain } from '../terrain';
import { getThemeConfig } from '../terrain/themeRegistry';
import { getWeaponSet } from '../weapons/weaponSets';
import { PhaseManager } from './phaseManager';
import { findSafePlacementPoint } from './turnManager';
import { sfx } from '../audio';

export function setupGameStart(
  state: GameState,
  terrain: DestructibleTerrain,
  teamLastPlayedSlugId: Record<string, string>,
  initTerrain: () => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
): boolean {
  if (state.teams.length === 0) return false;
  if (state.config.mapSeed === undefined || state.config.mapSeed === null) {
    state.config.mapSeed = Math.floor(Math.random() * 1000000);
  }
  initTerrain();
  state.slugs = [];
  Object.keys(teamLastPlayedSlugId).forEach((k) => delete teamLastPlayedSlugId[k]);

  const weaponSet = getWeaponSet(state.config.weaponSetId);
  for (const team of state.teams) {
    team.inventory = { ...weaponSet.inventory };
    team.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
  }

  state.explosions = [];
  state.particles = [];
  state.projectiles = [];
  state.floatingDamages = [];
  state.supplyCrates = [];
  state.girders = [];
  state.craters = [];
  state.journal = [];
  state.turnCount = 0;

  for (const team of state.teams) {
    for (let i = 0; i < state.config.slugsPerTeam; i++) {
      state.slugs.push({
        id: `slug_${team.id}_${i}`,
        teamId: team.id,
        name: `${team.name} #${i + 1}`,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        hp: state.config.slugHp,
        maxHp: state.config.slugHp,
        isAlive: true,
        isPlaced: false,
        facing: i % 2 === 0 ? 'right' : 'left',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
      });
    }
  }

  state.mines = (terrain.data.minePoints || []).map((pt, idx) => ({
    id: `mine_${idx}_${Date.now()}`,
    x: pt.x,
    y: pt.y,
    isTriggered: false,
  }));

  if (state.config.vehiclesEnabled) {
    const { width, theme, waterLevel } = terrain.data;
    let spawnX = Math.floor(width * 0.5);
    let spawnY = 150;
    let foundGround = false;
    const scanStartY = getThemeConfig(theme).physics.searchStartY;
    const candidateOffsets = [0, -100, 100, -200, 200, -300, 300, -400, 400];

    for (const offsetX of candidateOffsets) {
      const testX = Math.max(100, Math.min(width - 100, Math.floor(width * 0.5) + offsetX));
      for (let y = scanStartY; y < waterLevel - 45; y++) {
        if (terrain.isSolid(testX, y)) {
          let hasOpenHeadroom = true;
          for (let check = 1; check <= 32; check++) {
            if (terrain.isSolid(testX, y - check)) {
              hasOpenHeadroom = false;
              break;
            }
          }
          if (hasOpenHeadroom) {
            spawnX = testX;
            spawnY = y - 14;
            foundGround = true;
            break;
          }
        }
      }
      if (foundGround) break;
    }

    state.helicopters = [
      {
        id: 'heli_1',
        x: spawnX,
        y: spawnY,
        vx: 0,
        vy: 0,
        hp: 150,
        maxHp: 150,
        facing: 'right',
        pilotSlugId: null,
        rotorAngle: 0,
      },
    ];
  } else {
    state.helicopters = [];
  }

  PhaseManager.startPlacement(state);
  addLog('Phase de Placement ! Placez vos limaces à tour de rôle sur le terrain.', 'info');
  return true;
}

export function handlePlaceSlug(
  state: GameState,
  terrain: DestructibleTerrain,
  point: Vector2D,
  getNextSlugForTeam: (teamId: string) => string,
  randomizeWind: () => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
): boolean {
  if (state.phase !== 'PLACEMENT') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || activeSlug.isPlaced) return false;

  const safePt = findSafePlacementPoint(terrain, point.x, point.y, state.slugs);
  activeSlug.x = safePt.x;
  activeSlug.y = safePt.y;
  activeSlug.vx = 0;
  activeSlug.vy = 0;
  activeSlug.fallStartY = undefined;
  activeSlug.isPlaced = true;
  sfx.play('jump');
  addLog(`${activeSlug.name} positionné sur le terrain !`, 'info');

  const unplaced = state.slugs.filter((s) => !s.isPlaced);
  if (unplaced.length === 0) {
    state.activeTeamId = state.teams[0]?.id || '';
    state.activeSlugId = getNextSlugForTeam(state.activeTeamId) || state.slugs[0].id;
    randomizeWind();
    PhaseManager.startAiming(state);
    addLog('Toutes les limaces sont en place ! Le combat commence !', 'info');
    sfx.play('victory');
    return true;
  }

  const currentTeamIdx = state.teams.findIndex((t) => t.id === state.activeTeamId);
  const nextTeam = state.teams[(currentTeamIdx + 1) % state.teams.length];
  state.activeTeamId = nextTeam.id;

  let nextSlug = state.slugs.find((s) => s.teamId === nextTeam.id && !s.isPlaced);
  if (!nextSlug) {
    nextSlug = unplaced[0];
    state.activeTeamId = nextSlug.teamId;
  }
  state.activeSlugId = nextSlug.id;
  state.turnTimer = 30;
  return true;
}

export function handleCarveCrater(
  state: GameState,
  terrain: DestructibleTerrain,
  x: number,
  y: number,
  radius: number,
  onDetonateDrum: (drum: SolidProp) => void
): void {
  if (!state.craters) state.craters = [];
  const rX = Math.round(x);
  const rY = Math.round(y);
  const rR = Math.round(radius);
  const id = `c_${rX}_${rY}_${rR}_${state.craters.length}`;
  state.craters.push({ id, x: rX, y: rY, radius: rR, createdAt: Date.now() });

  const { destroyedOilDrums } = terrain.carveExplosion(x, y, radius);
  if (destroyedOilDrums && destroyedOilDrums.length > 0) {
    for (const drum of destroyedOilDrums) {
      onDetonateDrum(drum);
    }
  }
}

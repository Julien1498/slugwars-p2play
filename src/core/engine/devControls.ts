import { GameState, SupplyCrate, Landmine, HelicopterVehicle, SolidProp, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { WEAPON_REGISTRY } from '../weapons/registry';
import { PhaseManager } from './phaseManager';
import { executeArmageddon } from './weapons/specialWeaponExecutors';
import { findSafePlacementPoint } from './turnManager';

const DEV_WEAPON_CRATE_POOL = [
  'holy_grenade', 'banana_bomb', 'super_sheep', 'armageddon',
  'air_strike', 'bunker_buster', 'mine_strike', 'concrete_donkey',
  'shotgun', 'uzi', 'homing_missile', 'dynamite', 'kamikaze',
];

const DEV_UTILITY_CRATE_POOL = [
  'teleport', 'ninja_rope', 'girder', 'airdrop', 'blowtorch', 'prod',
];

export function devSetInfiniteAmmo(state: GameState): void {
  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId) || state.teams[0];
  if (!activeTeam) return;
  if (!activeTeam.inventory) activeTeam.inventory = {};

  for (const weapon of Object.values(WEAPON_REGISTRY)) {
    activeTeam.inventory[weapon.id] = -1;
  }
}

export function devUnlockAllWeapons(state: GameState): void {
  if (state.config) {
    state.config.turnDelaysEnabled = false;
  }
  for (const team of state.teams) {
    if (!team.inventory) team.inventory = {};
    for (const weapon of Object.values(WEAPON_REGISTRY)) {
      if (team.inventory[weapon.id] === undefined || team.inventory[weapon.id] === 0) {
        team.inventory[weapon.id] = 5;
      }
    }
  }
}

export function devHealAll(state: GameState, targetHp?: number): void {
  for (const slug of state.slugs) {
    if (targetHp !== undefined) {
      slug.maxHp = targetHp;
      slug.hp = targetHp;
    } else {
      slug.hp = slug.maxHp;
    }
    slug.isAlive = true;
  }
}

export function devSetOneHp(state: GameState): void {
  for (const slug of state.slugs) {
    if (slug.isAlive && slug.hp > 0) {
      slug.hp = 1;
    }
  }
}

export function devKillSlug(state: GameState, slugId: string): void {
  const slug = state.slugs.find((s) => s.id === slugId);
  if (slug) {
    slug.hp = 0;
    slug.isAlive = false;
  }
}

export function devForceWin(
  state: GameState,
  teamId?: string,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): void {
  const targetId = teamId || state.activeTeamId || state.teams[0]?.id;
  PhaseManager.startGameOver(state, targetId, addLog);
}

export function devTeleportSlug(
  state: GameState,
  slugId: string,
  x: number,
  y: number
): void {
  const slug = state.slugs.find((s) => s.id === slugId);
  if (slug) {
    slug.x = x;
    slug.y = y;
    slug.vx = 0;
    slug.vy = 0;
    slug.ropeState = undefined;
    slug.inVehicleId = undefined;
  }
}

export function devAutoPlaceAllSlugs(
  state: GameState,
  terrain: DestructibleTerrain,
  addLog: (msg: string, type?: JournalEntry['type']) => void = () => {}
): void {
  const unplaced = state.slugs.filter((s) => !s.isPlaced);
  if (unplaced.length === 0) return;

  const width = terrain.data.width;
  const spawnPoints = terrain.data.spawnPoints || [];

  unplaced.forEach((slug, idx) => {
    let targetX: number;
    let targetY = 150;
    if (spawnPoints[idx % spawnPoints.length]) {
      targetX = spawnPoints[idx % spawnPoints.length].x;
      targetY = spawnPoints[idx % spawnPoints.length].y;
    } else {
      targetX = 100 + (idx / Math.max(1, unplaced.length)) * (width - 200) + (Math.random() - 0.5) * 60;
    }
    const safePt = findSafePlacementPoint(terrain, targetX, targetY, state.slugs);
    slug.x = safePt.x;
    slug.y = safePt.y;
    slug.isPlaced = true;
  });

  if (state.phase === 'PLACEMENT') {
    state.activeTeamId = state.teams[0]?.id || '';
    state.activeSlugId = state.slugs.find((s) => s.teamId === state.activeTeamId)?.id || state.slugs[0]?.id || '';
    PhaseManager.startAiming(state);
    addLog('⚡ Toutes les limaces ont été déployées instantanément !', 'info');
  }
}

export function devSpawnCrate(
  state: GameState,
  x: number,
  y: number,
  crateType: 'health' | 'weapon' | 'utility' = 'weapon'
): SupplyCrate {
  if (!state.supplyCrates) state.supplyCrates = [];

  let weaponId: string | undefined;
  if (crateType === 'weapon') {
    const rIdx = Math.floor(Math.random() * DEV_WEAPON_CRATE_POOL.length);
    weaponId = DEV_WEAPON_CRATE_POOL[rIdx];
  } else if (crateType === 'utility') {
    const rIdx = Math.floor(Math.random() * DEV_UTILITY_CRATE_POOL.length);
    weaponId = DEV_UTILITY_CRATE_POOL[rIdx];
  }

  const crate: SupplyCrate = {
    id: `crate_dev_${Date.now()}_${Math.random()}`,
    x,
    y,
    vy: 0,
    isLanded: true,
    crateType,
    healAmount: crateType === 'health' ? 50 : undefined,
    weaponId,
    weaponCount: crateType !== 'health' ? 1 : undefined,
  };
  state.supplyCrates.push(crate);
  return crate;
}

export function devSpawnMine(state: GameState, x: number, y: number): Landmine {
  if (!state.mines) state.mines = [];
  const mine: Landmine = {
    id: `mine_dev_${Date.now()}_${Math.random()}`,
    x,
    y,
    isTriggered: false,
  };
  state.mines.push(mine);
  return mine;
}

export function devSpawnOilDrum(
  state: GameState,
  terrain: DestructibleTerrain | undefined,
  x: number,
  y: number
): SolidProp {
  if (!state.solidProps) state.solidProps = [];
  if (terrain && !terrain.data.solidProps) terrain.data.solidProps = [];
  const drum: SolidProp = {
    id: `prop_drum_dev_${Date.now()}_${Math.random()}`,
    type: 'oil_drum',
    x,
    y,
    width: 24,
    height: 30,
    variant: 0,
  };
  state.solidProps.push(drum);
  if (terrain) terrain.data.solidProps.push(drum);
  return drum;
}

export function devSpawnHelicopter(state: GameState, x: number, y: number): HelicopterVehicle {
  if (!state.helicopters) state.helicopters = [];
  const heli: HelicopterVehicle = {
    id: `heli_dev_${Date.now()}_${Math.random()}`,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    rotorAngle: 0,
    facing: 'right',
  };
  state.helicopters.push(heli);
  return heli;
}

export function devSetWind(state: GameState, wind: number): void {
  state.wind = Math.max(-5.0, Math.min(5.0, Number(wind.toFixed(1))));
}

export function devRiseWater(
  state: GameState,
  terrain: DestructibleTerrain,
  amountPx: number = 30
): void {
  terrain.data.waterLevel = Math.max(0, terrain.data.waterLevel - amountPx);
  state.waterLevel = terrain.data.waterLevel;
}

export function devLowerWater(
  state: GameState,
  terrain: DestructibleTerrain,
  amountPx: number = 30
): void {
  terrain.data.waterLevel = Math.min(terrain.data.height, terrain.data.waterLevel + amountPx);
  state.waterLevel = terrain.data.waterLevel;
}

export function devTriggerArmageddon(
  state: GameState,
  terrain: DestructibleTerrain,
  addLog: (msg: string, type?: JournalEntry['type']) => void = () => {}
): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId) || state.slugs[0];
  if (!activeSlug) return;
  executeArmageddon(state, terrain, activeSlug, addLog);
}

export function devToggleFreezeTimer(state: GameState): boolean {
  state.isTimerFrozen = !state.isTimerFrozen;
  return state.isTimerFrozen;
}

export function devToggleGodMode(state: GameState): boolean {
  state.godModeEnabled = !state.godModeEnabled;
  for (const slug of state.slugs) {
    slug.isGodMode = state.godModeEnabled;
  }
  return state.godModeEnabled;
}

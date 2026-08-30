import { GameState, SupplyCrate, Landmine, HelicopterVehicle, SolidProp } from '../types';
import { DestructibleTerrain } from '../terrain';
import { WEAPON_REGISTRY } from '../weapons/registry';

export function devSetInfiniteAmmo(state: GameState): void {
  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId) || state.teams[0];
  if (!activeTeam) return;
  if (!activeTeam.inventory) activeTeam.inventory = {};

  for (const weapon of Object.values(WEAPON_REGISTRY)) {
    activeTeam.inventory[weapon.id] = -1;
  }
}

export function devUnlockAllWeapons(state: GameState): void {
  const activeTeam = state.teams.find((t) => t.id === state.activeTeamId) || state.teams[0];
  if (!activeTeam) return;
  if (!activeTeam.inventory) activeTeam.inventory = {};

  for (const weapon of Object.values(WEAPON_REGISTRY)) {
    if (activeTeam.inventory[weapon.id] === undefined || activeTeam.inventory[weapon.id] === 0) {
      activeTeam.inventory[weapon.id] = 5;
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

export function devSpawnCrate(
  state: GameState,
  x: number,
  y: number,
  crateType: 'health' | 'weapon' | 'utility' = 'weapon'
): SupplyCrate {
  if (!state.supplyCrates) state.supplyCrates = [];
  const crate: SupplyCrate = {
    id: `crate_dev_${Date.now()}_${Math.random()}`,
    x,
    y,
    vy: 0,
    isLanded: true,
    crateType,
    healAmount: crateType === 'health' ? 50 : undefined,
    weaponId: crateType === 'weapon' ? 'holy_grenade' : crateType === 'utility' ? 'teleport' : undefined,
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

export function devSpawnOilDrum(state: GameState, x: number, y: number): SolidProp {
  if (!state.solidProps) state.solidProps = [];
  const drum: SolidProp = {
    id: `prop_drum_dev_${Date.now()}_${Math.random()}`,
    type: 'oil_drum',
    x,
    y,
    width: 24,
    height: 30,
  };
  state.solidProps.push(drum);
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

export function devToggleFreezeTimer(state: GameState): boolean {
  state.isTimerFrozen = !state.isTimerFrozen;
  return state.isTimerFrozen;
}

export function devToggleGodMode(state: GameState): boolean {
  state.godModeEnabled = !state.godModeEnabled;
  return state.godModeEnabled;
}

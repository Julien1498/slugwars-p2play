import { GameState, SupplyCrate, JournalEntry } from '../types';
import { getAllWeapons } from '../weapons/registry';
import { sfx } from '../audio';
import { DestructibleTerrain } from '../terrain';
import { getThemeConfig } from '../terrain/themeRegistry';

export const GLOBAL_CRATE_DROP_CHANCE = 0.50; // 4ème dé maître : 50% de chance d'activer les tirages de caisses

export const CRATE_DROP_RATES = {
  WEAPON: 0.55,   // 55% (~50 à 60 %)
  UTILITY: 0.25,  // 25% (~25 à 30 %)
  HEALTH: 0.15,   // 15% (~10 à 15 %)
} as const;

export const MAX_SUPPLY_CRATES_ON_MAP = 5;

export function pickWeaponCrateContent(): {
  crateType: 'weapon';
  weaponId: string;
  weaponCount: number;
} {
  const candidates = getAllWeapons().filter(
    (w) => (w.crateProbability ?? 0) > 0 && w.category !== 'UTILITY'
  );
  if (candidates.length === 0) {
    return { crateType: 'weapon', weaponId: 'grenade', weaponCount: 1 };
  }

  const totalWeight = candidates.reduce((sum, w) => sum + (w.crateProbability ?? 0.1), 0);
  let r = Math.random() * totalWeight;
  let chosen = candidates[0];
  for (const w of candidates) {
    r -= w.crateProbability ?? 0.1;
    if (r <= 0) {
      chosen = w;
      break;
    }
  }
  return { crateType: 'weapon', weaponId: chosen.id, weaponCount: 1 };
}

export function pickUtilityCrateContent(): {
  crateType: 'utility';
  weaponId: string;
  weaponCount: number;
} {
  const candidates = getAllWeapons().filter(
    (w) => (w.crateProbability ?? 0) > 0 && w.category === 'UTILITY'
  );
  if (candidates.length === 0) {
    return { crateType: 'utility', weaponId: 'jetpack', weaponCount: 1 };
  }

  const totalWeight = candidates.reduce((sum, w) => sum + (w.crateProbability ?? 0.1), 0);
  let r = Math.random() * totalWeight;
  let chosen = candidates[0];
  for (const w of candidates) {
    r -= w.crateProbability ?? 0.1;
    if (r <= 0) {
      chosen = w;
      break;
    }
  }
  return { crateType: 'utility', weaponId: chosen.id, weaponCount: 1 };
}

export function pickHealthCrateContent(): {
  crateType: 'health';
  healAmount: number;
} {
  return { crateType: 'health', healAmount: 50 };
}

export function pickRandomCrateContent(): {
  crateType: SupplyCrate['crateType'];
  healAmount?: number;
  weaponId?: string;
  weaponCount?: number;
} {
  const roll = Math.random();
  if (roll < 0.15) {
    return pickHealthCrateContent();
  } else if (roll < 0.70) {
    return pickWeaponCrateContent();
  } else {
    return pickUtilityCrateContent();
  }
}

export function findCavernCeilingAirY(terrain: DestructibleTerrain, x: number): number {
  const width = terrain.data.width;
  const height = terrain.data.height;
  const waterLevel = terrain.data.waterLevel ?? height;
  const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
  const isSolid = typeof terrain.isSolid === 'function'
    ? (px: number, py: number) => terrain.isSolid(px, py)
    : (px: number, py: number) => (terrain.data?.grid?.[py * width + px] ?? 0) > 0 || py <= 16;

  // Start from y = 17 (bedrock is <= 16) and scan down through solid ceiling rock
  let ceilingBottomY = 17;
  while (ceilingBottomY < height && isSolid(ix, ceilingBottomY)) {
    ceilingBottomY++;
  }

  // If ceiling reaches the bottom or near water, no cavern air exists at this column
  if (ceilingBottomY >= waterLevel - 40 || ceilingBottomY >= height - 40) {
    return -1;
  }

  // Verify at least 30px of open air below the ceiling before hitting ground or water
  let openAir = 0;
  const maxCheckY = Math.min(height, waterLevel - 15);
  for (let y = ceilingBottomY; y < maxCheckY; y++) {
    if (!isSolid(ix, y)) {
      openAir++;
      if (openAir >= 30) break;
    } else {
      break;
    }
  }

  return openAir >= 30 ? ceilingBottomY + 4 : -1;
}

export function findCrateSpawnCoords(
  terrainOrWidth: number | DestructibleTerrain
): { x: number; y: number } {
  if (typeof terrainOrWidth === 'number' || !terrainOrWidth || !terrainOrWidth.data) {
    const width = typeof terrainOrWidth === 'number' ? terrainOrWidth : 1400;
    const spawnX = Math.round(80 + Math.random() * Math.max(1, width - 160));
    return { x: spawnX, y: -30 };
  }

  const terrain = terrainOrWidth;
  const width = terrain.data.width || 1400;
  const theme = terrain.data.theme;
  const themeConfig = theme ? getThemeConfig(theme) : undefined;
  const hasCeiling = themeConfig?.physics.hasSolidCeiling ?? false;

  if (!hasCeiling) {
    const spawnX = Math.round(80 + Math.random() * Math.max(1, width - 160));
    return { x: spawnX, y: -30 };
  }

  // Underground / cavern map with solid ceiling: find clear air inside the cave
  for (let attempt = 0; attempt < 30; attempt++) {
    const testX = Math.round(80 + Math.random() * Math.max(1, width - 160));
    const airY = findCavernCeilingAirY(terrain, testX);
    if (airY > 0) {
      return { x: testX, y: airY };
    }
  }

  // Fallback: spawn above a known slug spawn point
  const spawnPoints = terrain.data.spawnPoints;
  if (spawnPoints && spawnPoints.length > 0) {
    const sp = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const airY = findCavernCeilingAirY(terrain, sp.x);
    if (airY > 0) {
      return { x: sp.x, y: airY };
    }
    return { x: sp.x, y: Math.max(25, sp.y - 80) };
  }

  return { x: Math.round(width / 2), y: 35 };
}

export function spawnSupplyCrateOfType(
  state: GameState,
  type: SupplyCrate['crateType'],
  terrainOrWidth: number | DestructibleTerrain,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (!state.supplyCrates) state.supplyCrates = [];
  if (state.supplyCrates.length >= MAX_SUPPLY_CRATES_ON_MAP) return false;

  const content =
    type === 'health'
      ? pickHealthCrateContent()
      : type === 'weapon'
      ? pickWeaponCrateContent()
      : pickUtilityCrateContent();

  const coords = findCrateSpawnCoords(terrainOrWidth);
  const newCrate: SupplyCrate = {
    id: `crate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    x: coords.x,
    y: coords.y,
    vy: 2.2,
    isLanded: false,
    ...content,
  };

  state.supplyCrates.push(newCrate);
  sfx.play('airdrop');
  if (addLog) {
    const label = content.crateType === 'health' ? 'de Soin (+50 PV)' : content.crateType === 'weapon' ? "d'Armes" : "d'Utilitaires";
    addLog(`🪂 Une Caisse ${label} est parachutée sur le champ de bataille !`, 'info');
  }
  return true;
}

export function spawnTurnSupplyCrate(
  state: GameState,
  terrainOrWidth: number | DestructibleTerrain,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  return spawnSupplyCrateOfType(state, 'weapon', terrainOrWidth, addLog);
}

export function processTurnSupplyDrops(
  state: GameState,
  terrainOrWidth: number | DestructibleTerrain,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): number {
  if (!state.supplyCrates) state.supplyCrates = [];
  if (state.supplyCrates.length >= MAX_SUPPLY_CRATES_ON_MAP) return 0;

  // 4ème dé maître : 50% de chance de déclencher la session de tirage de caisses ce tour-ci
  if (Math.random() >= GLOBAL_CRATE_DROP_CHANCE) {
    return 0;
  }

  let spawnedCount = 0;

  // 1. Independent roll for Weapon crate (~55%)
  if (Math.random() < CRATE_DROP_RATES.WEAPON) {
    if (spawnSupplyCrateOfType(state, 'weapon', terrainOrWidth, addLog)) {
      spawnedCount++;
    }
  }

  // 2. Independent roll for Utility crate (~25%)
  if (Math.random() < CRATE_DROP_RATES.UTILITY) {
    if (spawnSupplyCrateOfType(state, 'utility', terrainOrWidth, addLog)) {
      spawnedCount++;
    }
  }

  // 3. Independent roll for Health crate (~15%)
  if (Math.random() < CRATE_DROP_RATES.HEALTH) {
    if (spawnSupplyCrateOfType(state, 'health', terrainOrWidth, addLog)) {
      spawnedCount++;
    }
  }

  return spawnedCount;
}

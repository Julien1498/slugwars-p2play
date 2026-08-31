import { GameState, SupplyCrate, JournalEntry } from '../types';
import { getAllWeapons } from '../weapons/registry';
import { sfx } from '../audio';

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

export function spawnSupplyCrateOfType(
  state: GameState,
  type: SupplyCrate['crateType'],
  terrainWidth: number,
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

  const spawnX = Math.round(80 + Math.random() * (terrainWidth - 160));
  const newCrate: SupplyCrate = {
    id: `crate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    x: spawnX,
    y: -30,
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
  terrainWidth: number,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  return spawnSupplyCrateOfType(state, 'weapon', terrainWidth, addLog);
}

export function processTurnSupplyDrops(
  state: GameState,
  terrainWidth: number,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): number {
  if (!state.supplyCrates) state.supplyCrates = [];
  let spawnedCount = 0;

  // 1. Independent roll for Weapon crate (~55%)
  if (Math.random() < CRATE_DROP_RATES.WEAPON) {
    if (spawnSupplyCrateOfType(state, 'weapon', terrainWidth, addLog)) {
      spawnedCount++;
    }
  }

  // 2. Independent roll for Utility crate (~25%)
  if (Math.random() < CRATE_DROP_RATES.UTILITY) {
    if (spawnSupplyCrateOfType(state, 'utility', terrainWidth, addLog)) {
      spawnedCount++;
    }
  }

  // 3. Independent roll for Health crate (~15%)
  if (Math.random() < CRATE_DROP_RATES.HEALTH) {
    if (spawnSupplyCrateOfType(state, 'health', terrainWidth, addLog)) {
      spawnedCount++;
    }
  }

  return spawnedCount;
}

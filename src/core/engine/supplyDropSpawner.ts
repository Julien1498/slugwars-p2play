import { GameState, SupplyCrate, JournalEntry } from '../types';
import { getAllWeapons } from '../weapons/registry';
import { sfx } from '../audio';

export function pickRandomCrateContent(): {
  crateType: SupplyCrate['crateType'];
  healAmount?: number;
  weaponId?: string;
  weaponCount?: number;
} {
  const roll = Math.random();
  // 40% Health, 40% Weapons, 20% Utilities
  if (roll < 0.4) {
    return { crateType: 'health', healAmount: 50 };
  } else if (roll < 0.8) {
    const candidates = getAllWeapons().filter(
      (w) => (w.crateProbability ?? 0) > 0 && w.category !== 'UTILITY'
    );
    if (candidates.length === 0) return { crateType: 'health', healAmount: 50 };

    // Weighted random selection based on crateProbability
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
  } else {
    const utilityIds = ['girder', 'teleport', 'blowtorch', 'ninja_rope'];
    const chosenId = utilityIds[Math.floor(Math.random() * utilityIds.length)];
    return { crateType: 'utility', weaponId: chosenId, weaponCount: 1 };
  }
}

export function spawnTurnSupplyCrate(
  state: GameState,
  terrainWidth: number,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (!state.supplyCrates) state.supplyCrates = [];
  if (state.supplyCrates.length >= 4) return false;

  const content = pickRandomCrateContent();
  const spawnX = Math.round(80 + Math.random() * (terrainWidth - 160));
  const newCrate: SupplyCrate = {
    id: `crate_${Date.now()}_${Math.random()}`,
    x: spawnX,
    y: -30,
    vy: 2.2,
    isLanded: false,
    ...content,
  };

  state.supplyCrates.push(newCrate);
  sfx.play('airdrop');
  if (addLog) {
    const label = content.crateType === 'health' ? 'de Soin' : content.crateType === 'weapon' ? "d'Armes" : "d'Utilitaires";
    addLog(`🪂 Une Caisse ${label} est parachutée sur le champ de bataille !`, 'info');
  }
  return true;
}

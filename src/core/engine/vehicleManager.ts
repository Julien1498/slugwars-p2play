import { GameState, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { updateHelicopterPhysics, applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';

export function enterVehicle(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): boolean {
  if (state.phase !== 'AIMING') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive || activeSlug.inVehicleId) return false;

  const nearbyHeli = state.helicopters.find(
    (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
  );

  if (nearbyHeli) {
    nearbyHeli.pilotSlugId = activeSlug.id;
    activeSlug.inVehicleId = nearbyHeli.id;
    sfx.play('teleport');
    addLog(`${activeSlug.name} s'est installé aux commandes de l'hélicoptère ! 🚁`, 'info');
    return true;
  }
  return false;
}

export function exitVehicle(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): boolean {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.inVehicleId) return false;

  const heli = state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
  if (heli) {
    heli.pilotSlugId = null;
    activeSlug.inVehicleId = null;
    activeSlug.x = heli.x + (heli.facing === 'right' ? 25 : -25);
    activeSlug.y = heli.y - 10;
    activeSlug.vy = -4;
    addLog(`${activeSlug.name} est sorti de l'hélicoptère.`, 'info');
    return true;
  }
  return false;
}

export function steerVehicle(state: GameState, dir: 'left' | 'right' | 'up' | 'down'): void {
  if (state.phase !== 'AIMING' && state.phase !== 'TURN_TIME' && state.phase !== 'RETREAT') return;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.inVehicleId) return;

  const heli = state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
  if (!heli) return;

  if (dir === 'left') {
    heli.vx = -4.5;
    heli.facing = 'left';
  } else if (dir === 'right') {
    heli.vx = 4.5;
    heli.facing = 'right';
  } else if (dir === 'up') {
    if (heli.y > 30) {
      heli.vy = -4.8;
    }
  } else if (dir === 'down') {
    heli.vy = 3.5;
  }
}

export function updateHelicopters(
  state: GameState,
  terrain: DestructibleTerrain,
  addLog: (msg: string, type?: JournalEntry['type']) => void
) {
  const effectiveWaterY = state.waterLevel ?? terrain.data.waterLevel;
  if (!state.helicopters || state.helicopters.length === 0) return;

  for (const heli of state.helicopters) {
    const pilot = state.slugs.find((s) => s.id === heli.pilotSlugId);
    const res = updateHelicopterPhysics(heli, terrain, pilot);

    if (res.crashed || heli.hp <= 0) {
      state.explosions.push({
        id: `ex_heli_${Date.now()}_${Math.random()}`,
        x: heli.x,
        y: heli.y,
        radius: 55,
        damage: 45,
        createdAt: Date.now(),
      });
      if (pilot) {
        pilot.inVehicleId = null;
        pilot.hp = Math.max(0, pilot.hp - 35);
        pilot.vy = -8;
      }
      applyExplosionToSlugs(heli.x, heli.y, 55, 45, state.slugs, terrain, state.teams, heli.pilotSlugId || undefined);
      addLog(`💥 L'hélicoptère s'est crashé et a explosé !`, 'combat');
      heli.hp = 0;
    }
  }
  state.helicopters = state.helicopters.filter((h) => h.hp > 0 && h.y < effectiveWaterY);
}

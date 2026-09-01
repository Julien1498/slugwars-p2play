import { GameState, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { updateHelicopterPhysics, applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';

export function enterVehicle(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): boolean {
  if (state.phase !== 'AIMING') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive || activeSlug.inVehicleId) return false;

  // Clean up any stale or dead pilot associations first
  for (const h of state.helicopters) {
    if (h.pilotSlugId) {
      const p = state.slugs.find((s) => s.id === h.pilotSlugId);
      if (!p || !p.isAlive || p.hp <= 0) {
        h.pilotSlugId = null;
      }
    }
  }

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

export function exitVehicle(
  state: GameState,
  addLog: (msg: string, type?: JournalEntry['type']) => void,
  terrain?: DestructibleTerrain
): boolean {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.inVehicleId) return false;

  const heli = state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
  if (heli) {
    heli.pilotSlugId = null;
    activeSlug.inVehicleId = null;

    // Search for a safe candidate exit position around the helicopter that is not inside solid terrain
    let exitX = heli.x + (heli.facing === 'right' ? 26 : -26);
    let exitY = heli.y - 8;

    if (terrain) {
      const candidates = [
        { x: heli.x + (heli.facing === 'right' ? 26 : -26), y: heli.y - 8 },
        { x: heli.x + (heli.facing === 'right' ? -26 : 26), y: heli.y - 8 },
        { x: heli.x, y: heli.y + 16 },
        { x: heli.x, y: heli.y - 20 },
        { x: heli.x, y: heli.y },
      ];

      let foundSafe = false;
      for (const cand of candidates) {
        const cx = Math.floor(cand.x);
        const cy = Math.floor(cand.y);
        const isFree =
          !terrain.isSolid(cx, cy) &&
          !terrain.isSolid(cx, cy - 8) &&
          !terrain.isSolid(cx - 5, cy) &&
          !terrain.isSolid(cx + 5, cy);

        if (isFree) {
          exitX = cand.x;
          exitY = cand.y;
          foundSafe = true;
          break;
        }
      }

      // If all candidate offsets touch rock, search in expanding circles for nearest air pixel
      if (!foundSafe) {
        for (let r = 8; r <= 96; r += 4) {
          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const testX = Math.floor(heli.x + Math.cos(angle) * r);
            const testY = Math.floor(heli.y + Math.sin(angle) * r);
            if (!terrain.isSolid(testX, testY)) {
              exitX = testX;
              exitY = testY;
              foundSafe = true;
              break;
            }
          }
          if (foundSafe) break;
        }
      }

      if (!foundSafe) {
        exitX = heli.x;
        exitY = heli.y;
      }
    }

    activeSlug.x = exitX;
    activeSlug.y = exitY;
    activeSlug.vy = -3.5;
    activeSlug.fallStartY = exitY;
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
    let pilot = state.slugs.find((s) => s.id === heli.pilotSlugId);

    // If pilot slug died, was eliminated, or drowned, immediately free the helicopter!
    if (heli.pilotSlugId && (!pilot || !pilot.isAlive || pilot.hp <= 0)) {
      heli.pilotSlugId = null;
      if (pilot) {
        pilot.inVehicleId = null;
      }
      pilot = undefined;
    }

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
      applyExplosionToSlugs(
        heli.x,
        heli.y,
        55,
        45,
        state.slugs,
        terrain,
        state.teams,
        heli.pilotSlugId || undefined,
        state.helicopters.filter((h) => h.id !== heli.id)
      );
      addLog(`💥 L'hélicoptère s'est crashé et a explosé !`, 'combat');
      heli.hp = 0;
    }
  }
  state.helicopters = state.helicopters.filter((h) => h.hp > 0 && h.y < effectiveWaterY);
}

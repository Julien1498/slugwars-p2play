import { GameState, Slug, Vector2D, JournalEntry } from './types';
import { DestructibleTerrain } from './terrain';
import { updateHelicopterPhysics } from './physics';
import { sfx } from './audio';

export class VehicleManager {
  public static spawnHelicopters(state: GameState, terrain: DestructibleTerrain): void {
    if (!state.config.vehiclesEnabled) {
      state.helicopters = [];
      return;
    }

    const { width, theme, waterLevel } = terrain.data;
    let spawnX = Math.floor(width * 0.5);
    let spawnY = 150;
    let foundGround = false;

    const scanStartY = theme === 'CAVERN' ? 70 : 20;
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
        id: `heli_1`,
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
  }

  public static enterVehicle(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): boolean {
    if (state.phase !== 'AIMING' && state.phase !== 'TURN_TIME') return false;
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

  public static exitVehicle(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): boolean {
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

  public static steerVehicle(state: GameState, dir: 'left' | 'right' | 'up' | 'down'): void {
    if (state.phase !== 'AIMING' && state.phase !== 'TURN_TIME') return;
    const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
    if (!activeSlug || !activeSlug.inVehicleId) return;

    const heli = state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
    if (!heli) return;

    const speed = 4.5;
    if (dir === 'left') {
      heli.vx = -speed;
      heli.facing = 'left';
    } else if (dir === 'right') {
      heli.vx = speed;
      heli.facing = 'right';
    } else if (dir === 'up') {
      heli.vy = -speed;
    } else if (dir === 'down') {
      heli.vy = speed;
    }
  }

  public static updateHelicopters(state: GameState, terrain: DestructibleTerrain, addLog: (msg: string, type?: JournalEntry['type']) => void): void {
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
        addLog(`💥 L'hélicoptère s'est crashé et a explosé !`, 'combat');
        heli.hp = 0;
      }
    }
    state.helicopters = state.helicopters.filter((h) => h.hp > 0 && h.y < terrain.data.waterLevel);
  }
}

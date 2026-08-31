import { GameState, Slug } from '../types';
import { DestructibleTerrain } from '../terrain';
import { sfx } from '../audio';

export function updateJetpackTick(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
) {
  if (!activeSlug.jetpackState) return;
  if (activeSlug.jetpackState.fuelMs <= 0) {
    activeSlug.jetpackState = null;
    addLog("Le Jetpack n'a plus de carburant ! 🪫", 'info');
    sfx.play('bounce');
    return;
  }

  if (activeSlug.jetpackState.isThrusting) {
    activeSlug.jetpackState.fuelMs = Math.max(0, activeSlug.jetpackState.fuelMs - 50);
    if (activeSlug.jetpackState.fuelMs <= 0) {
      activeSlug.jetpackState = null;
      addLog("Le Jetpack n'a plus de carburant ! 🪫", 'info');
      sfx.play('bounce');
      return;
    }

    activeSlug.vy = Math.max(-5.5, activeSlug.vy - 0.75);

    if (activeSlug.steeringDir === 'left' || activeSlug.movingDir === 'left') {
      activeSlug.vx = Math.max(-4.2, activeSlug.vx - 0.45);
      activeSlug.facing = 'left';
    } else if (activeSlug.steeringDir === 'right' || activeSlug.movingDir === 'right') {
      activeSlug.vx = Math.min(4.2, activeSlug.vx + 0.45);
      activeSlug.facing = 'right';
    }

    if (state.particles.length < 50) {
      state.particles.push({
        x: activeSlug.x + (activeSlug.facing === 'left' ? 4 : -4),
        y: activeSlug.y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 3 + 2,
        color: Math.random() > 0.4 ? '#f97316' : '#fbbf24',
        size: Math.random() * 3 + 2,
        life: 0.7,
      });
    }
  }
}

export function updateDrillTick(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  carveCrater: (x: number, y: number, r: number) => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
) {
  if (!activeSlug.isDrilling) return;
  if (activeSlug.drillDepth === undefined) activeSlug.drillDepth = 0;

  const drillY = activeSlug.y + 10;
  carveCrater(activeSlug.x, drillY, 14);
  activeSlug.y += 2.2;
  activeSlug.vy = 0;
  activeSlug.drillDepth += 2.2;

  if (state.particles.length < 50) {
    state.particles.push({
      x: activeSlug.x + (Math.random() - 0.5) * 12,
      y: activeSlug.y + 6,
      vx: (Math.random() - 0.5) * 4,
      vy: -Math.random() * 3 - 1,
      color: Math.random() > 0.5 ? '#713f12' : '#a1a1aa',
      size: Math.random() * 3 + 2,
      life: 0.6,
    });
  }

  // Hit slugs caught underneath the drill
  for (const other of state.slugs) {
    if (other.id !== activeSlug.id && other.isAlive && Math.hypot(other.x - activeSlug.x, other.y - drillY) < 18) {
      other.hp = Math.max(0, other.hp - 20);
      other.vy = 3;
      addLog(`🔨 Le marteau-piqueur a écrasé ${other.name} (-20 HP) !`, 'combat');
      sfx.play('ouch');
    }
  }

  const curWaterY = state.waterLevel ?? terrain.data.waterLevel;
  if (activeSlug.drillDepth >= 180 || activeSlug.y >= curWaterY || (activeSlug.drillDepth > 20 && !terrain.isSolid(activeSlug.x, activeSlug.y + 26))) {
    activeSlug.isDrilling = false;
    activeSlug.drillDepth = 0;
  }
}

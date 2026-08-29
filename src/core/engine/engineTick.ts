import { GameState, JournalEntry, Vector2D } from '../types';
import { DestructibleTerrain } from '../terrain';
import { PhaseManager } from './phaseManager';
import { updateSlugsPhysicsAndDrowning, updateSlugRopeAndCharge, updateBlowtorchTick } from './engineTickSlugs';
import { updateProjectilesInTick, cleanupExpiredVFX } from './engineTickProjectiles';
import { updateHelicopters } from './vehicleManager';
import { updateMines, updateSupplyCrates } from './supplyDropManager';

export interface EngineTickCallbacks {
  addLog: (msg: string, type: JournalEntry['type']) => void;
  carveCrater: (x: number, y: number, r: number) => void;
  moveSlug: (dir: 'left' | 'right') => boolean;
  fireWeapon: (targetPoint?: Vector2D) => boolean;
  steerSheep: (dir: 'left' | 'right') => boolean;
  endTurn: () => void;
}

export function executeEngineTick(
  state: GameState,
  terrain: DestructibleTerrain,
  callbacks: EngineTickCallbacks
): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  const activeSlugHpBefore = activeSlug && activeSlug.isAlive ? activeSlug.hp : 0;

  // 1. Slugs physics & water drowning
  const effectiveWaterY = state.waterLevel ?? terrain.data.waterLevel;
  updateSlugsPhysicsAndDrowning(
    state,
    terrain,
    (msg, type) => callbacks.addLog(msg, type),
    effectiveWaterY
  );

  // 2. Active slug death interruption
  if (
    activeSlug &&
    !activeSlug.isAlive &&
    (state.phase === 'AIMING' || state.phase === 'PROJECTILE_ACTIVE' || state.phase === 'RETREAT')
  ) {
    PhaseManager.startResolving(state, { settleTimer: 1.2, phaseTimeout: 30.0 });
  }

  // 3. Ninja rope & power charging
  if (
    activeSlug &&
    activeSlug.isAlive &&
    (state.phase === 'AIMING' || state.phase === 'TURN_TIME' || state.phase === 'RETREAT')
  ) {
    updateSlugRopeAndCharge(
      state,
      terrain,
      activeSlug,
      (dir) => callbacks.moveSlug(dir),
      (tp) => callbacks.fireWeapon(tp),
      (msg, type) => callbacks.addLog(msg, type)
    );
  }

  // 4. Blowtorch tunneling
  if (activeSlug && activeSlug.isAlive && activeSlug.isBlowtorching) {
    updateBlowtorchTick(
      state,
      terrain,
      activeSlug,
      (x, y, r) => callbacks.carveCrater(x, y, r),
      (msg, type) => callbacks.addLog(msg, type)
    );
  }

  // 5. Super sheep steer
  const activeSheep = state.projectiles.find((p) => p.weaponId === 'super_sheep');
  if (activeSheep && activeSlug && activeSlug.steeringDir) {
    callbacks.steerSheep(activeSlug.steeringDir);
  }

  // 6. Helicopter physics
  updateHelicopters(state, terrain, (msg, type) => callbacks.addLog(msg, type));

  // 7. Active slug took damage during aiming -> interrupt turn immediately
  if (
    activeSlug &&
    activeSlug.isAlive &&
    activeSlug.hp < activeSlugHpBefore &&
    state.phase === 'AIMING'
  ) {
    PhaseManager.startResolving(state, {
      settleTimer: 1.2,
      phaseTimeout: 30.0,
      reason: `⚡ ${activeSlug.name} a pris des dégâts ! Fin du tour !`,
      addLog: (msg, type) => callbacks.addLog(msg, type),
    });
    return;
  }

  // 8. Projectiles simulation
  updateProjectilesInTick(
    state,
    terrain,
    (x, y, r) => callbacks.carveCrater(x, y, r),
    (msg, type) => callbacks.addLog(msg, type)
  );

  // 9. Mines & supply drops
  updateMines(
    state,
    terrain,
    (x, y, r) => callbacks.carveCrater(x, y, r),
    (msg, type) => callbacks.addLog(msg, type)
  );
  updateSupplyCrates(state, terrain, (msg, type) => callbacks.addLog(msg, type));

  // 10. Expired VFX cleanup
  cleanupExpiredVFX(state, Date.now());

  // 11. Phase machine tick
  PhaseManager.updatePhaseTick(state, terrain, 0.05, {
    addLog: (msg, type) => callbacks.addLog(msg, type),
    advanceToNextTurn: () => callbacks.endTurn(),
  });
}

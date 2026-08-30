import { GameState, Slug, Vector2D, JournalEntry } from '../../types';
import { WeaponDefinition } from '../../weapons/types';
import { sfx } from '../../audio';
import { PhaseManager } from '../phaseManager';

export function fireBallisticProjectiles(
  state: GameState,
  activeSlug: Slug,
  weapon: WeaponDefinition,
  effectiveTargetPoint: Vector2D,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  const customFuseMs = activeSlug.fuseTimerSec
    ? activeSlug.fuseTimerSec * 1000
    : (weapon.fuseTimeMs ?? 3000);

  const projs = weapon.createProjectiles({
    originX: activeSlug.x + (activeSlug.facing === 'right' ? 10 : -10),
    originY: activeSlug.y - 10,
    angleDeg: activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle,
    power: activeSlug.aimPower,
    ownerSlugId: activeSlug.id,
    targetPoint: effectiveTargetPoint,
    fuseTimerMs: customFuseMs,
  });

  state.projectiles.push(...projs);

  // Apply backward physical recoil kick to shooter if defined on weapon
  if (weapon.shooterRecoil) {
    const dirX = activeSlug.facing === 'right' ? 1 : -1;
    activeSlug.vx -= dirX * weapon.shooterRecoil.pushForce;
    if (weapon.shooterRecoil.popUp !== undefined) {
      activeSlug.vy = Math.min(activeSlug.vy, weapon.shooterRecoil.popUp);
    }
  }

  if (weapon.triggersRetreat || weapon.behavior === 'BOUNCING_TIMER') {
    PhaseManager.startRetreat(state, 4.0, addLog);
  } else {
    PhaseManager.startProjectileActive(state);
  }

  if (weapon.customSoundKey) {
    const snd = weapon.customSoundKey === 'sheep_baah' ? 'baah' : weapon.customSoundKey;
    sfx.play(snd as any);
  } else {
    sfx.play('fire');
  }

  addLog(
    `${activeSlug.name} a tiré avec ${weapon.name} ! (Puissance: ${Math.round(activeSlug.aimPower)}%)`,
    'weapon'
  );
  return true;
}

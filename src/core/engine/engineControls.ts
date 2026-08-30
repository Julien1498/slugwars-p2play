import { GameState, Vector2D } from '../types';
import { DestructibleTerrain } from '../terrain';
import { getWeapon, isWeaponChargeable } from '../weapons/registry';
import { isSlugGrounded, applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';

export function startMove(state: GameState, dir: 'left' | 'right'): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug) {
    activeSlug.movingDir = dir;
    activeSlug.vx = dir === 'left' ? -2.4 : 2.4;
    activeSlug.facing = dir;
  }
}

export function stopMove(state: GameState): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug) {
    activeSlug.movingDir = null;
    activeSlug.vx = 0;
  }
}

export function moveSlug(state: GameState, dir: 'left' | 'right'): boolean {
  if (state.phase !== 'AIMING' && state.phase !== 'TURN_TIME' && state.phase !== 'RETREAT') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive) return false;

  const speed = 2.4;
  if (dir === 'left') {
    activeSlug.vx = -speed;
    activeSlug.facing = 'left';
  } else {
    activeSlug.vx = speed;
    activeSlug.facing = 'right';
  }
  return true;
}

export function jumpSlug(state: GameState, terrain: DestructibleTerrain): boolean {
  if (state.phase !== 'AIMING' && state.phase !== 'TURN_TIME' && state.phase !== 'RETREAT') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive) return false;

  if (activeSlug.ropeState) {
    const rope = activeSlug.ropeState;
    activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity * 1.25;
    activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity * 1.25 - 2;
    activeSlug.ropeState = null;
    sfx.play('jump');
    return true;
  }

  if (isSlugGrounded(activeSlug, terrain, state.slugs)) {
    activeSlug.vy = -7.5;
    activeSlug.vx += activeSlug.facing === 'right' ? 2 : -2;
    sfx.play('jump');
    return true;
  }
  return false;
}

export function startCharge(
  state: GameState,
  targetPoint?: Vector2D,
  fireWeaponCallback?: (tp?: Vector2D) => void
): void {
  if (state.phase !== 'AIMING') return;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug && activeSlug.isAlive) {
    const weapon = getWeapon(activeSlug.selectedWeaponId);
    if (!isWeaponChargeable(weapon)) {
      if (fireWeaponCallback) fireWeaponCallback(targetPoint);
      return;
    }
    activeSlug.isChargingPower = true;
    activeSlug.aimPower = 5;
    if (targetPoint) {
      activeSlug.currentTargetPoint = targetPoint;
    }
  }
}

export function releaseCharge(
  state: GameState,
  targetPoint?: Vector2D,
  fireWeaponCallback?: (tp?: Vector2D) => void
): void {
  if (state.phase !== 'AIMING') return;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug && activeSlug.isAlive) {
    if (activeSlug.isBlowtorching) {
      activeSlug.isBlowtorching = false;
      return;
    }
    if (activeSlug.isChargingPower) {
      activeSlug.isChargingPower = false;
      if (fireWeaponCallback) fireWeaponCallback(targetPoint);
    }
  }
}

export function startSteer(state: GameState, dir: 'left' | 'right'): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug) activeSlug.steeringDir = dir;
}

export function stopSteer(state: GameState): void {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug) activeSlug.steeringDir = null;
}

export function steerSheep(state: GameState, dir: 'left' | 'right'): boolean {
  const sheep = state.projectiles.find((p) => p.weaponId === 'super_sheep');
  if (!sheep) return false;

  const angleDelta = (dir === 'left' ? -14 : 14) * (Math.PI / 180);
  const currentAngle = Math.atan2(sheep.vy, sheep.vx);
  const newAngle = currentAngle + angleDelta;
  const speed = Math.hypot(sheep.vx, sheep.vy) || 7.5;

  sheep.vx = Math.cos(newAngle) * speed;
  sheep.vy = Math.sin(newAngle) * speed;
  return true;
}

export function detonateSheep(
  state: GameState,
  terrain: DestructibleTerrain,
  carveCrater: (x: number, y: number, r: number) => void
): boolean {
  const sheepIdx = state.projectiles.findIndex((p) => p.weaponId === 'super_sheep');
  if (sheepIdx === -1) return false;

  const sheep = state.projectiles[sheepIdx];
  state.projectiles.splice(sheepIdx, 1);

  const weapon = getWeapon('super_sheep');
  carveCrater(sheep.x, sheep.y, weapon.radius);
  state.explosions.push({
    id: `ex_${Date.now()}_${Math.random()}`,
    x: sheep.x,
    y: sheep.y,
    radius: weapon.radius,
    damage: weapon.damage,
    customSound: weapon.customSoundKey,
    createdAt: Date.now(),
  });

  applyExplosionToSlugs(sheep.x, sheep.y, weapon.radius, weapon.damage, state.slugs, terrain, state.teams, sheep.ownerSlugId);
  state.phase = 'RESOLVING';
  state.phaseTimer = 5.0;
  state.settleTimer = 1.2;
  return true;
}

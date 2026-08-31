import { Slug, Vector2D } from '../core/types';
import { getWeapon } from '../core/weapons/registry';
import { DestructibleTerrain } from '../core/terrain';
import { renderClassicReticle } from './aimGuides/renderClassicReticle';
import { renderNinjaRopeGuide } from './aimGuides/renderNinjaRopeGuide';
import { renderGirderGhost } from './aimGuides/renderGirderGhost';
import { renderPowerChargingBar } from './aimGuides/renderPowerChargingBar';
import { renderTacticalReticle } from './aimGuides/renderTacticalReticle';

export interface AimGuidesContext {
  ctx: CanvasRenderingContext2D;
  activeSlug: Slug;
  isMyTurn: boolean;
  terrain: DestructibleTerrain;
  mousePos: Vector2D;
  lockedTarget: Vector2D | null;
  animTime: number;
}

export function renderAimGuides(rc: AimGuidesContext) {
  const { ctx, activeSlug, isMyTurn, terrain, mousePos, lockedTarget, animTime } = rc;

  const weapon = getWeapon(activeSlug.selectedWeaponId);
  const rad = (activeSlug.aimAngle * Math.PI) / 180;
  const dir = activeSlug.facing === 'right' ? 1 : -1;
  const originX = activeSlug.x + dir * 10;
  const originY = activeSlug.y - 10;

  // 1. Classic Animated Reticle (Bazooka, Grenades, Homing Missile launch angle)
  const showsClassicReticle = !weapon.hideReticle && (!weapon.requiresTarget || weapon.id === 'homing_missile');
  if (isMyTurn && showsClassicReticle) {
    renderClassicReticle(ctx, activeSlug, weapon, originX, originY, rad, dir, animTime);
  }

  // 2. Ninja Rope Guide
  if (isMyTurn && weapon.id === 'ninja_rope') {
    renderNinjaRopeGuide(ctx, terrain, originX, originY, rad, dir);
  }

  // 3. Girder Placement Hologram Ghost
  if (isMyTurn && weapon.id === 'girder') {
    renderGirderGhost(ctx, activeSlug, mousePos, lockedTarget);
  }

  // 4. Power Charging Bar
  if (activeSlug.isChargingPower) {
    renderPowerChargingBar(ctx, activeSlug);
  }

  // 5. Tactical Target Reticle (Air strike, homing target, donkey target)
  if (isMyTurn && weapon.requiresTarget) {
    renderTacticalReticle(ctx, activeSlug, mousePos, lockedTarget, animTime);
  }
}

import {
  WEAPON_BAT_PATH,
  WEAPON_BANANA_PATH,
  WEAPON_GRENADE_PATH,
  WEAPON_GRENADE_GRID_PATH,
  WEAPON_PIGEON_BODY_PATH,
  WEAPON_PIGEON_BEAK_PATH,
  WEAPON_BAZOOKA_ROCKET_NOSE_PATH,
  WEAPON_HOLY_GRENADE_PATH,
} from './slugWeaponPaths';
import {
  HELD_WEAPON_DRAWERS,
  drawDefaultGenericWeapon,
  HeldWeaponDrawer,
} from './slugWeaponDrawers';

export {
  WEAPON_BAT_PATH,
  WEAPON_BANANA_PATH,
  WEAPON_GRENADE_PATH,
  WEAPON_GRENADE_GRID_PATH,
  WEAPON_PIGEON_BODY_PATH,
  WEAPON_PIGEON_BEAK_PATH,
  WEAPON_BAZOOKA_ROCKET_NOSE_PATH,
  WEAPON_HOLY_GRENADE_PATH,
  HELD_WEAPON_DRAWERS,
};

export type { HeldWeaponDrawer };

export function renderHeldWeapon(
  ctx: CanvasRenderingContext2D,
  weaponId: string,
  aimRad: number,
  animTime: number
) {
  ctx.save();
  ctx.translate(5, -4);
  ctx.rotate(-aimRad);

  const drawer = HELD_WEAPON_DRAWERS[weaponId] || drawDefaultGenericWeapon;
  drawer(ctx, animTime);

  ctx.restore();
}

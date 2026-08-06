import { WeaponId, WeaponDefinition, WeaponCategory } from './types';
import { bazookaWeapon, grenadeWeapon, holyGrenadeWeapon, bananaBombWeapon, dynamiteWeapon } from './definitions/explosiveWeapons';
import { concreteDonkeyWeapon, superSheepWeapon } from './definitions/wackyWeapons';
import { baseballBatWeapon, airStrikeWeapon, teleportWeapon, shotgunWeapon, homingPigeonWeapon, prodWeapon } from './definitions/tacticalWeapons';

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDefinition> = {
  bazooka: bazookaWeapon,
  grenade: grenadeWeapon,
  holy_grenade: holyGrenadeWeapon,
  banana_bomb: bananaBombWeapon,
  dynamite: dynamiteWeapon,
  shotgun: shotgunWeapon,
  homing_pigeon: homingPigeonWeapon,
  prod: prodWeapon,
  baseball_bat: baseballBatWeapon,
  air_strike: airStrikeWeapon,
  concrete_donkey: concreteDonkeyWeapon,
  super_sheep: superSheepWeapon,
  teleport: teleportWeapon,
};

export function getWeapon(id: string): WeaponDefinition {
  return WEAPON_REGISTRY[id as WeaponId] || bazookaWeapon;
}

export function getAllWeapons(): WeaponDefinition[] {
  return Object.values(WEAPON_REGISTRY);
}

export function getWeaponsByCategory(category: WeaponCategory): WeaponDefinition[] {
  return getAllWeapons().filter((w) => w.category === category);
}

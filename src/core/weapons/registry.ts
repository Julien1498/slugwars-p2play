import { WeaponId, WeaponDefinition, WeaponCategory } from './types';
import { bazookaWeapon, homingMissileWeapon, grenadeWeapon, holyGrenadeWeapon, bananaBombWeapon, clusterBananaWeapon, dynamiteWeapon } from './definitions/explosiveWeapons';
import { concreteDonkeyWeapon, superSheepWeapon } from './definitions/wackyWeapons';
import { baseballBatWeapon, airStrikeWeapon, teleportWeapon, shotgunWeapon, homingPigeonWeapon, prodWeapon, blowtorchWeapon } from './definitions/tacticalWeapons';

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDefinition> = {
  bazooka: bazookaWeapon,
  homing_missile: homingMissileWeapon,
  grenade: grenadeWeapon,
  holy_grenade: holyGrenadeWeapon,
  banana_bomb: bananaBombWeapon,
  cluster_banana: clusterBananaWeapon,
  dynamite: dynamiteWeapon,
  shotgun: shotgunWeapon,
  homing_pigeon: homingPigeonWeapon,
  prod: prodWeapon,
  baseball_bat: baseballBatWeapon,
  air_strike: airStrikeWeapon,
  concrete_donkey: concreteDonkeyWeapon,
  super_sheep: superSheepWeapon,
  blowtorch: blowtorchWeapon,
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

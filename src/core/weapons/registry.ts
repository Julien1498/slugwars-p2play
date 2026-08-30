import { WeaponId, WeaponDefinition, WeaponCategory } from './types';
import { bazookaWeapon, homingMissileWeapon, grenadeWeapon, holyGrenadeWeapon, bananaBombWeapon, clusterBananaWeapon, dynamiteWeapon } from './definitions/explosiveWeapons';
import { clusterBombWeapon, clusterFragmentWeapon } from './definitions/clusterWeapons';
import { concreteDonkeyWeapon, superSheepWeapon } from './definitions/wackyWeapons';
import { baseballBatWeapon, airStrikeWeapon, teleportWeapon, shotgunWeapon, homingPigeonWeapon, prodWeapon, blowtorchWeapon } from './definitions/tacticalWeapons';
import { handgunWeapon, uziWeapon } from './definitions/bulletWeapons';
import { ninjaRopeWeapon, girderWeapon, airdropWeapon, skipTurnWeapon } from './definitions/utilityWeapons';
import { sheepWeapon, oldLadyWeapon, armageddonWeapon, meteorWeapon } from './definitions/mythicWeapons';

export const WEAPON_REGISTRY: Record<WeaponId, WeaponDefinition> = {
  bazooka: bazookaWeapon,
  homing_missile: homingMissileWeapon,
  grenade: grenadeWeapon,
  cluster_bomb: clusterBombWeapon,
  cluster_fragment: clusterFragmentWeapon,
  holy_grenade: holyGrenadeWeapon,
  banana_bomb: bananaBombWeapon,
  cluster_banana: clusterBananaWeapon,
  dynamite: dynamiteWeapon,
  shotgun: shotgunWeapon,
  handgun: handgunWeapon,
  uzi: uziWeapon,
  homing_pigeon: homingPigeonWeapon,
  prod: prodWeapon,
  baseball_bat: baseballBatWeapon,
  air_strike: airStrikeWeapon,
  concrete_donkey: concreteDonkeyWeapon,
  super_sheep: superSheepWeapon,
  sheep: sheepWeapon,
  old_lady: oldLadyWeapon,
  armageddon: armageddonWeapon,
  meteor: meteorWeapon,
  blowtorch: blowtorchWeapon,
  teleport: teleportWeapon,
  ninja_rope: ninjaRopeWeapon,
  girder: girderWeapon,
  airdrop: airdropWeapon,
  skip_turn: skipTurnWeapon,
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

export function isWeaponChargeable(weaponOrId: WeaponDefinition | string | undefined | null): boolean {
  if (!weaponOrId) return false;
  const weapon = typeof weaponOrId === 'string' ? getWeapon(weaponOrId) : weaponOrId;
  if (!weapon) return false;
  if (weapon.chargeable !== undefined) return weapon.chargeable;
  return weapon.behavior === 'BALLISTIC' || weapon.behavior === 'BOUNCING_TIMER';
}


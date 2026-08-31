import { getAllWeapons } from './registry';

export interface WeaponSetDefinition {
  id: string;
  name: string;
  description: string;
  turnDelaysEnabled?: boolean; // false = all weapons unlocked on turn 1
  inventory: Record<string, number>; // weaponId -> ammo count (-1 = infinite)
}

export const WEAPON_SETS: Record<string, WeaponSetDefinition> = {
  CLASSIC: {
    id: 'CLASSIC',
    name: 'Arsenal Classique',
    description: 'Armes équilibrées et tactiques avec munitions par défaut des armes.',
    turnDelaysEnabled: true,
    inventory: Object.fromEntries(getAllWeapons().map((w) => [w.id, w.defaultAmmo])),
  },
  WMD_CRAZY: {
    id: 'WMD_CRAZY',
    name: 'Arsenal Lourd',
    description: 'Super-armes fournies & gros dégâts',
    turnDelaysEnabled: true,
    inventory: {
      bazooka: -1,
      grenade: 10,
      cluster_bomb: 10,
      banana_bomb: 4,
      dynamite: 5,
      shotgun: 8,
      handgun: 8,
      uzi: 6,
      homing_pigeon: 4,
      prod: -1,
      baseball_bat: -1,
      holy_grenade: 3,
      air_strike: 5,
      bunker_buster: 2,
      mine_strike: 2,
      kamikaze: 2,
      teleport: 5,
      super_sheep: 4,
      concrete_donkey: 2,
      sheep: 4,
      old_lady: 2,
      armageddon: 1,
      blowtorch: 100,
      ninja_rope: -1,
      girder: 5,
      airdrop: 4,
      jetpack: 4,
      pneumatic_drill: 5,
      parachute: -1,
      magnet: 3,
      skip_turn: -1,
    },
  },
  UNLIMITED_CHAOS: {
    id: 'UNLIMITED_CHAOS',
    name: 'Chaos Illimité',
    description: 'Toutes les armes ont des munitions illimitées. Déblocage immédiat & Destruction maximale !',
    turnDelaysEnabled: false,
    inventory: Object.fromEntries(getAllWeapons().map((w) => [w.id, -1])),
  },
};

export const DEFAULT_WEAPON_SET_ID = 'WMD_CRAZY';

export function getWeaponSet(id: string): WeaponSetDefinition {
  return WEAPON_SETS[id] || WEAPON_SETS[DEFAULT_WEAPON_SET_ID];
}

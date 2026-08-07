import { getAllWeapons } from './registry';

export interface WeaponSetDefinition {
  id: string;
  name: string;
  description: string;
  inventory: Record<string, number>; // weaponId -> ammo count (-1 = infinite)
}

export const WEAPON_SETS: Record<string, WeaponSetDefinition> = {
  CLASSIC: {
    id: 'CLASSIC',
    name: 'Arsenal Classique',
    description: 'Armes équilibrées et tactiques avec munitions limitées.',
    inventory: {
      bazooka: -1,
      homing_missile: 3,
      grenade: 5,
      banana_bomb: 2,
      dynamite: 3,
      shotgun: 4,
      homing_pigeon: 2,
      prod: -1,
      baseball_bat: -1,
      holy_grenade: 1,
      air_strike: 2,
      teleport: 3,
      super_sheep: 1,
      concrete_donkey: 1,
      blowtorch: 100,
    },
  },
  WMD_CRAZY: {
    id: 'WMD_CRAZY',
    name: 'Arsenal W.M.D Farfelu',
    description: 'Plein d\'armes loufoques, Sainte Grenade et Âne en Béton débloqués !',
    inventory: {
      bazooka: -1,
      grenade: 10,
      banana_bomb: 4,
      dynamite: 5,
      shotgun: 8,
      homing_pigeon: 4,
      prod: -1,
      baseball_bat: -1,
      holy_grenade: 3,
      air_strike: 5,
      teleport: 5,
      super_sheep: 4,
      concrete_donkey: 2,
      blowtorch: 100,
    },
  },
  UNLIMITED_CHAOS: {
    id: 'UNLIMITED_CHAOS',
    name: 'Chaos Illimité',
    description: 'Toutes les armes ont des munitions illimitées. Destruction maximale !',
    inventory: Object.fromEntries(getAllWeapons().map((w) => [w.id, -1])),
  },
};

export const DEFAULT_WEAPON_SET_ID = 'WMD_CRAZY';

export function getWeaponSet(id: string): WeaponSetDefinition {
  return WEAPON_SETS[id] || WEAPON_SETS[DEFAULT_WEAPON_SET_ID];
}

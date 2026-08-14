import { WeaponDefinition } from '../types';
import { ActiveProjectile } from '../../types';

export const ninjaRopeWeapon: WeaponDefinition = {
  id: 'ninja_rope',
  name: 'Corde Ninja',
  category: 'UTILITY',
  behavior: 'NINJA_ROPE',
  icon: '🪢',
  description: 'Tirez un grappin pour vous balancer à travers la carte, grimper et larguer des armes en vol.',
  damage: 0,
  radius: 0,
  defaultAmmo: -1,
  windAffected: false,
  bounces: false,
  craftable: false,
  customSoundKey: 'rope_shoot',
  createProjectiles: () => [],
};

export const girderWeapon: WeaponDefinition = {
  id: 'girder',
  name: 'Poutre Métallique',
  category: 'UTILITY',
  behavior: 'GIRDER',
  icon: '🪜',
  description: 'Placez une poutre en acier orientable pour créer un pont au-dessus du vide ou un bouclier.',
  damage: 0,
  radius: 0,
  defaultAmmo: 3,
  windAffected: false,
  bounces: false,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'girder',
  createProjectiles: () => [],
};

export const airdropWeapon: WeaponDefinition = {
  id: 'airdrop',
  name: 'Caisse de Ravitaillement',
  category: 'UTILITY',
  behavior: 'AIRDROP',
  icon: '📦',
  description: 'Largage aérien d\'une caisse en parachute qui soigne +50 HP à la première limace qui la touche.',
  damage: 0,
  radius: 0,
  defaultAmmo: 2,
  windAffected: true,
  bounces: false,
  craftable: true,
  requiresTarget: true,
  customSoundKey: 'airdrop',
  createProjectiles: () => [],
};

import { Vector2D, SlugId, ActiveProjectile } from '../types';

export type WeaponId =
  | 'bazooka'
  | 'homing_missile'
  | 'grenade'
  | 'holy_grenade'
  | 'banana_bomb'
  | 'cluster_banana'
  | 'dynamite'
  | 'shotgun'
  | 'homing_pigeon'
  | 'prod'
  | 'baseball_bat'
  | 'air_strike'
  | 'concrete_donkey'
  | 'super_sheep'
  | 'blowtorch'
  | 'teleport'
  | 'ninja_rope'
  | 'girder'
  | 'airdrop';

export type WeaponCategory =
  | 'EXPLOSIVE'
  | 'MELEE'
  | 'AIR_SUPPORT'
  | 'SPECIAL'
  | 'UTILITY';

export type WeaponBehavior =
  | 'BALLISTIC'
  | 'BOUNCING_TIMER'
  | 'MELEE_PUSH'
  | 'AIR_STRIKE'
  | 'HEAVY_FALL'
  | 'STEERABLE'
  | 'BLOWTORCH'
  | 'TELEPORT'
  | 'NINJA_ROPE'
  | 'GIRDER'
  | 'AIRDROP';

export interface FireContext {
  originX: number;
  originY: number;
  angleDeg: number;
  power: number;
  ownerSlugId: SlugId;
  targetPoint?: Vector2D;
  fuseTimerMs?: number;
}

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  category: WeaponCategory;
  behavior: WeaponBehavior;
  icon: string;
  description: string;
  damage: number;
  radius: number;
  defaultAmmo: number;
  windAffected: boolean;
  bounces: boolean;
  fuseTimeMs?: number;
  allowCustomFuse?: boolean; // When true, allows choosing 1s, 2s, 3s, 4s, 5s fuse
  craftable: boolean;
  customSoundKey?: string;
  minPower?: number;
  maxPower?: number;
  requiresTarget?: boolean;
  createProjectiles: (ctx: FireContext) => ActiveProjectile[];
}

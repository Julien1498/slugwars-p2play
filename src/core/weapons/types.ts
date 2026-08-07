import { Vector2D, SlugId, ActiveProjectile } from '../types';

export type WeaponId =
  | 'bazooka'
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
  | 'teleport';

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
  | 'TELEPORT';

export interface FireContext {
  originX: number;
  originY: number;
  angleDeg: number;
  power: number;
  ownerSlugId: SlugId;
  targetPoint?: Vector2D;
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
  craftable: boolean;
  customSoundKey?: string;
  minPower?: number;
  maxPower?: number;
  requiresTarget?: boolean;
  createProjectiles: (ctx: FireContext) => ActiveProjectile[];
}

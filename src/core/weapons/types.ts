import { Vector2D, SlugId, ActiveProjectile } from '../types';

export type WeaponId =
  | 'bazooka'
  | 'homing_missile'
  | 'grenade'
  | 'cluster_bomb'
  | 'cluster_fragment'
  | 'holy_grenade'
  | 'banana_bomb'
  | 'cluster_banana'
  | 'dynamite'
  | 'shotgun'
  | 'handgun'
  | 'uzi'
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
  | 'airdrop'
  | 'sheep'
  | 'old_lady'
  | 'armageddon'
  | 'meteor'
  | 'bunker_buster'
  | 'mine_strike'
  | 'kamikaze'
  | 'skip_turn';


export type WeaponCategory =
  | 'EXPLOSIVE'
  | 'BALLISTIC'
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
  | 'AIRDROP'
  | 'WALKER'
  | 'GLOBAL_STRIKE'
  | 'BUNKER_BUSTER'
  | 'MINE_STRIKE'
  | 'KAMIKAZE'
  | 'SKIP_TURN';


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
  chargeable?: boolean;
  turnDelay?: number; // Minimum round delay before weapon is selectable in standard schemes
  crateProbability?: number; // Crate drop probability weight (0.05 to 0.25)
  shooterRecoil?: { pushForce: number; popUp?: number };
  triggersRetreat?: boolean;
  kineticImpulse?: { pushForce: number; popUp?: number };
  onExplode?: (proj: ActiveProjectile, pt: { x: number; y: number }, state: any, terrain: any) => ActiveProjectile[] | void;
  createProjectiles: (ctx: FireContext) => ActiveProjectile[];
}

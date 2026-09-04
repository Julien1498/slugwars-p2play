import {
  GameState,
  HelicopterVehicle,
  Landmine,
  ActiveProjectile,
  ExplosionEvent,
  SupplyCrate,
  PlacedGirder,
  CraterRecord,
  SolidProp,
} from '../../core/types';

export function quantizeFloat(val: number | undefined | null, decimals: number = 2): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export interface CompactRopeDelta {
  hx: number;
  hy: number;
  l: number;
  a: number;
  w: number;
}

export interface CompactSlugDelta {
  i?: string; // id (optional fallback)
  idx?: number; // 0-based slug index (1 byte instead of 43-character UUID string!)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  hp?: number;
  f?: 'left' | 'right';
  a?: number; // aimAngle
  p?: number; // aimPower
  c?: boolean; // isChargingPower
  w?: string; // selectedWeaponId
  al?: boolean; // isAlive
  pl?: boolean; // isPlaced
  v?: string | null; // inVehicleId
  tp?: { x: number; y: number }; // currentTargetPoint
  rs?: CompactRopeDelta | null; // ropeState
  ft?: number; // fuseTimerSec (1 to 5)
  bt?: boolean; // isBlowtorching
  jpF?: number; // jetpack fuelMs
  jpT?: boolean; // jetpack isThrusting
  dr?: boolean; // isDrilling
  pa?: boolean; // isParachuting
  pau?: boolean; // hasUsedParachute
}

export interface CompactTeamDelta {
  id: string;
  kills?: number;
  deaths?: number;
  damageDealt?: number;
  damageTaken?: number;
  inventory?: Record<string, number>;
}

export interface CompactStateDelta {
  phase?: string;
  winnerTeamId?: string | null;
  activeTeamId?: string;
  activeSlugId?: string;
  turnTimer?: number;
  retreatTimer?: number | null;
  turnCount?: number;
  wind?: number;
  waterLevel?: number;
  teams?: CompactTeamDelta[];
  slugs?: CompactSlugDelta[];
  fullTeams?: import('../../core/types').Team[];
  fullSlugs?: import('../../core/types').Slug[];
  helicopters?: Partial<HelicopterVehicle>[];
  mines?: Partial<Landmine>[];
  projectiles?: Partial<ActiveProjectile>[];
  explosions?: Partial<ExplosionEvent>[];
  supplyCrates?: Partial<SupplyCrate>[];
  girders?: PlacedGirder[];
  magnets?: import('../../core/types').PlacedMagnet[];
  craters?: CraterRecord[];
  terrainBuilds?: CraterRecord[];
  journal?: GameState['journal'];
  floatingDamages?: GameState['floatingDamages'];
  solidProps?: SolidProp[];
  isTimerFrozen?: boolean;
  godModeEnabled?: boolean;
  isDevHost?: boolean;
}

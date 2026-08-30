export interface Vector2D {
  x: number;
  y: number;
}

export type TeamId = string;
export type SlugId = string;

export interface SolidProp {
  id: string;
  type:
    | 'hedgehog'
    | 'chick'
    | 'mushroom'
    | 'flower'
    | 'tree'
    | 'bunker'
    | 'cactus'
    | 'crystal'
    | 'oil_drum'
    | 'totem'
    | 'lamppost';
  x: number;
  y: number;
  width: number;
  height: number;
  angleRad?: number;
  variant?: number;
  destroyed?: boolean;
}

export interface RopeState {
  hookX: number;
  hookY: number;
  length: number;
  angleRad: number;
  angularVelocity: number;
}

export interface SupplyCrate {
  id: string;
  x: number;
  y: number;
  vy: number;
  isLanded: boolean;
  crateType: 'health' | 'weapon' | 'utility' | 'ammo';
  healAmount?: number;
  weaponId?: string;
  weaponCount?: number;
}

export interface DecorItem {
  id: string;
  type: 'hanging_leaf' | 'butterfly';
  x: number;
  y: number;
  scale?: number;
  variant?: number;
  destroyed?: boolean;
}

export interface PlacedGirder {
  id: string;
  x: number;
  y: number;
  angleDeg: number;
  length: number;
  thickness: number;
  destroyed?: boolean;
  createdAt?: number;
  initialCraterCount?: number;
}

export interface Slug {
  id: SlugId;
  teamId: TeamId;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
  facing: 'left' | 'right';
  movingDir?: 'left' | 'right' | null;
  steeringDir?: 'left' | 'right' | null;
  isChargingPower?: boolean;
  isPlaced?: boolean;
  fallStartY?: number;
  aimAngle: number;
  aimPower: number;
  selectedWeaponId: string;
  currentTargetPoint?: Vector2D;
  inVehicleId?: string | null;
  isBlowtorching?: boolean;
  blowtorchTimerMs?: number;
  ropeState?: RopeState | null;
  fuseTimerSec?: number; // Configurable fuse timer in seconds (1 to 5, default 3)
}

export interface HelicopterVehicle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  facing: 'left' | 'right';
  pilotSlugId?: SlugId | null;
  rotorAngle: number;
  isFlying?: boolean;
}

export interface TeamStats {
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
}

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  avatar: string;
  isHost: boolean;
  inventory: Record<string, number>;
  stats?: TeamStats;
}

export type GamePhase =
  | 'LOBBY'
  | 'PLACEMENT'
  | 'TURN_START'
  | 'TURN_TIME'
  | 'ATTACK'
  | 'RETREAT'
  | 'RESOLVE'
  | 'CASUALTIES'
  | 'INTERTURN'
  | 'GAME_OVER'
  | 'AIMING'
  | 'FIRING'
  | 'PROJECTILE_ACTIVE'
  | 'RESOLVING';

export type MapTheme =
  | 'ISLAND'
  | 'CAVERN'
  | 'FORTRESS'
  | 'FLOATING_CHAOS'
  | 'ARCHIPELAGO'
  | 'NATURAL_ARCHES'
  | 'SPIRES'
  | 'ORGANIC_CAVES';

export type MapSize = 'SMALL' | 'NORMAL' | 'LARGE';

export const MAP_SIZE_CONFIGS: Record<MapSize, { width: number; height: number; label: string; desc: string; icon: string }> = {
  SMALL: { width: 1000, height: 600, label: 'Petite', desc: '1000×600 px - Combats rapides & intenses', icon: '⚡' },
  NORMAL: { width: 1400, height: 800, label: 'Normale', desc: '1400×800 px - Équilibrée et tactique', icon: '⚖️' },
  LARGE: { width: 2000, height: 1000, label: 'Grande', desc: '2000×1000 px - Épique avec vastes reliefs', icon: '🗺️' },
};

export type DayNightCycle = 'DAY' | 'NIGHT';

export type WaterRiseSpeed = 'OFF' | 'SLOW' | 'NORMAL' | 'FAST';
export type WaterRiseFrequency = 'EVERY_TURN' | 'ROUND_CYCLE';

export interface GameConfig {
  weaponSetId: string;
  slugHp: number;
  slugsPerTeam: number;
  turnDuration: number;
  windEnabled: boolean;
  vehiclesEnabled: boolean;
  waterRiseSpeed?: WaterRiseSpeed;
  waterRiseFreq?: WaterRiseFrequency;
  dayNightCycle?: DayNightCycle;
  mapTheme: MapTheme;
  mapSize?: MapSize;
  mapSeed: number;
  turnDelaysEnabled?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export interface HomingPhysicsConfig {
  speed: number;
  turnSpeed: number;
  minTargetDist?: number;
  delayMs?: number;
  windFactor?: number;
}

export type ProjectileImpactBehavior = 'EXPLODE' | 'BOUNCE' | 'REST';

export interface ActiveProjectile {
  id: string;
  weaponId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  fuseTimerMs?: number;
  bounces: boolean;
  windAffected: boolean;
  gravityScale?: number;
  maxVelocityY?: number;
  homingConfig?: HomingPhysicsConfig;
  impactBehavior?: ProjectileImpactBehavior;
  ownerSlugId: SlugId;
  targetPoint?: Vector2D;
  interpolatedAngle?: number;
  behaviorData?: Record<string, any>;
}

export interface ExplosionEvent {
  x: number;
  y: number;
  radius: number;
  damage: number;
  customSound?: string;
  id: string;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  message: string;
  type?: 'info' | 'combat' | 'death' | 'weapon';
}

export interface Landmine {
  id: string;
  x: number;
  y: number;
  isTriggered: boolean;
  fuseTimerMs?: number;
}

export interface FloatingDamage {
  id: string;
  x: number;
  y: number;
  damage: number;
  text?: string;
  color?: string;
  createdAt: number;
}

export interface CraterRecord {
  id: string;
  x: number;
  y: number;
  radius: number;
  createdAt?: number;
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  teams: Team[];
  slugs: Slug[];
  mines: Landmine[];
  helicopters: HelicopterVehicle[];
  activeTeamId: TeamId;
  activeSlugId: SlugId;
  turnTimer: number;
  retreatTimer?: number;
  phaseTimer?: number;
  settleTimer?: number;
  wind: number;
  waterLevel?: number;
  projectiles: ActiveProjectile[];
  explosions: ExplosionEvent[];
  particles: Particle[];
  floatingDamages: FloatingDamage[];
  supplyCrates?: SupplyCrate[];
  girders?: PlacedGirder[];
  craters?: CraterRecord[];
  winnerTeamId?: TeamId;
  journal: JournalEntry[];
  turnCount: number;
}

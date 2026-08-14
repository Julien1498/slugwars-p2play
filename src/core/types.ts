export interface Vector2D {
  x: number;
  y: number;
}

export type TeamId = string;
export type SlugId = string;

export interface SolidProp {
  id: string;
  type: 'hedgehog' | 'chick' | 'mushroom' | 'flower' | 'tree';
  x: number;
  y: number;
  width: number;
  height: number;
  variant?: number;
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
  crateType: 'health' | 'ammo';
  healAmount: number;
}

export interface PlacedGirder {
  id: string;
  x: number;
  y: number;
  angleDeg: number;
  length: number;
  thickness: number;
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

export type MapTheme = 'ISLAND' | 'CAVERN' | 'FORTRESS' | 'FLOATING_CHAOS';

export type DayNightCycle = 'DAY' | 'NIGHT';

export interface GameConfig {
  weaponSetId: string;
  slugHp: number;
  slugsPerTeam: number;
  turnDuration: number;
  windEnabled: boolean;
  vehiclesEnabled: boolean;
  dayNightCycle?: DayNightCycle;
  mapTheme: MapTheme;
  mapSeed: number;
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
  ownerSlugId: SlugId;
  targetPoint?: Vector2D;
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
  createdAt: number;
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
  wind: number;
  projectiles: ActiveProjectile[];
  explosions: ExplosionEvent[];
  particles: Particle[];
  floatingDamages: FloatingDamage[];
  supplyCrates?: SupplyCrate[];
  girders?: PlacedGirder[];
  winnerTeamId?: TeamId;
  journal: JournalEntry[];
  turnCount: number;
}

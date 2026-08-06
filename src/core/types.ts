export interface Vector2D {
  x: number;
  y: number;
}

export type TeamId = string;
export type SlugId = string;

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
}

export interface Team {
  id: TeamId;
  name: string;
  color: string;
  avatar: string;
  isHost: boolean;
  inventory: Record<string, number>;
}

export type GamePhase =
  | 'LOBBY'
  | 'PLACEMENT'
  | 'AIMING'
  | 'FIRING'
  | 'PROJECTILE_ACTIVE'
  | 'RESOLVING'
  | 'GAME_OVER';

export type MapTheme = 'ISLAND' | 'CAVERN' | 'FORTRESS' | 'FLOATING_CHAOS';

export interface GameConfig {
  weaponSetId: string;
  slugHp: number;
  slugsPerTeam: number;
  turnDuration: number;
  windEnabled: boolean;
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

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  teams: Team[];
  slugs: Slug[];
  mines: Landmine[];
  activeTeamId: TeamId;
  activeSlugId: SlugId;
  turnTimer: number;
  wind: number;
  projectiles: ActiveProjectile[];
  explosions: ExplosionEvent[];
  particles: Particle[];
  winnerTeamId?: TeamId;
  journal: JournalEntry[];
  turnCount: number;
}

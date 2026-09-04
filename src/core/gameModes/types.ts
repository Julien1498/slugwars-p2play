export type GameMode =
  | 'DEATHMATCH'
  | 'VIP_HUNT'
  | 'GUN_GAME'
  | 'RISING_WATER'
  | 'INSTAGIB';

export interface GameModeInfo {
  id: GameMode;
  name: string;
  shortLabel: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export const GAME_MODES_CONFIG: Record<GameMode, GameModeInfo> = {
  DEATHMATCH: {
    id: 'DEATHMATCH',
    name: 'Match à Mort Standard',
    shortLabel: 'Classique',
    icon: '⚔️',
    description: 'Bataille classique au tour par tour. Éliminez toute l\'équipe adverse.',
    badgeColor: 'text-zinc-300 border-zinc-700 bg-zinc-900/80',
  },
  VIP_HUNT: {
    id: 'VIP_HUNT',
    name: 'Chef VIP / Assassinat',
    shortLabel: 'Chef VIP',
    icon: '👑',
    description: 'La 1ère limace est le Général (150 HP + couronne). Si le VIP meurt, toute l\'escouade est anéantie !',
    badgeColor: 'text-amber-300 border-amber-500/50 bg-amber-950/80',
  },
  GUN_GAME: {
    id: 'GUN_GAME',
    name: 'Gun Game / Roulette',
    shortLabel: 'Gun Game',
    icon: '🎰',
    description: 'Une arme unique et identique est imposée à tous à chaque tour avec munitions infinies.',
    badgeColor: 'text-fuchsia-300 border-fuchsia-500/50 bg-fuchsia-950/80',
  },
  RISING_WATER: {
    id: 'RISING_WATER',
    name: 'Marée Infernale',
    shortLabel: 'Marée',
    icon: '🌊',
    description: 'L\'eau monte agressivement (+30px) à CHAQUE tour avec chrono réduit (30s). Escaladez ou périrez !',
    badgeColor: 'text-sky-300 border-sky-500/50 bg-sky-950/80',
  },
  INSTAGIB: {
    id: 'INSTAGIB',
    name: 'Instagib (1 HP)',
    shortLabel: '1 HP',
    icon: '⚡',
    description: 'Toutes les limaces ont seulement 1 HP ! Le moindre souffle de débris ou éclat est fatal.',
    badgeColor: 'text-rose-300 border-rose-500/50 bg-rose-950/80',
  },
};

/**
 * Ordered sequence of 12 distinct weapons cycling through turns in Gun Game mode.
 */
export const GUN_GAME_SEQUENCE: readonly string[] = [
  'bazooka',
  'shotgun',
  'grenade',
  'super_sheep',
  'baseball_bat',
  'banana_bomb',
  'holy_grenade',
  'cluster_bomb',
  'dynamite',
  'homing_missile',
  'air_strike',
  'concrete_donkey',
];

/**
 * Returns the imposed weapon ID for the given 1-based turn count.
 */
export function getGunGameWeaponForTurn(turnCount: number): string {
  const safeTurn = Math.max(1, turnCount || 1);
  const idx = (safeTurn - 1) % GUN_GAME_SEQUENCE.length;
  return GUN_GAME_SEQUENCE[idx];
}

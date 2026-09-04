import { GameState, Team, Slug } from '../../types';
import { getWeapon } from '../../weapons/registry';
import { getWeaponSet } from '../../weapons/weaponSets';

export function isWeaponLocked(state: GameState, weaponId: string, _team?: Team): boolean {
  if (state.config && state.config.turnDelaysEnabled === false) return false;

  const wSet = state.config?.weaponSetId ? getWeaponSet(state.config.weaponSetId) : undefined;
  if (wSet && wSet.turnDelaysEnabled === false) return false;

  const weapon = getWeapon(weaponId);
  const turnDelay = weapon.turnDelay ?? 0;
  if (turnDelay <= 0) return false;

  const totalTeams = Math.max(1, state.teams.length);
  const completedRounds = Math.floor(Math.max(0, (state.turnCount || 1) - 1) / totalTeams);
  return completedRounds < turnDelay;
}

export function getWeaponLockDetails(
  state: GameState,
  weaponId: string,
  _team?: Team
): {
  isLocked: boolean;
  turnDelay: number;
  roundsRemaining: number;
} {
  if (state.config && state.config.turnDelaysEnabled === false) {
    return { isLocked: false, turnDelay: 0, roundsRemaining: 0 };
  }

  const wSet = state.config?.weaponSetId ? getWeaponSet(state.config.weaponSetId) : undefined;
  if (wSet && wSet.turnDelaysEnabled === false) {
    return { isLocked: false, turnDelay: 0, roundsRemaining: 0 };
  }

  const weapon = getWeapon(weaponId);
  const turnDelay = weapon.turnDelay ?? 0;
  if (turnDelay <= 0) {
    return { isLocked: false, turnDelay: 0, roundsRemaining: 0 };
  }

  const totalTeams = Math.max(1, state.teams.length);
  const completedRounds = Math.floor(Math.max(0, (state.turnCount || 1) - 1) / totalTeams);
  const isLocked = completedRounds < turnDelay;
  const roundsRemaining = Math.max(0, turnDelay - completedRounds);

  return { isLocked, turnDelay, roundsRemaining };
}

export function selectWeapon(state: GameState, weaponId: string): boolean {
  // In Gun Game mode, weapon selection is strictly locked to the imposed weapon of the turn
  if (state.config?.gameMode === 'GUN_GAME') {
    return false;
  }

  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive) return false;
  const activeTeam = state.teams.find((t) => t.id === activeSlug.teamId);

  // Check if weapon is locked by turn delay
  if (isWeaponLocked(state, weaponId, activeTeam)) {
    activeSlug.selectedWeaponId = 'bazooka';
    return false;
  }

  if (activeTeam) {
    const ammo = activeTeam.inventory[weaponId] ?? -1;
    if (ammo === 0) {
      activeSlug.selectedWeaponId = 'bazooka';
      return false;
    }
  }
  activeSlug.selectedWeaponId = weaponId;
  const newWeapon = getWeapon(weaponId);
  if (newWeapon.allowCustomFuse && !activeSlug.fuseTimerSec) {
    activeSlug.fuseTimerSec = newWeapon.fuseTimeMs ? Math.round(newWeapon.fuseTimeMs / 1000) : 3;
  }
  return true;
}

export function setFuseTimer(state: GameState, slugId: string, seconds: number): void {
  const slug = state.slugs.find((s) => s.id === slugId);
  if (slug) {
    slug.fuseTimerSec = Math.max(1, Math.min(5, Math.round(seconds)));
  }
}

export function consumeWeaponAmmo(
  state: GameState,
  activeTeam: Team | undefined,
  weaponId: string
): boolean {
  // In Gun Game mode, imposed weapons have infinite ammunition
  if (state.config?.gameMode === 'GUN_GAME') {
    return true;
  }

  if (!activeTeam) return true;

  const currentAmmo = activeTeam.inventory[weaponId] ?? -1;
  if (currentAmmo === 0) {
    for (const s of state.slugs) {
      if (s.teamId === activeTeam.id && s.selectedWeaponId === weaponId) {
        s.selectedWeaponId = 'bazooka';
      }
    }
    return false;
  }

  if (currentAmmo > 0) {
    activeTeam.inventory[weaponId]--;
    if (activeTeam.inventory[weaponId] === 0) {
      for (const s of state.slugs) {
        if (s.teamId === activeTeam.id && s.selectedWeaponId === weaponId) {
          s.selectedWeaponId = 'bazooka';
        }
      }
    }
  }

  return true;
}

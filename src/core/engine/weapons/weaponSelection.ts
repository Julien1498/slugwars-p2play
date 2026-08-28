import { GameState, Team, Slug } from '../../types';
import { getWeapon } from '../../weapons/registry';

export function selectWeapon(state: GameState, weaponId: string): boolean {
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive) return false;
  const activeTeam = state.teams.find((t) => t.id === activeSlug.teamId);
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

import { GameState, Vector2D, SolidProp, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { getWeapon } from '../weapons/registry';
import {
  selectWeapon,
  setFuseTimer,
  consumeWeaponAmmo,
} from './weapons/weaponSelection';
import { detonateOilDrum } from './weapons/oilDrumDetonator';
import {
  executeSkipTurn,
  executeTeleport,
  executeBlowtorch,
  executeNinjaRope,
  executeGirder,
  executeAirdrop,
  executeMeleePush,
} from './weapons/specialWeaponExecutors';
import { fireBallisticProjectiles } from './weapons/ballisticWeaponFire';

export { selectWeapon, setFuseTimer, detonateOilDrum };

export function fireWeapon(
  state: GameState,
  terrain: DestructibleTerrain,
  targetPoint: Vector2D | undefined,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (state.phase !== 'AIMING') return false;
  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (!activeSlug || !activeSlug.isAlive) return false;

  const weapon = getWeapon(activeSlug.selectedWeaponId);
  const activeTeam = state.teams.find((t) => t.id === activeSlug.teamId);

  const canFire = consumeWeaponAmmo(state, activeTeam, weapon.id);
  if (!canFire) return false;

  const defaultTarget: Vector2D = {
    x: Math.max(30, Math.min(terrain.data.width - 30, activeSlug.x + (activeSlug.facing === 'right' ? 80 : -80))),
    y: Math.max(30, Math.min(terrain.data.waterLevel - 30, activeSlug.y - 20)),
  };

  const effectiveTargetPoint: Vector2D = targetPoint || activeSlug.currentTargetPoint || defaultTarget;
  if (targetPoint) {
    activeSlug.currentTargetPoint = targetPoint;
  }

  if (weapon.id === 'skip_turn') {
    return executeSkipTurn(state, activeSlug, addLog);
  }

  if (weapon.behavior === 'TELEPORT') {
    return executeTeleport(state, terrain, activeSlug, effectiveTargetPoint, addLog);
  }

  if (weapon.id === 'blowtorch') {
    return executeBlowtorch(activeSlug, addLog);
  }

  if (weapon.id === 'ninja_rope') {
    return executeNinjaRope(state, terrain, activeSlug, addLog);
  }

  if (weapon.id === 'girder') {
    return executeGirder(state, terrain, activeSlug, effectiveTargetPoint, addLog);
  }

  if (weapon.behavior === 'AIRDROP') {
    return executeAirdrop(state, effectiveTargetPoint, addLog);
  }

  if (weapon.behavior === 'MELEE_PUSH') {
    return executeMeleePush(state, activeSlug, activeTeam, weapon, addLog);
  }

  return fireBallisticProjectiles(state, activeSlug, weapon, effectiveTargetPoint, addLog);
}

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
  executeArmageddon,
} from './weapons/specialWeaponExecutors';
import { fireBallisticProjectiles } from './weapons/ballisticWeaponFire';

export { selectWeapon, setFuseTimer, detonateOilDrum };

type BehaviorExecutor = (
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: any,
  activeTeam: any,
  weapon: any,
  effectiveTargetPoint: Vector2D,
  addLog: (msg: string, type?: JournalEntry['type']) => void
) => boolean;

const SPECIAL_BEHAVIOR_EXECUTORS: Partial<Record<string, BehaviorExecutor>> = {
  SKIP_TURN: (state, _terrain, activeSlug, _team, _w, _tp, addLog) => executeSkipTurn(state, activeSlug, addLog),
  TELEPORT: (state, terrain, activeSlug, _team, _w, tp, addLog) => executeTeleport(state, terrain, activeSlug, tp, addLog),
  BLOWTORCH: (_s, _t, activeSlug, _team, _w, _tp, addLog) => executeBlowtorch(activeSlug, addLog),
  NINJA_ROPE: (state, terrain, activeSlug, _team, _w, _tp, addLog) => executeNinjaRope(state, terrain, activeSlug, addLog),
  GIRDER: (state, terrain, activeSlug, _team, _w, tp, addLog) => executeGirder(state, terrain, activeSlug, tp, addLog),
  AIRDROP: (state, _t, _slug, _team, _w, tp, addLog) => executeAirdrop(state, tp, addLog),
  MELEE_PUSH: (state, _t, activeSlug, activeTeam, weapon, _tp, addLog) => executeMeleePush(state, activeSlug, activeTeam, weapon, addLog),
  GLOBAL_STRIKE: (state, terrain, activeSlug, _team, _w, _tp, addLog) => executeArmageddon(state, terrain, activeSlug, addLog),
};

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

  const specialExecutor = SPECIAL_BEHAVIOR_EXECUTORS[weapon.behavior];
  if (specialExecutor) {
    return specialExecutor(state, terrain, activeSlug, activeTeam, weapon, effectiveTargetPoint, addLog);
  }

  return fireBallisticProjectiles(state, activeSlug, weapon, effectiveTargetPoint, addLog);
}

import { GameState } from '../../core/types';

export const TEAM_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function applyOptimisticAction(
  state: GameState,
  actionName: string,
  payload: any,
  myPeerId: string
): boolean {
  const isMyTurn =
    myPeerId &&
    state.activeTeamId === myPeerId &&
    (state.phase === 'AIMING' || state.phase === 'TURN_TIME' || state.phase === 'RETREAT');

  const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;
  if (!activeSlug) return false;

  if (actionName === 'AIM') {
    if (payload?.aimAngle !== undefined) activeSlug.aimAngle = payload.aimAngle;
    if (payload?.aimPower !== undefined && !activeSlug.isChargingPower) {
      activeSlug.aimPower = payload.aimPower;
    }
    if (payload?.facing !== undefined) activeSlug.facing = payload.facing;
    if (payload?.targetPoint !== undefined) activeSlug.currentTargetPoint = payload.targetPoint;
    return true;
  }
  if (actionName === 'SELECT_WEAPON') {
    if (payload?.weaponId) {
      activeSlug.selectedWeaponId = payload.weaponId;
      return true;
    }
  }
  if (actionName === 'SET_FUSE_TIMER') {
    if (payload?.seconds !== undefined) {
      activeSlug.fuseTimerSec = payload.seconds;
      return true;
    }
  }
  if (actionName === 'START_CHARGE') {
    activeSlug.isChargingPower = true;
    activeSlug.aimPower = 5;
    if (payload?.targetPoint) activeSlug.currentTargetPoint = payload.targetPoint;
    return true;
  }
  if (actionName === 'FIRE') {
    activeSlug.isChargingPower = false;
    if (activeSlug.selectedWeaponId === 'blowtorch') {
      activeSlug.isBlowtorching = true;
    }
    return true;
  }
  if (actionName === 'RELEASE_CHARGE') {
    activeSlug.isChargingPower = false;
    if (activeSlug.isBlowtorching) {
      activeSlug.isBlowtorching = false;
    }
    return true;
  }
  if (actionName === 'START_MOVE') {
    if (payload?.dir) {
      activeSlug.movingDir = payload.dir;
      activeSlug.facing = payload.dir;
      return true;
    }
  }
  if (actionName === 'STOP_MOVE') {
    activeSlug.movingDir = null;
    return true;
  }
  return false;
}

export function interpolateGuestLocalState(
  state: GameState,
  isSolid: (x: number, y: number) => boolean,
  waterLevel: number,
  myPeerId: string
): boolean {
  let changed = false;

  if (state.phase === 'AIMING' || state.phase === 'PLACEMENT' || state.phase === 'TURN_START') {
    if (state.turnTimer > 0) {
      state.turnTimer = Math.max(0, state.turnTimer - 0.05);
      changed = true;
    }
  } else if (state.phase === 'RETREAT' && state.retreatTimer !== undefined) {
    if (state.retreatTimer > 0) {
      state.retreatTimer = Math.max(0, state.retreatTimer - 0.05);
      changed = true;
    }
  }

  if (state.mines && state.mines.length > 0) {
    for (const m of state.mines) {
      if (m.isTriggered && m.fuseTimerMs !== undefined && m.fuseTimerMs > 0) {
        m.fuseTimerMs = Math.max(0, m.fuseTimerMs - 50);
        changed = true;
      }
    }
  }

  const isMyTurn = myPeerId && state.activeTeamId === myPeerId && state.phase === 'AIMING';
  const activeSlug = isMyTurn ? state.slugs.find((s) => s.id === state.activeSlugId) : null;
  if (activeSlug && activeSlug.isChargingPower) {
    activeSlug.aimPower = Math.min(100, (activeSlug.aimPower || 0) + 2.5);
    changed = true;
  }

  if (state.supplyCrates && state.supplyCrates.length > 0) {
    for (const crate of state.supplyCrates) {
      if (!crate.isLanded) {
        crate.x += state.wind * 0.15;
        crate.y += (crate.vy || 1.8);
        if (isSolid(crate.x, crate.y + 10) || crate.y >= waterLevel - 15) {
          crate.isLanded = true;
          crate.vy = 0;
        }
        changed = true;
      }
    }
  }

  return changed;
}

export function resolveLobbyPlayerName(
  username: string | undefined,
  trusted: string | undefined,
  peerId: string
): string {
  const isGeneric = !username || username.startsWith('Joueur-') || username.startsWith('Joueur ');
  if (!isGeneric && username) return username;
  if (trusted && !trusted.startsWith('Joueur-') && !trusted.startsWith('Joueur ')) return trusted;
  return `Limace ${peerId.slice(0, 4)}`;
}

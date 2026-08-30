import { GameState, Vector2D, Slug, Team, JournalEntry } from '../../types';
import { DestructibleTerrain } from '../../terrain';
import { WeaponDefinition } from '../../weapons/types';
import { sfx } from '../../audio';
import { PhaseManager } from '../phaseManager';

export function executeBunkerBuster(
  state: GameState,
  targetPoint: Vector2D,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  sfx.play('siren');
  addLog(`🕳️ ${activeSlug.name} a ordonné un Bunker Buster sur la zone ciblée !`, 'weapon');

  state.projectiles.push({
    id: `proj_bunker_${Date.now()}_${Math.random()}`,
    weaponId: 'bunker_buster',
    x: targetPoint.x,
    y: -40,
    vx: 0,
    vy: 14,
    radius: 7,
    bounces: false,
    windAffected: false,
    ownerSlugId: activeSlug.id,
    behaviorData: {
      burrowRemaining: 100,
      isBurrowing: false,
    },
  });

  PhaseManager.startRetreat(state, 5.0, addLog);
  return true;
}

export function executeMineStrike(
  state: GameState,
  targetPoint: Vector2D,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  sfx.play('siren');
  addLog(`💣 ${activeSlug.name} a ordonné une Frappe de 5 Mines aériennes !`, 'weapon');

  const now = Date.now();
  for (let i = 0; i < 5; i++) {
    const offset = (i - 2) * 35;
    state.projectiles.push({
      id: `proj_minestrike_${now}_${i}_${Math.random()}`,
      weaponId: 'mine_strike',
      x: targetPoint.x + offset,
      y: -50 - Math.abs(i - 2) * 20,
      vx: (i - 2) * 0.8,
      vy: 6.5,
      radius: 5,
      bounces: true,
      windAffected: true,
      fuseTimerMs: 4000,
      ownerSlugId: activeSlug.id,
      behaviorData: {
        isMine: true,
      },
    });
  }

  PhaseManager.startRetreat(state, 5.0, addLog);
  return true;
}

export function executeKamikaze(
  state: GameState,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  sfx.play('fire');
  addLog(`🚀 ${activeSlug.name} s'élance en Kamikaze sacrificiel !`, 'combat');

  const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
  const dirX = Math.cos(angleRad);
  const dirY = Math.sin(angleRad);
  const speed = 20;

  state.projectiles.push({
    id: `proj_kamikaze_${Date.now()}_${Math.random()}`,
    weaponId: 'kamikaze',
    x: activeSlug.x,
    y: activeSlug.y - 6,
    vx: dirX * speed,
    vy: dirY * speed,
    radius: 8,
    bounces: false,
    windAffected: false,
    ownerSlugId: activeSlug.id,
    behaviorData: {
      maxDistance: 450,
      traveled: 0,
      dirX,
      dirY,
    },
  });

  PhaseManager.startRetreat(state, 5.0, addLog);
  return true;
}

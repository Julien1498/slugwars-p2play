import { GameState, Vector2D, Slug, Team, JournalEntry } from '../../types';
import { DestructibleTerrain } from '../../terrain';
import { WeaponDefinition } from '../../weapons/types';
import { sfx } from '../../audio';
import { findSafeTeleportPoint } from '../turnManager';
import { PhaseManager } from '../phaseManager';

export function executeSkipTurn(
  state: GameState,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  sfx.play('tick');
  addLog(`${activeSlug.name} passe son tour ! 🏳️`, 'info');
  PhaseManager.startResolving(state, { settleTimer: 0.3, phaseTimeout: 5.0 });
  return true;
}

export function executeTeleport(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  targetPoint: Vector2D,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  const safePt = findSafeTeleportPoint(terrain, targetPoint.x, targetPoint.y, state.slugs);
  activeSlug.x = safePt.x;
  activeSlug.y = safePt.y;
  activeSlug.vx = 0;
  activeSlug.vy = 0;
  sfx.play('teleport');
  addLog(`${activeSlug.name} s'est téléporté !`, 'weapon');
  PhaseManager.startResolving(state, { settleTimer: 0.6, phaseTimeout: 30.0 });
  return true;
}

export function executeBlowtorch(
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  activeSlug.isBlowtorching = true;
  activeSlug.aimPower = 5;
  sfx.play('fire');
  addLog(`${activeSlug.name} allume son Chalumeau ! 🔥 (Maintenez pour creuser)`, 'weapon');
  return true;
}

export function executeNinjaRope(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
  const dirX = Math.cos(angleRad);
  const dirY = Math.sin(angleRad);

  const maxRange = 250;
  const startX = activeSlug.x;
  const startY = activeSlug.y - 12;

  let hitSolid = false;
  let hookX = startX;
  let hookY = startY;

  for (let dist = 10; dist <= maxRange; dist += 3) {
    const testX = startX + dirX * dist;
    const testY = startY + dirY * dist;
    if (testX < 0 || testX >= terrain.data.width || testY < 0) break;
    if (terrain.isSolid(testX, testY)) {
      hitSolid = true;
      hookX = testX;
      hookY = testY;
      break;
    }
  }

  if (hitSolid) {
    const ropeLength = Math.hypot(startX - hookX, startY - hookY);
    const initialAngle = Math.atan2(startX - hookX, startY - hookY);

    activeSlug.ropeState = {
      hookX,
      hookY,
      length: Math.max(25, ropeLength),
      angleRad: initialAngle,
      angularVelocity: activeSlug.facing === 'right' ? 0.04 : -0.04,
    };

    sfx.play('rope_attach');
    addLog(`${activeSlug.name} a accroché son Grappin Ninja ! 🪢`, 'weapon');
  } else {
    sfx.play('rope_shoot');
    addLog(`Le grappin n'a rien accroché !`, 'info');
  }
  return true;
}

export function executeGirder(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  targetPoint: Vector2D,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  const length = 110;
  const thickness = 14;
  const angleDeg = activeSlug.aimAngle || 0;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const halfL = length / 2;
  const halfT = thickness / 2;
  const gx = targetPoint.x;
  const gy = targetPoint.y;
  const w = terrain.data.width;
  const h = terrain.data.height;

  for (let dl = -halfL; dl <= halfL; dl++) {
    for (let dt = -halfT; dt <= halfT; dt++) {
      const px = Math.round(gx + dl * cos - dt * sin);
      const py = Math.round(gy + dl * sin + dt * cos);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        terrain.data.grid[py * w + px] = 1;
      }
    }
  }

  const now = Date.now();
  if (!state.girders) state.girders = [];
  state.girders.push({
    id: `girder_${now}_${Math.random()}`,
    x: gx,
    y: gy,
    angleDeg,
    length,
    thickness,
    createdAt: now,
    initialCraterCount: state.craters?.length || 0,
  });

  sfx.play('girder');
  addLog(`${activeSlug.name} a posé une Poutre Métallique ! 🪜`, 'weapon');
  PhaseManager.startResolving(state, { settleTimer: 0.5, phaseTimeout: 30.0 });
  return true;
}

export function executeAirdrop(
  state: GameState,
  targetPoint: Vector2D,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  if (!state.supplyCrates) state.supplyCrates = [];
  state.supplyCrates.push({
    id: `crate_${Date.now()}_${Math.random()}`,
    x: targetPoint.x,
    y: -30,
    vy: 2.2,
    isLanded: false,
    crateType: 'health',
    healAmount: 50,
  });

  sfx.play('airdrop');
  PhaseManager.startRetreat(state, 4.0, addLog);
  return true;
}

export function executeMeleePush(
  state: GameState,
  activeSlug: Slug,
  activeTeam: Team | undefined,
  weapon: WeaponDefinition,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  const targetSlug = state.slugs.find(
    (s) => s.id !== activeSlug.id && s.isAlive && Math.hypot(s.x - activeSlug.x, s.y - activeSlug.y) < 40
  );
  if (targetSlug) {
    const dir = activeSlug.facing === 'right' ? 1 : -1;
    const victimHpBefore = targetSlug.hp;
    const actualDamage = Math.min(victimHpBefore, weapon.damage);
    targetSlug.hp = Math.max(0, targetSlug.hp - weapon.damage);
    if (targetSlug.hp === 0) targetSlug.isAlive = false;
    targetSlug.vx = dir * 18;
    targetSlug.vy = -10;

    const victimTeam = state.teams.find((t) => t.id === targetSlug.teamId);
    if (victimTeam) {
      if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
      victimTeam.stats.damageTaken += actualDamage;
      if (targetSlug.hp === 0 && victimHpBefore > 0) victimTeam.stats.deaths++;
    }

    if (activeTeam && activeTeam.id !== targetSlug.teamId) {
      if (!activeTeam.stats) activeTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
      activeTeam.stats.damageDealt += actualDamage;
      if (targetSlug.hp === 0 && victimHpBefore > 0) activeTeam.stats.kills++;
    }

    addLog(`${activeSlug.name} a frappé ${targetSlug.name} à la batte !`, 'combat');
  }
  sfx.play('melee');
  PhaseManager.startResolving(state, { settleTimer: 1.2, phaseTimeout: 30.0 });
  return true;
}

export function executeArmageddon(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  addLog: (msg: string, type?: JournalEntry['type']) => void
): boolean {
  sfx.play('siren');
  addLog(`☄️ ${activeSlug.name} a invoqué l'Armageddon ! Pluie de météores apocalyptique !`, 'combat');

  const width = terrain.data.width;
  const count = 20;
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const startX = 60 + (i / count) * (width - 120) + (Math.random() - 0.5) * 80;
    const startY = -80 - i * 45;
    state.projectiles.push({
      id: `proj_meteor_${now}_${i}_${Math.random()}`,
      weaponId: 'meteor',
      x: Math.max(30, Math.min(width - 30, startX)),
      y: startY,
      vx: (Math.random() - 0.5) * 4,
      vy: 10 + Math.random() * 4,
      radius: 6,
      bounces: false,
      windAffected: true,
      ownerSlugId: activeSlug.id,
    });
  }

  PhaseManager.startRetreat(state, 5.0, addLog);
  return true;
}


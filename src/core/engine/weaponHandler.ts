import { GameState, Vector2D, SolidProp, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { getWeapon } from '../weapons/registry';
import { applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';
import { findSafeTeleportPoint } from './turnManager';
import { PhaseManager } from './phaseManager';

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

export function detonateOilDrum(
  state: GameState,
  terrain: DestructibleTerrain,
  drum: SolidProp,
  carveCrater: (x: number, y: number, radius: number) => void,
  addLog: (msg: string, type?: JournalEntry['type']) => void
) {
  const now = Date.now();
  const blastRadius = 65;
  const blastDamage = 50;
  const drumY = drum.y - 12;

  state.explosions.push({
    id: `ex_drum_${now}_${Math.random()}`,
    x: drum.x,
    y: drumY,
    radius: blastRadius,
    damage: blastDamage,
    createdAt: now,
  });

  sfx.play('explosion');
  addLog(`💥 UN BARIL DE PÉTROLE A EXPLOSÉ !`, 'combat');

  const expRes = applyExplosionToSlugs(
    drum.x,
    drumY,
    blastRadius,
    blastDamage,
    state.slugs,
    terrain,
    state.teams
  );

  for (const dm of expRes.damageEvents) {
    state.floatingDamages.push({
      id: `fd_${now}_${Math.random()}`,
      x: dm.x,
      y: dm.y,
      damage: dm.damage,
      createdAt: now,
    });
  }

  for (let p = 0; p < 14; p++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4.5;
    state.particles.push({
      x: drum.x,
      y: drumY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      color: Math.random() > 0.35 ? '#ef4444' : '#facc15',
      size: Math.random() * 3 + 2,
      life: 1.0,
    });
  }

  carveCrater(drum.x, drumY, blastRadius);
}

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
  if (activeTeam) {
    const currentAmmo = activeTeam.inventory[weapon.id] ?? -1;
    if (currentAmmo === 0) {
      activeSlug.selectedWeaponId = 'bazooka';
      return false;
    }
    if (currentAmmo > 0) {
      activeTeam.inventory[weapon.id]--;
      if (activeTeam.inventory[weapon.id] === 0) {
        activeSlug.selectedWeaponId = 'bazooka';
      }
    }
  }

  const defaultTarget: Vector2D = {
    x: Math.max(30, Math.min(terrain.data.width - 30, activeSlug.x + (activeSlug.facing === 'right' ? 80 : -80))),
    y: Math.max(30, Math.min(terrain.data.waterLevel - 30, activeSlug.y - 20)),
  };

  const effectiveTargetPoint: Vector2D = targetPoint || activeSlug.currentTargetPoint || defaultTarget;

  if (targetPoint) {
    activeSlug.currentTargetPoint = targetPoint;
  }

  if (weapon.behavior === 'TELEPORT') {
    const safePt = findSafeTeleportPoint(terrain, effectiveTargetPoint.x, effectiveTargetPoint.y, state.slugs);
    activeSlug.x = safePt.x;
    activeSlug.y = safePt.y;
    activeSlug.vx = 0;
    activeSlug.vy = 0;
    sfx.play('teleport');
    addLog(`${activeSlug.name} s'est téléporté !`, 'weapon');
    PhaseManager.startResolving(state, { settleTimer: 0.6, phaseTimeout: 8.0 });
    return true;
  }

  if (weapon.id === 'blowtorch') {
    activeSlug.isBlowtorching = true;
    activeSlug.aimPower = 5;
    sfx.play('fire');
    addLog(`${activeSlug.name} allume son Chalumeau ! 🔥 (Maintenez pour creuser)`, 'weapon');
    return true;
  }

  if (weapon.id === 'ninja_rope') {
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

  if (weapon.id === 'girder') {
    const length = 110;
    const thickness = 14;
    const angleDeg = activeSlug.aimAngle || 0;
    const rad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const halfL = length / 2;
    const halfT = thickness / 2;
    const gx = effectiveTargetPoint.x;
    const gy = effectiveTargetPoint.y;
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
    PhaseManager.startResolving(state, { settleTimer: 0.5, phaseTimeout: 8.0 });
    return true;
  }

  if (weapon.behavior === 'AIRDROP') {
    if (!state.supplyCrates) state.supplyCrates = [];
    state.supplyCrates.push({
      id: `crate_${Date.now()}_${Math.random()}`,
      x: effectiveTargetPoint.x,
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

  if (weapon.behavior === 'MELEE_PUSH') {
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
    PhaseManager.startResolving(state, { settleTimer: 1.2, phaseTimeout: 8.0 });
    return true;
  }

  const customFuseMs = activeSlug.fuseTimerSec ? activeSlug.fuseTimerSec * 1000 : (weapon.fuseTimeMs ?? 3000);
  const projs = weapon.createProjectiles({
    originX: activeSlug.x + (activeSlug.facing === 'right' ? 10 : -10),
    originY: activeSlug.y - 10,
    angleDeg: activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle,
    power: activeSlug.aimPower,
    ownerSlugId: activeSlug.id,
    targetPoint,
    fuseTimerMs: customFuseMs,
  });

  state.projectiles.push(...projs);

  if (
    weapon.id === 'dynamite' ||
    weapon.id === 'holy_grenade' ||
    weapon.id === 'banana_bomb' ||
    weapon.behavior === 'BOUNCING_TIMER'
  ) {
    PhaseManager.startRetreat(state, 4.0, addLog);
  } else {
    PhaseManager.startProjectileActive(state);
  }

  sfx.play('fire');
  addLog(`${activeSlug.name} a tiré avec ${weapon.name} ! (Puissance: ${Math.round(activeSlug.aimPower)}%)`, 'weapon');
  return true;
}

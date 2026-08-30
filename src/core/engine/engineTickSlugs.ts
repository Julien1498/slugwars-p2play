import { GameState, Vector2D, Slug } from '../types';
import { DestructibleTerrain } from '../terrain';
import { updateSlugPhysics } from '../physics';
import { sfx } from '../audio';

export function updateSlugsPhysicsAndDrowning(
  state: GameState,
  terrain: DestructibleTerrain,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void,
  effectiveWaterY: number
) {
  for (const slug of state.slugs) {
    if (slug.y >= effectiveWaterY && !slug.isGodMode) {
      if (slug.isAlive) {
        const victimTeam = state.teams.find((t) => t.id === slug.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.deaths++;
        }
      }
      slug.hp = 0;
      slug.isAlive = false;
    }

    const phys = updateSlugPhysics(slug, terrain, state.slugs);
    if (phys.fallDamage && !slug.isGodMode) {
      addLog(`💥 ${slug.name} a subi ${phys.fallDamage} dégâts de chute !`, 'combat');
      sfx.play('ouch');
      state.floatingDamages.push({
        id: `fd_${Date.now()}_${Math.random()}`,
        x: slug.x,
        y: slug.y - 24,
        damage: phys.fallDamage,
        createdAt: Date.now(),
      });

      const victimTeam = state.teams.find((t) => t.id === slug.teamId);
      if (victimTeam) {
        if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
        victimTeam.stats.damageTaken += phys.fallDamage;
        if (slug.hp === 0) victimTeam.stats.deaths++;
      }
    }
  }
}

export function updateSlugRopeAndCharge(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  moveSlug: (dir: 'left' | 'right') => void,
  fireWeapon: (tp?: Vector2D) => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
) {
  if (activeSlug.ropeState) {
    const rope = activeSlug.ropeState;
    const isHookSolid =
      terrain.isSolid(rope.hookX, rope.hookY) ||
      terrain.isSolid(rope.hookX - 2, rope.hookY) ||
      terrain.isSolid(rope.hookX + 2, rope.hookY);

    if (!isHookSolid) {
      activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity;
      activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity;
      activeSlug.ropeState = null;
      addLog("Le support du grappin a cédé ! 💥", 'weapon');
      sfx.play('bounce');
      return;
    }

    const g = 20;
    let alpha = -(g / Math.max(25, rope.length)) * Math.sin(rope.angleRad);

    if (activeSlug.movingDir === 'left') alpha -= 0.15;
    else if (activeSlug.movingDir === 'right') alpha += 0.15;

    const prevAngle = rope.angleRad;
    const prevLength = rope.length;
    let targetLength = rope.length;
    if (activeSlug.steeringDir === 'left') targetLength = Math.max(25, rope.length - 4);
    else if (activeSlug.steeringDir === 'right') targetLength = Math.min(250, rope.length + 4);

    rope.angularVelocity = (rope.angularVelocity + alpha) * 0.993;
    const targetAngle = prevAngle + rope.angularVelocity;

    const angleDiff = targetAngle - prevAngle;
    const lengthDiff = targetLength - prevLength;
    const arcDist = Math.abs(angleDiff) * targetLength;
    const totalDist = arcDist + Math.abs(lengthDiff);
    const subSteps = Math.max(1, Math.min(16, Math.ceil(totalDist / 2.0)));

    let finalAngle = prevAngle;
    let finalLength = prevLength;
    let finalX = rope.hookX + Math.sin(prevAngle) * prevLength;
    let finalY = rope.hookY + Math.cos(prevAngle) * prevLength;
    let hitWall = false;

    for (let s = 1; s <= subSteps; s++) {
      const t = s / subSteps;
      const stepAngle = prevAngle + angleDiff * t;
      const stepLength = prevLength + lengthDiff * t;
      const stepX = rope.hookX + Math.sin(stepAngle) * stepLength;
      const stepY = rope.hookY + Math.cos(stepAngle) * stepLength;

      const isBodySolid =
        terrain.isSolid(Math.floor(stepX), Math.floor(stepY - 6)) ||
        terrain.isSolid(Math.floor(stepX - 6), Math.floor(stepY - 6)) ||
        terrain.isSolid(Math.floor(stepX + 6), Math.floor(stepY - 6));

      if (isBodySolid) {
        hitWall = true;
        break;
      }

      finalAngle = stepAngle;
      finalLength = stepLength;
      finalX = stepX;
      finalY = stepY;
    }

    if (hitWall) {
      rope.angularVelocity = -rope.angularVelocity * 0.45;
      rope.angleRad = finalAngle;
      rope.length = finalLength;
      sfx.play('bounce');
    } else {
      rope.angleRad = finalAngle;
      rope.length = finalLength;
    }

    const newX = finalX;
    const newY = finalY;
    if (newY >= terrain.data.waterLevel) {
      activeSlug.ropeState = null;
      activeSlug.y = terrain.data.waterLevel;
    } else {
      activeSlug.x = newX;
      activeSlug.y = newY;
      activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity;
      activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity;
    }
  } else {
    if (activeSlug.movingDir) {
      moveSlug(activeSlug.movingDir);
    }
    if (activeSlug.isChargingPower) {
      activeSlug.aimPower += 2.5;
      if (activeSlug.aimPower >= 100) {
        activeSlug.aimPower = 100;
        activeSlug.isChargingPower = false;
        fireWeapon(activeSlug.currentTargetPoint);
      }
    }
  }
}

export function updateBlowtorchTick(
  state: GameState,
  terrain: DestructibleTerrain,
  activeSlug: Slug,
  carveCrater: (x: number, y: number, r: number) => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
) {
  const activeTeam = state.teams.find((t) => t.id === activeSlug.teamId);
  const fuel = activeTeam ? activeTeam.inventory['blowtorch'] ?? 0 : 0;

  if (fuel <= 0) {
    activeSlug.isBlowtorching = false;
    if (activeTeam) activeTeam.inventory['blowtorch'] = 0;
    addLog(`Le réservoir du Chalumeau est vide ! ⛽`, 'info');
  } else {
    if (activeTeam) {
      activeTeam.inventory['blowtorch'] = Math.max(0, fuel - 1.43);
    }

    const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
    const dirX = Math.cos(angleRad);
    const dirY = Math.sin(angleRad);
    const flameX = activeSlug.x + dirX * 18;
    const flameY = activeSlug.y - 8 + dirY * 18;

    carveCrater(flameX, flameY, 18);
    state.explosions.push({
      id: `ex_bt_${Date.now()}_${Math.random()}`,
      x: flameX,
      y: flameY,
      radius: 18,
      damage: 0,
      createdAt: Date.now(),
    });

    activeSlug.x += dirX * 1.3;
    activeSlug.y += dirY * 1.3;

    for (const other of state.slugs) {
      if (other.id !== activeSlug.id && other.isAlive && Math.hypot(other.x - flameX, other.y - flameY) < 22) {
        const victimHpBefore = other.hp;
        const actualDamage = Math.min(victimHpBefore, 2);
        other.hp = Math.max(0, other.hp - 2);
        other.vx = dirX * 4;
        other.vy = dirY * 4 - 1;

        const victimTeam = state.teams.find((t) => t.id === other.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.damageTaken += actualDamage;
          if (other.hp === 0 && victimHpBefore > 0) victimTeam.stats.deaths++;
        }
      }
    }

    const curWaterY = state.waterLevel ?? terrain.data.waterLevel;
    if (activeSlug.y >= curWaterY) {
      activeSlug.isBlowtorching = false;
    }
  }
}

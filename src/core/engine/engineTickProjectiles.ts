import { GameState, Particle } from '../types';
import { DestructibleTerrain } from '../terrain';
import { getWeapon } from '../weapons/registry';
import { updateProjectilePhysics, applyExplosionToSlugs } from '../physics';
import { sfx } from '../audio';

export function updateProjectilesInTick(
  state: GameState,
  terrain: DestructibleTerrain,
  carveCrater: (x: number, y: number, r: number) => void,
  addLog: (msg: string, type: 'info' | 'combat' | 'weapon') => void
) {
  if (state.projectiles.length === 0) return;

  const remaining: typeof state.projectiles = [];
  for (const proj of state.projectiles) {
    if (Math.hypot(proj.vx, proj.vy) > 0.5 && state.particles.length < 40) {
      state.particles.push({
        x: proj.x - proj.vx * 0.8,
        y: proj.y - proj.vy * 0.8,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        color: Math.random() > 0.4 ? '#f97316' : '#71717a',
        size: Math.random() * 3 + 2,
        life: 1.0,
      });
    }

    const res = updateProjectilePhysics(proj, terrain, state.wind, state.slugs, state.magnets);
    if (res.carveStep) {
      carveCrater(res.carveStep.x, res.carveStep.y, res.carveStep.radius);
      if (state.particles.length < 50) {
        state.particles.push({
          x: res.carveStep.x,
          y: res.carveStep.y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 - 2,
          color: Math.random() > 0.5 ? '#713f12' : '#ca8a04',
          size: Math.random() * 4 + 3,
          life: 0.8,
        });
      }
    }

    if (res.landAsMine) {
      if (!state.mines) state.mines = [];
      state.mines.push({
        id: `mine_${Date.now()}_${Math.random()}`,
        x: res.landAsMine.x,
        y: res.landAsMine.y,
        isTriggered: false,
      });
      sfx.play('bounce');
      continue;
    }

    if (res.landAsMagnet) {
      if (!state.magnets) state.magnets = [];
      state.magnets.push({
        id: `magnet_${Date.now()}_${Math.random()}`,
        x: res.landAsMagnet.x,
        y: res.landAsMagnet.y,
        polarity: res.landAsMagnet.polarity,
        turnsRemaining: 3,
      });
      sfx.play('magnet');
      addLog(`🧲 Électroaimant (${res.landAsMagnet.polarity === 'ATTRACT' ? 'Attraction' : 'Répulsion'}) déployé pour 3 tours !`, 'weapon');
      continue;
    }

    if (res.exploded) {
      const pt = res.collisionPoint || { x: proj.x, y: proj.y };
      const weapon = getWeapon(proj.weaponId);
      const now = Date.now();

      carveCrater(pt.x, pt.y, weapon.radius);
      state.explosions.push({
        id: `ex_${now}_${Math.random()}`,
        x: pt.x,
        y: pt.y,
        radius: weapon.radius,
        damage: weapon.damage,
        customSound: weapon.customSoundKey,
        createdAt: now,
      });

      sfx.play('explosion');
      const expRes = applyExplosionToSlugs(pt.x, pt.y, weapon.radius, weapon.damage, state.slugs, terrain, state.teams, proj.ownerSlugId);
      for (const dm of expRes.damageEvents) {
        state.floatingDamages.push({
          id: `fd_${now}_${Math.random()}`,
          x: dm.x,
          y: dm.y,
          damage: dm.damage,
          createdAt: now,
        });
      }

      if (weapon.kineticImpulse) {
        const dirX = Math.sign(proj.vx) || 1;
        for (const dm of expRes.damageEvents) {
          const hitSlug = state.slugs.find((s) => s.id === dm.slugId);
          if (hitSlug && hitSlug.isAlive) {
            hitSlug.vx += dirX * weapon.kineticImpulse.pushForce;
            if (weapon.kineticImpulse.popUp !== undefined) {
              hitSlug.vy = Math.min(hitSlug.vy, weapon.kineticImpulse.popUp);
            }
          }
        }
      }

      if (weapon.onExplode) {
        const spawned = weapon.onExplode(proj, pt, state, terrain);
        if (spawned && spawned.length > 0) {
          remaining.push(...spawned);
        }
      }
    } else {
      remaining.push(proj);
    }
  }

  state.projectiles = remaining;
  if (state.projectiles.length === 0 && state.phase === 'PROJECTILE_ACTIVE') {
    state.phase = 'RESOLVING';
    state.phaseTimer = 5.0;
    state.settleTimer = 1.2;
  }
}

export function cleanupExpiredVFX(state: GameState, currentTime: number) {
  if (state.particles && state.particles.length > 0) {
    const remainingParticles: Particle[] = [];
    for (const p of state.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.04;
      if (p.life > 0) remainingParticles.push(p);
    }
    state.particles = remainingParticles;
  }

  state.explosions = state.explosions.filter(
    (ex) => currentTime - (ex.createdAt || currentTime) < 350
  );
  state.floatingDamages = (state.floatingDamages || []).filter(
    (fd) => currentTime - fd.createdAt < 1000
  );
}

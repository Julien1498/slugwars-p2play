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

    const res = updateProjectilePhysics(proj, terrain, state.wind, state.slugs);
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

      if (proj.weaponId === 'cluster_bomb') {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
          const speed = 3.5 + Math.random() * 3.5;
          remaining.push({
            id: `proj_cluster_frag_${now}_${i}_${Math.random()}`,
            weaponId: 'cluster_fragment',
            x: pt.x,
            y: pt.y - 4,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2.5,
            radius: 3.5,
            bounces: true,
            windAffected: false,
            fuseTimerMs: 1500 + Math.random() * 700,
            ownerSlugId: proj.ownerSlugId,
          });
        }
      } else if (proj.weaponId === 'banana_bomb') {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
          const speed = 4 + Math.random() * 4;
          remaining.push({
            id: `proj_bananette_${now}_${i}_${Math.random()}`,
            weaponId: 'cluster_banana',
            x: pt.x,
            y: pt.y - 6,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            radius: 4,
            bounces: true,
            windAffected: false,
            fuseTimerMs: 2000 + Math.random() * 800,
            ownerSlugId: proj.ownerSlugId,
          });
        }
      } else if (proj.weaponId === 'concrete_donkey') {
        const bouncesLeft = (proj.behaviorData?.bouncesLeft ?? 8) - 1;
        const curWaterY = state.waterLevel ?? terrain.data.waterLevel;
        // The Concrete Donkey pulverizes landmasses but sinks straight into the ocean without bouncing on water!
        if (bouncesLeft > 0 && pt.y < curWaterY - 15) {
          proj.x = pt.x + (Math.random() - 0.5) * 4;
          proj.y = pt.y - 14;
          proj.vx = (Math.random() - 0.5) * 2;
          proj.vy = -7.5;
          proj.behaviorData = { ...proj.behaviorData, bouncesLeft };
          sfx.play('donkey');
          addLog(`🫏 L'Âne de Béton pilonne et rebondit à travers le terrain ! (${bouncesLeft} impacts restants)`, 'combat');
          remaining.push(proj);
        } else if (pt.y >= curWaterY - 15) {
          sfx.play('splash');
          addLog(`🌊 L'Âne de Béton a coulé dans l'océan !`, 'combat');
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

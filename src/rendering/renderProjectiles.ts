import { ActiveProjectile } from '../core/types';
import {
  renderBazookaOrMissile,
  renderGrenade,
  renderHolyGrenade,
  renderBananaBomb,
  renderClusterBanana,
  renderDynamite,
  renderBuckshotPellet,
  renderClusterBomb,
  renderClusterFragment,
  renderBullet,
} from './projectiles/renderBallisticProjectiles';
import {
  renderAirStrikeBomb,
  renderHomingPigeon,
  renderSuperSheep,
  renderConcreteDonkey,
  renderStandardOrb,
} from './projectiles/renderSpecialProjectiles';
import {
  renderWalkingSheep,
  renderOldLady,
  renderMeteor,
} from './projectiles/renderMythicProjectiles';
import {
  renderBunkerBuster,
  renderParachuteMine,
  renderKamikaze,
} from './projectiles/renderAerialProjectiles';

export interface ProjectilesRenderContext {
  ctx: CanvasRenderingContext2D;
  projectiles: ActiveProjectile[];
  animTime: number;
  viewLeft?: number;
  viewRight?: number;
}

type ProjectileDrawerFn = (
  ctx: CanvasRenderingContext2D,
  proj: ActiveProjectile,
  animTime: number,
  angle: number
) => void;

export const PROJECTILE_DRAWERS: Record<string, ProjectileDrawerFn> = {
  bazooka: (ctx, proj, animTime) => renderBazookaOrMissile(ctx, proj, animTime),
  homing_missile: (ctx, proj, animTime) => renderBazookaOrMissile(ctx, proj, animTime),
  grenade: (ctx) => renderGrenade(ctx),
  cluster_bomb: (ctx) => renderClusterBomb(ctx),
  cluster_fragment: (ctx) => renderClusterFragment(ctx),
  air_strike: (ctx) => renderAirStrikeBomb(ctx),
  homing_pigeon: (ctx, _proj, animTime) => renderHomingPigeon(ctx, animTime),
  cluster_banana: (ctx) => renderClusterBanana(ctx),
  shotgun: (ctx) => renderBuckshotPellet(ctx),
  handgun: (ctx) => renderBullet(ctx, '#facc15'),
  uzi: (ctx) => renderBullet(ctx, '#fb923c'),
  super_sheep: (ctx, _proj, animTime) => renderSuperSheep(ctx, animTime),
  sheep: (ctx, proj, animTime) => renderWalkingSheep(ctx, proj, animTime),
  old_lady: (ctx, proj, animTime) => renderOldLady(ctx, proj, animTime),
  meteor: (ctx, proj, animTime) => renderMeteor(ctx, proj, animTime),
  bunker_buster: (ctx, proj, animTime) => renderBunkerBuster(ctx, proj, animTime),
  mine_strike: (ctx, proj, animTime) => renderParachuteMine(ctx, proj, animTime),
  kamikaze: (ctx, proj, animTime) => renderKamikaze(ctx, proj, animTime),
  holy_grenade: (ctx) => renderHolyGrenade(ctx),
  banana_bomb: (ctx) => renderBananaBomb(ctx),
  dynamite: (ctx, _proj, animTime) => renderDynamite(ctx, animTime),
  concrete_donkey: (ctx, _proj, _animTime, angle) => renderConcreteDonkey(ctx, angle),
};

export function renderProjectiles(rc: ProjectilesRenderContext) {
  const { ctx, projectiles, animTime, viewLeft, viewRight } = rc;

  for (const proj of projectiles) {
    if (viewLeft !== undefined && viewRight !== undefined && (proj.x < viewLeft - 80 || proj.x > viewRight + 80)) continue;
    ctx.save();
    ctx.translate(proj.x, proj.y);

    const angle = proj.interpolatedAngle !== undefined ? proj.interpolatedAngle : Math.atan2(proj.vy, proj.vx);
    if (Number.isFinite(angle)) {
      ctx.rotate(angle);
    }

    const drawer = PROJECTILE_DRAWERS[proj.weaponId];
    if (drawer) {
      drawer(ctx, proj, animTime, angle);
    } else {
      renderStandardOrb(ctx, proj);
    }

    // Bouncing Timer Countdown Badge
    if (proj.fuseTimerMs !== undefined && proj.fuseTimerMs > 0) {
      const sec = (proj.fuseTimerMs / 1000).toFixed(1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'extrabold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(`⚠️ ${sec}s`, 0, -12);
      ctx.fillText(`⚠️ ${sec}s`, 0, -12);
    }

    ctx.restore();
  }
}

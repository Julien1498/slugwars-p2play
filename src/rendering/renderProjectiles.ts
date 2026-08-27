import { ActiveProjectile } from '../core/types';
import {
  renderBazookaOrMissile,
  renderGrenade,
  renderHolyGrenade,
  renderBananaBomb,
  renderClusterBanana,
  renderDynamite,
  renderBuckshotPellet,
} from './projectiles/renderBallisticProjectiles';
import {
  renderAirStrikeBomb,
  renderHomingPigeon,
  renderSuperSheep,
  renderConcreteDonkey,
  renderStandardOrb,
} from './projectiles/renderSpecialProjectiles';

export interface ProjectilesRenderContext {
  ctx: CanvasRenderingContext2D;
  projectiles: ActiveProjectile[];
  animTime: number;
  viewLeft?: number;
  viewRight?: number;
}

export function renderProjectiles(rc: ProjectilesRenderContext) {
  const { ctx, projectiles, animTime, viewLeft, viewRight } = rc;

  for (const proj of projectiles) {
    if (viewLeft !== undefined && viewRight !== undefined && (proj.x < viewLeft - 80 || proj.x > viewRight + 80)) continue;
    ctx.save();
    ctx.translate(proj.x, proj.y);

    const angle = (proj as any).interpolatedAngle !== undefined ? (proj as any).interpolatedAngle : Math.atan2(proj.vy, proj.vx);
    if (Number.isFinite(angle)) {
      ctx.rotate(angle);
    }

    const wId = proj.weaponId;
    if (wId === 'bazooka' || wId === 'homing_missile') {
      renderBazookaOrMissile(ctx, proj, animTime);
    } else if (wId === 'grenade') {
      renderGrenade(ctx);
    } else if (wId === 'air_strike') {
      renderAirStrikeBomb(ctx);
    } else if (wId === 'homing_pigeon') {
      renderHomingPigeon(ctx, animTime);
    } else if (wId === 'cluster_banana') {
      renderClusterBanana(ctx);
    } else if (wId === 'shotgun') {
      renderBuckshotPellet(ctx);
    } else if (wId === 'super_sheep') {
      renderSuperSheep(ctx, animTime);
    } else if (wId === 'holy_grenade') {
      renderHolyGrenade(ctx);
    } else if (wId === 'banana_bomb') {
      renderBananaBomb(ctx);
    } else if (wId === 'dynamite') {
      renderDynamite(ctx, animTime);
    } else if (wId === 'concrete_donkey') {
      renderConcreteDonkey(ctx, angle);
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

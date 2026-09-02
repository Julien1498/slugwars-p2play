import { Slug } from '../../core/types';
import { SLUG_ARROW_PATH, SLUG_BADGE_PATH } from './slugGradients';

export function renderActiveArrow(
  ctx: CanvasRenderingContext2D,
  slug: Slug,
  animTime: number
): void {
  const arrowBounce = Math.sin(animTime * 1.5) * 3;
  const arrowY = slug.y - 46 + arrowBounce;
  ctx.save();
  ctx.translate(slug.x, arrowY);
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.4;
  ctx.fill(SLUG_ARROW_PATH);
  ctx.stroke(SLUG_ARROW_PATH);
  ctx.restore();
}

export function renderSlugBadge(
  ctx: CanvasRenderingContext2D,
  slug: Slug,
  teamColor: string
): void {
  const centerY = slug.y - 27;

  ctx.save();
  ctx.translate(slug.x, centerY);

  ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 1.4;
  ctx.fill(SLUG_BADGE_PATH);
  ctx.stroke(SLUG_BADGE_PATH);

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`${slug.hp}`, 0, 0);

  // Jetpack Fuel Gauge Bar
  if (slug.jetpackState) {
    const fuelRatio = Math.max(0, Math.min(1, (slug.jetpackState.fuelMs || 0) / 5000));
    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    ctx.fillRect(-14, -12, 28, 3);
    ctx.fillStyle = fuelRatio > 0.35 ? '#22c55e' : '#ef4444';
    ctx.fillRect(-14, -12, 28 * fuelRatio, 3);
  }

  ctx.restore();
}

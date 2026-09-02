import { Slug } from '../../core/types';
import { SLUG_ARROW_PATH } from './slugGradients';

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
  const badgeW = 38;
  const badgeH = 14;
  const badgeX = slug.x - badgeW / 2;
  const badgeY = slug.y - 34;

  ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
  ctx.strokeStyle = teamColor;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
  } else {
    ctx.rect(badgeX, badgeY, badgeW, badgeH);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`${slug.hp}`, slug.x, badgeY + badgeH / 2);

  // Jetpack Fuel Gauge Bar
  if (slug.jetpackState) {
    const fuelRatio = Math.max(0, Math.min(1, (slug.jetpackState.fuelMs || 0) / 5000));
    ctx.fillStyle = 'rgba(9, 9, 11, 0.8)';
    ctx.fillRect(slug.x - 14, badgeY - 5, 28, 3);
    ctx.fillStyle = fuelRatio > 0.35 ? '#22c55e' : '#ef4444';
    ctx.fillRect(slug.x - 14, badgeY - 5, 28 * fuelRatio, 3);
  }
}

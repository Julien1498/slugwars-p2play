import { Slug } from '../../core/types';

export function renderPowerChargingBar(ctx: CanvasRenderingContext2D, activeSlug: Slug) {
  const barW = 44;
  const barH = 7;
  const barX = activeSlug.x - barW / 2;
  const barY = activeSlug.y - 36;

  ctx.save();
  ctx.fillStyle = '#09090b';
  ctx.fillRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

  const pct = Math.min(1, Math.max(0.05, activeSlug.aimPower / 100));
  const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  pGrad.addColorStop(0, '#22c55e');
  pGrad.addColorStop(0.5, '#eab308');
  pGrad.addColorStop(1, '#ef4444');

  ctx.fillStyle = pGrad;
  ctx.fillRect(barX, barY, barW * pct, barH);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`⚡ ${Math.round(activeSlug.aimPower)}%`, activeSlug.x, barY - 3);
  ctx.restore();
}

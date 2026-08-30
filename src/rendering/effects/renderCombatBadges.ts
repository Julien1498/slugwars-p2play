import { Slug } from '../../core/types';

export interface ClientFloatingDamage {
  id: string;
  x: number;
  y: number;
  damage: number;
  text?: string;
  color?: string;
  startTime: number;
  duration: number;
}

export function renderFloatingDamages(
  ctx: CanvasRenderingContext2D,
  floatingDamages: ClientFloatingDamage[],
  viewLeft?: number,
  viewRight?: number
) {
  if (floatingDamages.length === 0) return;
  const now = performance.now();
  let writeIdx = 0;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000000';

  for (let i = 0; i < floatingDamages.length; i++) {
    const fd = floatingDamages[i];
    const elapsed = now - fd.startTime;
    const progress = Math.min(1, elapsed / fd.duration);

    if (progress < 1) {
      if (viewLeft === undefined || viewRight === undefined || (fd.x >= viewLeft - 80 && fd.x <= viewRight + 80)) {
        const alpha = Math.max(0, 1 - progress);
        const floatY = fd.y - progress * 35;

        ctx.globalAlpha = alpha;

        if (fd.text) {
          ctx.lineWidth = 3;
          ctx.font = 'black 13px Outfit, sans-serif';
          ctx.fillStyle = fd.color || '#c084fc';
          ctx.strokeText(fd.text, fd.x, floatY);
          ctx.fillText(fd.text, fd.x, floatY);
        } else {
          ctx.lineWidth = 2.5;
          ctx.font = 'extrabold 14px Outfit, sans-serif';
          const isHeal = fd.damage < 0;
          ctx.fillStyle = isHeal ? '#22c55e' : '#facc15';
          const text = isHeal ? `+${-fd.damage} HP` : `-${fd.damage}`;
          ctx.strokeText(text, fd.x, floatY);
          ctx.fillText(text, fd.x, floatY);
        }
      }

      floatingDamages[writeIdx++] = fd;
    }
  }
  ctx.restore();
  floatingDamages.length = writeIdx;
}

export function renderTombstones(
  ctx: CanvasRenderingContext2D,
  slugs: Slug[],
  waterLevel: number,
  viewLeft?: number,
  viewRight?: number
) {
  for (const slug of slugs) {
    if (slug.isAlive || !slug.isPlaced) continue;
    if (viewLeft !== undefined && viewRight !== undefined && (slug.x < viewLeft - 40 || slug.x > viewRight + 40)) continue;
    if (slug.y < waterLevel + 10) {
      ctx.save();
      ctx.translate(slug.x, slug.y);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const stoneGrad = ctx.createLinearGradient(0, -18, 0, 2);
      stoneGrad.addColorStop(0, '#94a3b8');
      stoneGrad.addColorStop(1, '#475569');
      ctx.fillStyle = stoneGrad;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(-7, -10);
      ctx.quadraticCurveTo(-7, -18, 0, -18);
      ctx.quadraticCurveTo(7, -18, 7, -10);
      ctx.lineTo(7, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, -14, 2, 8);
      ctx.fillRect(-3.5, -12, 7, 2);
      ctx.restore();
    }
  }
}

export function renderNinjaRopes(ctx: CanvasRenderingContext2D, slugs: Slug[]) {
  for (const s of slugs) {
    if (s.isAlive && s.ropeState) {
      const rope = s.ropeState;
      ctx.save();
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rope.hookX, rope.hookY);
      ctx.lineTo(s.x, s.y - 8);
      ctx.stroke();

      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rope.hookX, rope.hookY);
      ctx.lineTo(s.x, s.y - 8);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(rope.hookX, rope.hookY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

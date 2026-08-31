import { Slug } from '../../core/types';

export function renderSlugJetpack(ctx: CanvasRenderingContext2D, slug: Slug, animTime: number) {
  if (!slug.jetpackState) return;

  ctx.save();
  // Jetpack Thruster Tank on back
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(-10, -12, 6, 12, 2);
  } else {
    ctx.rect(-10, -12, 6, 12);
  }
  ctx.fill();
  ctx.stroke();

  // Nozzle
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, 0, 6, 3);

  // Flame exhaust when thrusting
  if (slug.jetpackState.isThrusting) {
    const flameH = 8 + Math.sin(animTime * 30) * 4;
    const flameGrad = ctx.createLinearGradient(-7, 3, -7, 3 + flameH);
    flameGrad.addColorStop(0, '#fef08a');
    flameGrad.addColorStop(0.4, '#f97316');
    flameGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-10, 3);
    ctx.lineTo(-4, 3);
    ctx.lineTo(-7, 3 + flameH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function renderSlugParachute(ctx: CanvasRenderingContext2D, slug: Slug, animTime: number) {
  if (!slug.isParachuting) return;

  ctx.save();
  ctx.translate(slug.x, slug.y);

  // Gentle sway
  const sway = Math.sin(animTime * 4) * 0.08;
  ctx.rotate(sway);

  // Parachute Canopy
  const canopyGrad = ctx.createLinearGradient(0, -50, 0, -28);
  canopyGrad.addColorStop(0, '#38bdf8');
  canopyGrad.addColorStop(0.5, '#0284c7');
  canopyGrad.addColorStop(1, '#0369a1');
  ctx.fillStyle = canopyGrad;
  ctx.strokeStyle = '#0c4a6e';
  ctx.lineWidth = 1.4;

  ctx.beginPath();
  ctx.arc(0, -32, 20, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // White Center Stripe
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(0, -32, 8, Math.PI, 0);
  ctx.fill();

  // Suspension Cords
  ctx.strokeStyle = 'rgba(241, 245, 249, 0.75)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-18, -32);
  ctx.lineTo(0, -10);
  ctx.moveTo(18, -32);
  ctx.lineTo(0, -10);
  ctx.moveTo(-7, -32);
  ctx.lineTo(0, -10);
  ctx.moveTo(7, -32);
  ctx.lineTo(0, -10);
  ctx.stroke();

  ctx.restore();
}

export function renderSlugDrill(ctx: CanvasRenderingContext2D, slug: Slug, animTime: number) {
  if (!slug.isDrilling) return;

  ctx.save();
  // Vibrating jackhammer bit underneath slug
  const shakeY = Math.sin(animTime * 45) * 2;
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;

  ctx.beginPath();
  ctx.moveTo(0, 2);
  ctx.lineTo(6, 2);
  ctx.lineTo(3, 12 + shakeY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

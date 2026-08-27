export interface ClientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export interface ClientExplosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  startTime: number;
  duration: number;
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: ClientParticle[],
  viewLeft?: number,
  viewRight?: number
) {
  if (particles.length === 0) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.035;

    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      if (viewLeft !== undefined && viewRight !== undefined && (p.x < viewLeft - 50 || p.x > viewRight + 50)) {
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life * 0.85);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;
}

export function renderClientExplosions(
  ctx: CanvasRenderingContext2D,
  explosions: ClientExplosion[],
  viewLeft?: number,
  viewRight?: number
) {
  const now = performance.now();
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    const elapsed = now - ex.startTime;
    const progress = Math.min(1, elapsed / ex.duration);
    const alpha = Math.max(0, 1 - progress);
    const safeRadius = ex.radius;

    if (progress >= 1) {
      explosions.splice(i, 1);
      continue;
    }

    if (viewLeft !== undefined && viewRight !== undefined && (ex.x < viewLeft - 120 || ex.x > viewRight + 120)) {
      continue;
    }

    // Shockwave
    const shockRadius = safeRadius * (0.3 + progress * 0.9);
    if (shockRadius > 0) {
      ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
      ctx.lineWidth = Math.max(1, 3.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, shockRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fireball
    const fireballRadius = safeRadius * (0.35 + progress * 0.65);
    const exGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, fireballRadius);
    exGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    exGrad.addColorStop(0.25, `rgba(250, 204, 21, ${alpha * 0.9})`);
    exGrad.addColorStop(0.65, `rgba(239, 68, 68, ${alpha * 0.7})`);
    exGrad.addColorStop(1, 'rgba(127, 29, 29, 0)');

    ctx.fillStyle = exGrad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, fireballRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
      explosions.splice(i, 1);
    }
  }
}

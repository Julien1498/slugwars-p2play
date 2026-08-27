import { Slug } from '../../core/types';
import { getGhostGrad } from './slugGradients';

export function renderGhostSpirits(
  ctx: CanvasRenderingContext2D,
  slugs: Slug[],
  animTime: number,
  slugDeathTimestamps: Map<string, number>
) {
  const now = performance.now();
  for (const slug of slugs) {
    if (!slug.isAlive) {
      const deathTime = slugDeathTimestamps.get(slug.id);
      if (deathTime) {
        const elapsed = (now - deathTime) / 1000;
        if (elapsed < 3.5) {
          const ghostY = slug.y - elapsed * 28;
          const ghostX = slug.x + Math.sin(elapsed * 4) * 6;
          const alpha = Math.max(0, 1 - elapsed / 3.5);

          ctx.save();
          ctx.translate(ghostX, ghostY);
          ctx.globalAlpha = alpha;

          // Golden Angelic Halo
          const haloY = -18 + Math.sin(animTime * 6) * 1.5;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, haloY, 5, 2, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Ghost Body
          ctx.fillStyle = getGhostGrad(ctx);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.2;

          const tailWave = Math.sin(animTime * 5 + slug.id.charCodeAt(0)) * 2;
          ctx.beginPath();
          ctx.moveTo(-6, 2);
          ctx.quadraticCurveTo(-7, -8, 0, -12);
          ctx.quadraticCurveTo(7, -8, 6, 2);
          ctx.quadraticCurveTo(4, 5 + tailWave, 2, 2);
          ctx.quadraticCurveTo(0, -1 - tailWave, -2, 2);
          ctx.quadraticCurveTo(-4, 5 + tailWave, -6, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cute Eyes & Blush
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-2, -6, 1.3, 0, Math.PI * 2);
          ctx.arc(2, -6, 1.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
          ctx.beginPath();
          ctx.arc(-3.5, -4, 1.2, 0, Math.PI * 2);
          ctx.arc(3.5, -4, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }
  }
}

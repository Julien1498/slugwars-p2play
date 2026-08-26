import { DecorItem } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

export function renderDecorItems(
  ctx: CanvasRenderingContext2D,
  terrain: DestructibleTerrain,
  decorItems: DecorItem[] | undefined,
  animTime: number
) {
  if (!decorItems) return;

  for (const item of decorItems) {
    if (item.destroyed) continue;

    if (item.type === 'hanging_leaf') {
      // Verify ceiling anchor is still solid (disappears if ceiling is destroyed!)
      const topSolid =
        terrain.isSolid(item.x, item.y - 1) ||
        terrain.isSolid(item.x, item.y - 2) ||
        terrain.isSolid(item.x - 2, item.y - 1) ||
        terrain.isSolid(item.x + 2, item.y - 1);

      if (!topSolid) {
        item.destroyed = true;
        continue;
      }

      ctx.save();
      ctx.translate(item.x, item.y);

      // HD Organic Swaying Jungle Vines & Creepers!
      const scale = item.scale || 1.0;
      ctx.scale(scale, scale);

      const sway = Math.sin(animTime * 1.8 + item.x) * 0.12;
      ctx.rotate(sway);

      // 1. Root Anchor Collar at Ceiling
      ctx.fillStyle = '#63310d';
      ctx.fillRect(-3, -2, 6, 3);

      // 2. Main Thin Vine Stem
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-4, 10, 2, 20);
      ctx.quadraticCurveTo(6, 28, 0, 36);
      ctx.stroke();

      // 3. Alternating Teardrop Tropical Leaves
      const leaves = [
        { x: -3, y: 7, rx: -0.4, size: 4 },
        { x: 3, y: 13, rx: 0.5, size: 4.5 },
        { x: -2, y: 19, rx: -0.6, size: 4 },
        { x: 4, y: 26, rx: 0.4, size: 3.5 },
        { x: 0, y: 36, rx: 0.1, size: 3 },
      ];

      ctx.fillStyle = '#22c55e';
      ctx.strokeStyle = '#166534';
      ctx.lineWidth = 0.8;
      for (const leaf of leaves) {
        ctx.beginPath();
        ctx.ellipse(leaf.x, leaf.y, leaf.size, leaf.size * 0.4, leaf.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    } else if (item.type === 'butterfly') {
      // Floating animated butterfly with sinusoidal fluttering path
      const flyX = item.x + Math.sin(animTime * 1.2 + item.x) * 16;
      const flyY = item.y + Math.cos(animTime * 1.5 + item.y) * 10;
      const flap = Math.abs(Math.sin(animTime * 8 + item.x));

      ctx.save();
      ctx.translate(flyX, flyY);

      // Wings
      ctx.save();
      ctx.scale(flap, 1);
      ctx.fillStyle =
        item.variant === 1
          ? '#f97316'
          : item.variant === 2
          ? '#38bdf8'
          : '#a855f7';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 0.8;

      // Left wing
      ctx.beginPath();
      ctx.ellipse(-5, -2, 5, 3.5, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.ellipse(5, -2, 5, 3.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wing inner pattern spots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -2, 1.2, 0, Math.PI * 2);
      ctx.arc(5, -2, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Body & Antennae
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-1, -4, 2, 7);

      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(-0.5, -4);
      ctx.lineTo(-2.5, -7);
      ctx.moveTo(0.5, -4);
      ctx.lineTo(2.5, -7);
      ctx.stroke();

      ctx.restore();
    }
  }
}

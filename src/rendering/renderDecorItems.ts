import { DecorItem } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

function addCircle(p: Path2D, cx: number, cy: number, r: number) {
  p.moveTo(cx + r, cy);
  p.arc(cx, cy, r, 0, Math.PI * 2);
}

function addEllipse(p: Path2D, cx: number, cy: number, rx: number, ry: number, rot: number = 0) {
  const startX = cx + rx * Math.cos(rot);
  const startY = cy + rx * Math.sin(rot);
  p.moveTo(startX, startY);
  p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}

// --- PRE-COMPILED VECTOR GEOMETRIES FOR DECOR (Instant GPU Execution) ---
const VINE_STEM = createPath((p) => {
  p.moveTo(0, 0);
  p.quadraticCurveTo(-4, 10, 2, 20);
  p.quadraticCurveTo(6, 28, 0, 36);
});

const VINE_ALL_LEAVES = createPath((p) => {
  const leaves = [
    { x: -3, y: 7, rx: -0.4, size: 4 },
    { x: 3, y: 13, rx: 0.5, size: 4.5 },
    { x: -2, y: 19, rx: -0.6, size: 4 },
    { x: 4, y: 26, rx: 0.4, size: 3.5 },
    { x: 0, y: 36, rx: 0.1, size: 3 },
  ];
  for (const leaf of leaves) {
    addEllipse(p, leaf.x, leaf.y, leaf.size, leaf.size * 0.4, leaf.rx);
  }
});

const BUTTERFLY_WINGS = createPath((p) => {
  addEllipse(p, -5, -2, 5, 3.5, -0.4);
  addEllipse(p, 5, -2, 5, 3.5, 0.4);
});

const BUTTERFLY_SPOTS = createPath((p) => {
  addCircle(p, -5, -2, 1.2);
  addCircle(p, 5, -2, 1.2);
});

const BUTTERFLY_ANTENNAE = createPath((p) => {
  p.moveTo(-0.5, -4);
  p.lineTo(-2.5, -7);
  p.moveTo(0.5, -4);
  p.lineTo(2.5, -7);
});

export function renderDecorItems(
  ctx: CanvasRenderingContext2D,
  terrain: DestructibleTerrain,
  decorItems: DecorItem[] | undefined,
  animTime: number,
  viewLeft?: number,
  viewRight?: number,
  cameraScale: number = 1.0
) {
  if (!decorItems) return;
  const isHighDetail = cameraScale >= 0.75;

  for (const item of decorItems) {
    if (item.destroyed) continue;

    if (viewLeft !== undefined && viewRight !== undefined) {
      if (item.x < viewLeft - 60 || item.x > viewRight + 60) continue;
    }

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
      ctx.stroke(VINE_STEM);

      // 3. Alternating Teardrop Tropical Leaves (Single Batch Call for all 5 leaves)
      ctx.fillStyle = '#22c55e';
      ctx.fill(VINE_ALL_LEAVES);
      if (isHighDetail) {
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 0.8;
        ctx.stroke(VINE_ALL_LEAVES);
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

      // Both wings (Single Batch Call)
      ctx.fill(BUTTERFLY_WINGS);
      ctx.stroke(BUTTERFLY_WINGS);

      if (isHighDetail) {
        // Wing inner pattern spots (Single Batch Call)
        ctx.fillStyle = '#ffffff';
        ctx.fill(BUTTERFLY_SPOTS);
      }

      ctx.restore();

      // Body & Antennae
      ctx.fillStyle = '#18181b';
      ctx.fillRect(-1, -4, 2, 7);

      if (isHighDetail) {
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 0.7;
        ctx.stroke(BUTTERFLY_ANTENNAE);
      }

      ctx.restore();
    }
  }
}

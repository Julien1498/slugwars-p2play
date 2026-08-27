import { PlacedGirder, CraterRecord, ExplosionEvent } from '../../core/types';

const _girderCratersBuffer: { x: number; y: number; radius: number }[] = [];

export function renderHDDestructibleGirder(
  ctx: CanvasRenderingContext2D,
  g: PlacedGirder,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  grid: Uint8Array,
  width: number,
  terrainRevision?: number
) {
  if (g.destroyed) return;

  const rad = (g.angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfL = g.length / 2;
  const halfT = g.thickness / 2;

  // Foundation stability check: only re-evaluate pixel scan when terrain has actually been modified
  if (terrainRevision !== undefined && (g as any)._lastFoundationRev === terrainRevision) {
    if (!(g as any)._isFoundationSolid) {
      g.destroyed = true;
      return;
    }
  } else {
    let solidCount = 0;
    const totalSamples = 13;
    for (let s = 0; s < totalSamples; s++) {
      const t = -halfL + (s / (totalSamples - 1)) * g.length;
      const px = Math.round(g.x + t * cos);
      const py = Math.round(g.y + t * sin);
      const idx = py * width + px;
      if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
        solidCount++;
      }
    }
    (g as any)._lastFoundationRev = terrainRevision;
    (g as any)._isFoundationSolid = solidCount > 0;

    if (solidCount === 0) {
      g.destroyed = true;
      return;
    }
  }

  const girderRadius = Math.max(g.length, g.thickness) * 0.65;

  _girderCratersBuffer.length = 0;
  if (craters) {
    const minIndex = g.initialCraterCount !== undefined ? g.initialCraterCount : 0;
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      // Ignore craters that existed before this girder was placed
      if (g.initialCraterCount !== undefined) {
        if (i < minIndex) continue;
      } else if (g.createdAt && c.createdAt && c.createdAt < g.createdAt) {
        continue;
      }
      const dist = Math.hypot(c.x - g.x, c.y - g.y);
      if (dist <= c.radius + girderRadius) {
        _girderCratersBuffer.push(c);
      }
    }
  }

  if (explosions) {
    for (let i = 0; i < explosions.length; i++) {
      const ex = explosions[i];
      const dist = Math.hypot(ex.x - g.x, ex.y - g.y);
      if (dist <= ex.radius + girderRadius) {
        _girderCratersBuffer.push(ex);
      }
    }
  }

  ctx.save();

  if (_girderCratersBuffer.length > 0) {
    for (let i = 0; i < _girderCratersBuffer.length; i++) {
      const c = _girderCratersBuffer[i];
      const notCircle = new Path2D();
      notCircle.rect(g.x - 200, g.y - 200, 400, 400);
      notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.clip(notCircle, 'evenodd');
    }
  }

  ctx.translate(g.x, g.y);
  ctx.rotate(rad);

  ctx.fillStyle = '#475569';
  ctx.fillRect(-halfL, -halfT, g.length, g.thickness);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-halfL, -halfT, g.length, g.thickness);

  ctx.fillStyle = '#facc15';
  for (let i = -halfL + 6; i < halfL - 6; i += 16) {
    ctx.fillRect(i, -halfT + 2, 6, g.thickness - 4);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(-halfL + 4, 0, 1.5, 0, Math.PI * 2);
  ctx.arc(halfL - 4, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

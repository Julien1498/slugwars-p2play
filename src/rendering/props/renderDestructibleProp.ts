import { SolidProp, CraterRecord, ExplosionEvent } from '../../core/types';
import { SOLID_PROP_DRAWERS, drawSolidPropWithCache } from './propSpriteCache';

export { SOLID_PROP_DRAWERS };

export function drawSolidPropVector(ctx: CanvasRenderingContext2D, sprop: SolidProp, _animTime: number = 0) {
  if (typeof ctx.save !== 'function') return;
  ctx.save();
  ctx.translate(Math.round(sprop.x), Math.round(sprop.y));
  if (sprop.angleRad) {
    ctx.rotate(sprop.angleRad);
  }

  // 1. High-DPI Retina supersampled sprite cache (single fast drawImage blit)
  const handled = drawSolidPropWithCache(ctx, sprop);
  if (!handled) {
    // 2. Seamless fallback to direct vector drawing
    const drawer = SOLID_PROP_DRAWERS[sprop.type];
    if (drawer) drawer(ctx, sprop);
  }

  ctx.restore();
}

interface FoundationCache {
  revision: number;
  isSolid: boolean;
}

const _propFoundationCache = new WeakMap<SolidProp, FoundationCache>();

export function renderHDDestructibleProp(
  ctx: CanvasRenderingContext2D,
  sprop: SolidProp,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  animTime: number,
  grid: Uint8Array,
  width: number,
  terrainRevision?: number
) {
  if (sprop.destroyed) return;

  // Check foundation stability: only re-evaluate pixel scan when terrain has actually been modified
  const cached = _propFoundationCache.get(sprop);
  if (terrainRevision !== undefined && cached && cached.revision === terrainRevision) {
    if (!cached.isSolid) {
      sprop.destroyed = true;
      return;
    }
  } else {
    const halfW = Math.max(4, Math.floor(sprop.width / 2));
    let solidFoundationCount = 0;
    for (let ox = -halfW; ox <= halfW; ox += Math.max(1, Math.floor(halfW / 2))) {
      const gx = Math.floor(sprop.x + ox);
      const gy = Math.floor(sprop.y + 1);
      const idx = gy * width + gx;
      if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
        solidFoundationCount++;
      }
    }
    const isSolid = solidFoundationCount > 0;
    _propFoundationCache.set(sprop, {
      revision: terrainRevision ?? 0,
      isSolid,
    });

    if (!isSolid) {
      sprop.destroyed = true;
      return;
    }
  }
  drawSolidPropVector(ctx, sprop, animTime);
}

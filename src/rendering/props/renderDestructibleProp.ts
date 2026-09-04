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

interface PropClipCache {
  fingerprint: string;
  paths: Path2D[];
}

const _propFoundationCache = new WeakMap<SolidProp, FoundationCache>();
const _propClipCache = new WeakMap<SolidProp, PropClipCache>();
const _overlappingCratersBuffer: { x: number; y: number; radius: number }[] = [];

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

  const angle = sprop.angleRad || 0;
  const halfH = sprop.height / 2;
  const propCenterX = angle ? sprop.x + halfH * Math.sin(angle) : sprop.x;
  const propCenterY = angle ? sprop.y - halfH * Math.cos(angle) : sprop.y - halfH;
  const propRadius = Math.ceil(Math.hypot(sprop.width / 2, halfH)) + 4;

  _overlappingCratersBuffer.length = 0;
  if (craters) {
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      if (!c || c.radius <= 0) continue;
      if (sprop.createdAt && c.createdAt && c.createdAt < sprop.createdAt) continue;
      const dx = c.x - propCenterX;
      const dy = c.y - propCenterY;
      const maxDist = c.radius + propRadius;
      if (dx * dx + dy * dy <= maxDist * maxDist) {
        _overlappingCratersBuffer.push(c);
      }
    }
  }

  if (explosions) {
    for (let i = 0; i < explosions.length; i++) {
      const ex = explosions[i];
      if (!ex || ex.radius <= 0) continue;
      if (sprop.createdAt && ex.createdAt && ex.createdAt < sprop.createdAt) continue;
      const dx = ex.x - propCenterX;
      const dy = ex.y - propCenterY;
      const maxDist = ex.radius + propRadius;
      if (dx * dx + dy * dy <= maxDist * maxDist) {
        let isDuplicate = false;
        for (let j = 0; j < _overlappingCratersBuffer.length; j++) {
          const existing = _overlappingCratersBuffer[j];
          if (
            Math.abs(existing.x - ex.x) < 1 &&
            Math.abs(existing.y - ex.y) < 1 &&
            Math.abs(existing.radius - ex.radius) < 1
          ) {
            isDuplicate = true;
            break;
          }
        }
        if (!isDuplicate) {
          _overlappingCratersBuffer.push(ex);
        }
      }
    }
  }

  // Memoize crater clipping geometry to eliminate per-frame Path2D allocations
  if (_overlappingCratersBuffer.length > 0 && typeof ctx.clip === 'function' && typeof ctx.save === 'function') {
    let fp = '';
    for (let i = 0; i < _overlappingCratersBuffer.length; i++) {
      const c = _overlappingCratersBuffer[i];
      fp += `${Math.round(c.x)}_${Math.round(c.y)}_${Math.round(c.radius)},`;
    }

    let clipCache = _propClipCache.get(sprop);
    if (!clipCache || clipCache.fingerprint !== fp) {
      const paths: Path2D[] = [];
      for (let i = 0; i < _overlappingCratersBuffer.length; i++) {
        const c = _overlappingCratersBuffer[i];
        if (typeof Path2D !== 'undefined') {
          const notCircle = new Path2D();
          const distToCrater = Math.hypot(c.x - propCenterX, c.y - propCenterY) + c.radius;
          const halfBox = Math.ceil(Math.max(distToCrater, propRadius)) + 64;
          const boxSize = halfBox * 2;
          if (typeof notCircle.rect === 'function') {
            notCircle.rect(propCenterX - halfBox, propCenterY - halfBox, boxSize, boxSize);
          }
          if (typeof notCircle.arc === 'function') {
            notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          }
          paths.push(notCircle);
        }
      }
      clipCache = { fingerprint: fp, paths };
      _propClipCache.set(sprop, clipCache);
    }

    if (clipCache && clipCache.paths.length > 0) {
      ctx.save();
      for (let i = 0; i < clipCache.paths.length; i++) {
        ctx.clip(clipCache.paths[i], 'evenodd');
      }
      drawSolidPropVector(ctx, sprop, animTime);
      ctx.restore();
      return;
    }

    if (typeof Path2D === 'undefined') {
      ctx.save();
      for (let i = 0; i < _overlappingCratersBuffer.length; i++) {
        const c = _overlappingCratersBuffer[i];
        const distToCrater = Math.hypot(c.x - propCenterX, c.y - propCenterY) + c.radius;
        const halfBox = Math.ceil(Math.max(distToCrater, propRadius)) + 64;
        const boxSize = halfBox * 2;
        ctx.beginPath();
        if (typeof ctx.rect === 'function') ctx.rect(propCenterX - halfBox, propCenterY - halfBox, boxSize, boxSize);
        if (typeof ctx.arc === 'function') ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
        ctx.clip('evenodd');
      }
      drawSolidPropVector(ctx, sprop, animTime);
      ctx.restore();
      return;
    }
  }

  drawSolidPropVector(ctx, sprop, animTime);
}

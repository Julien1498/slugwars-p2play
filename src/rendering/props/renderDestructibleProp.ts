import { SolidProp, CraterRecord, ExplosionEvent } from '../../core/types';
import { drawTreeProp, drawMushroomProp, drawFlowerProp, drawCactusProp } from './renderVegetationProps';
import { drawBunkerProp, drawTotemProp, drawOilDrumProp, drawLamppostProp } from './renderStructuralProps';
import { drawCrystalProp } from './renderMineralProps';
import { drawHedgehogProp, drawChickProp } from './renderCritterProps';

export const SOLID_PROP_DRAWERS: Record<
  SolidProp['type'],
  (ctx: CanvasRenderingContext2D, sprop: SolidProp) => void
> = {
  hedgehog: (ctx) => drawHedgehogProp(ctx),
  chick: (ctx) => drawChickProp(ctx),
  mushroom: (ctx, sprop) => drawMushroomProp(ctx, sprop),
  flower: (ctx, sprop) => drawFlowerProp(ctx, sprop),
  tree: (ctx, sprop) => drawTreeProp(ctx, sprop),
  bunker: (ctx) => drawBunkerProp(ctx),
  totem: (ctx, sprop) => drawTotemProp(ctx, sprop),
  cactus: (ctx, sprop) => drawCactusProp(ctx, sprop),
  crystal: (ctx, sprop) => drawCrystalProp(ctx, sprop),
  oil_drum: (ctx, sprop) => drawOilDrumProp(ctx, sprop),
  lamppost: (ctx) => drawLamppostProp(ctx),
};

export function drawSolidPropVector(ctx: CanvasRenderingContext2D, sprop: SolidProp, _animTime: number = 0) {
  const drawer = SOLID_PROP_DRAWERS[sprop.type];
  if (!drawer) return;

  ctx.save();
  ctx.translate(sprop.x, sprop.y);
  if (sprop.angleRad) {
    ctx.rotate(sprop.angleRad);
  }
  drawer(ctx, sprop);
  ctx.restore();
}

interface FoundationCache {
  revision: number;
  isSolid: boolean;
}

const _propFoundationCache = new WeakMap<SolidProp, FoundationCache>();
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

  const propRadius = Math.max(sprop.width, sprop.height) * 0.85;
  const propCenterY = sprop.y - sprop.height / 2;

  _overlappingCratersBuffer.length = 0;

  if (craters) {
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      const dist = Math.hypot(c.x - sprop.x, c.y - propCenterY);
      if (dist <= c.radius + propRadius) {
        _overlappingCratersBuffer.push(c);
      }
    }
  }
  if (explosions) {
    for (let i = 0; i < explosions.length; i++) {
      const ex = explosions[i];
      const dist = Math.hypot(ex.x - sprop.x, ex.y - propCenterY);
      if (dist <= ex.radius + propRadius) {
        _overlappingCratersBuffer.push(ex);
      }
    }
  }

  if (_overlappingCratersBuffer.length === 0) {
    drawSolidPropVector(ctx, sprop, animTime);
    return;
  }

  ctx.save();
  for (let i = 0; i < _overlappingCratersBuffer.length; i++) {
    const c = _overlappingCratersBuffer[i];
    const notCircle = new Path2D();
    notCircle.rect(sprop.x - 200, sprop.y - 200, 400, 400);
    notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.clip(notCircle, 'evenodd');
  }

  drawSolidPropVector(ctx, sprop, animTime);
  ctx.restore();
}

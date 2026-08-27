import { SolidProp, CraterRecord, ExplosionEvent } from '../../core/types';
import { drawTreeProp, drawMushroomProp, drawFlowerProp, drawCactusProp } from './renderVegetationProps';
import { drawBunkerProp, drawTotemProp, drawOilDrumProp, drawLamppostProp } from './renderStructuralProps';
import { drawCrystalProp } from './renderMineralProps';
import { drawHedgehogProp, drawChickProp } from './renderCritterProps';

export function drawSolidPropVector(ctx: CanvasRenderingContext2D, sprop: SolidProp, _animTime: number = 0) {
  ctx.save();
  ctx.translate(sprop.x, sprop.y);
  if (sprop.angleRad) {
    ctx.rotate(sprop.angleRad);
  }

  if (sprop.type === 'hedgehog') {
    drawHedgehogProp(ctx);
  } else if (sprop.type === 'chick') {
    drawChickProp(ctx);
  } else if (sprop.type === 'mushroom') {
    drawMushroomProp(ctx, sprop);
  } else if (sprop.type === 'flower') {
    drawFlowerProp(ctx, sprop);
  } else if (sprop.type === 'tree') {
    drawTreeProp(ctx, sprop);
  } else if (sprop.type === 'bunker') {
    drawBunkerProp(ctx);
  } else if (sprop.type === 'totem') {
    drawTotemProp(ctx, sprop);
  } else if (sprop.type === 'cactus') {
    drawCactusProp(ctx, sprop);
  } else if (sprop.type === 'crystal') {
    drawCrystalProp(ctx, sprop);
  } else if (sprop.type === 'oil_drum') {
    drawOilDrumProp(ctx, sprop);
  } else if (sprop.type === 'lamppost') {
    drawLamppostProp(ctx);
  }

  ctx.restore();
}

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
  if (terrainRevision !== undefined && (sprop as any)._lastFoundationRev === terrainRevision) {
    if (!(sprop as any)._isFoundationSolid) {
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
    (sprop as any)._lastFoundationRev = terrainRevision;
    (sprop as any)._isFoundationSolid = solidFoundationCount > 0;

    if (solidFoundationCount === 0) {
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

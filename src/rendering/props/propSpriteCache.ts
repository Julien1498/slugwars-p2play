import { SolidProp } from '../../core/types';
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

export interface CachedPropSprite {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
  boxW: number;
  boxH: number;
}

// Master switch: can be toggled on/off to test or benchmark resolution
export let ENABLE_PROP_SPRITE_CACHE = true;
export function setPropSpriteCacheEnabled(enabled: boolean): void {
  ENABLE_PROP_SPRITE_CACHE = enabled;
}

// Retina supersampling factor: 2.5x ensures 100% crispness and zero blurriness even under camera zoom
const SUPERSAMPLE_SCALE = 2.5;

const _propSpriteMap = new Map<string, CachedPropSprite>();

export function clearPropSpriteCache(): void {
  _propSpriteMap.clear();
}

export function getCachedPropSprite(sprop: SolidProp): CachedPropSprite | null {
  if (typeof document === 'undefined') return null;

  const key = `${sprop.type}_v${sprop.variant ?? 0}`;
  let cached = _propSpriteMap.get(key);
  if (cached) return cached;

  const drawer = SOLID_PROP_DRAWERS[sprop.type];
  if (!drawer) return null;

  const padX = 24;
  const padBottom = 12;
  const padTop = 18;
  const boxW = (sprop.width || 40) + padX * 2;
  const boxH = (sprop.height || 40) + padTop + padBottom;

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(boxW * SUPERSAMPLE_SCALE);
  canvas.height = Math.ceil(boxH * SUPERSAMPLE_SCALE);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const originX = boxW / 2;
  const originY = boxH - padBottom;

  ctx.save();
  ctx.scale(SUPERSAMPLE_SCALE, SUPERSAMPLE_SCALE);
  ctx.translate(originX, originY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawer(ctx, sprop);
  ctx.restore();

  cached = { canvas, originX, originY, boxW, boxH };
  _propSpriteMap.set(key, cached);
  return cached;
}

export function drawSolidPropWithCache(
  ctx: CanvasRenderingContext2D,
  sprop: SolidProp
): boolean {
  if (!ENABLE_PROP_SPRITE_CACHE) return false;

  const sprite = getCachedPropSprite(sprop);
  if (!sprite) return false;

  ctx.drawImage(
    sprite.canvas,
    -sprite.originX,
    -sprite.originY,
    sprite.boxW,
    sprite.boxH
  );
  return true;
}

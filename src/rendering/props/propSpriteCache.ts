import { SolidProp } from '../../core/types';
import { renderSettings } from '../../core/perf/renderSettings';
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
  bitmap: ImageBitmap | null;
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

const SUPERSAMPLE_SCALE = 1.0;

const _propSpriteMap = new Map<string, CachedPropSprite>();

export function clearPropSpriteCache(): void {
  for (const sprite of _propSpriteMap.values()) {
    if (sprite.bitmap && typeof sprite.bitmap.close === 'function') {
      try {
        sprite.bitmap.close();
      } catch {
        // Safe disposal
      }
    }
  }
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
  const boxW = Math.ceil((sprop.width || 40) + padX * 2);
  const boxH = Math.ceil((sprop.height || 40) + padTop + padBottom);

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(boxW * SUPERSAMPLE_SCALE);
  canvas.height = Math.ceil(boxH * SUPERSAMPLE_SCALE);

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const originX = Math.round(boxW / 2);
  const originY = Math.round(boxH - padBottom);

  if (typeof ctx.save === 'function') ctx.save();
  if (typeof ctx.scale === 'function' && SUPERSAMPLE_SCALE !== 1.0) {
    ctx.scale(SUPERSAMPLE_SCALE, SUPERSAMPLE_SCALE);
  }
  if (typeof ctx.translate === 'function') ctx.translate(originX, originY);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  drawer(ctx, sprop);
  if (typeof ctx.restore === 'function') ctx.restore();

  cached = { canvas, bitmap: null, originX, originY, boxW, boxH };
  _propSpriteMap.set(key, cached);

  if (typeof createImageBitmap === 'function') {
    createImageBitmap(canvas)
      .then((bmp) => {
        if (cached) cached.bitmap = bmp;
      })
      .catch(() => {
        // Fallback to canvas
      });
  }

  return cached;
}

export function drawSolidPropWithCache(
  ctx: CanvasRenderingContext2D,
  sprop: SolidProp
): boolean {
  if (!ENABLE_PROP_SPRITE_CACHE && !renderSettings.getPropsMipmapEnabled()) return false;
  if (typeof ctx.drawImage !== 'function') return false;

  const sprite = getCachedPropSprite(sprop);
  if (!sprite) return false;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const source: CanvasImageSource = sprite.bitmap ?? sprite.canvas;
  ctx.drawImage(
    source,
    -sprite.originX,
    -sprite.originY,
    sprite.boxW,
    sprite.boxH
  );
  return true;
}

export function warmupPropSpriteCache(): void {
  if (typeof document === 'undefined') return;
  const dummyProps: SolidProp[] = [
    { id: 'w_bunker_0', type: 'bunker', x: 0, y: 0, width: 38, height: 26, variant: 0 },
    { id: 'w_bunker_1', type: 'bunker', x: 0, y: 0, width: 38, height: 26, variant: 1 },
    { id: 'w_totem_0', type: 'totem', x: 0, y: 0, width: 26, height: 36, variant: 0 },
    { id: 'w_totem_1', type: 'totem', x: 0, y: 0, width: 26, height: 36, variant: 1 },
    { id: 'w_cactus_0', type: 'cactus', x: 0, y: 0, width: 24, height: 38, variant: 0 },
    { id: 'w_cactus_1', type: 'cactus', x: 0, y: 0, width: 24, height: 38, variant: 1 },
    { id: 'w_cactus_2', type: 'cactus', x: 0, y: 0, width: 24, height: 38, variant: 2 },
    { id: 'w_crystal_0', type: 'crystal', x: 0, y: 0, width: 28, height: 26, variant: 0 },
    { id: 'w_crystal_1', type: 'crystal', x: 0, y: 0, width: 28, height: 26, variant: 1 },
    { id: 'w_crystal_2', type: 'crystal', x: 0, y: 0, width: 28, height: 26, variant: 2 },
    { id: 'w_oil_drum_0', type: 'oil_drum', x: 0, y: 0, width: 20, height: 26, variant: 0 },
    { id: 'w_oil_drum_1', type: 'oil_drum', x: 0, y: 0, width: 20, height: 26, variant: 1 },
    { id: 'w_lamppost_0', type: 'lamppost', x: 0, y: 0, width: 18, height: 42 },
    { id: 'w_tree_0', type: 'tree', x: 0, y: 0, width: 32, height: 48, variant: 0 },
    { id: 'w_tree_1', type: 'tree', x: 0, y: 0, width: 32, height: 48, variant: 1 },
    { id: 'w_hedgehog_0', type: 'hedgehog', x: 0, y: 0, width: 26, height: 22 },
    { id: 'w_chick_0', type: 'chick', x: 0, y: 0, width: 28, height: 24 },
    { id: 'w_mushroom_0', type: 'mushroom', x: 0, y: 0, width: 22, height: 22, variant: 0 },
    { id: 'w_mushroom_1', type: 'mushroom', x: 0, y: 0, width: 22, height: 22, variant: 1 },
    { id: 'w_mushroom_2', type: 'mushroom', x: 0, y: 0, width: 22, height: 22, variant: 2 },
    { id: 'w_flower_0', type: 'flower', x: 0, y: 0, width: 20, height: 24, variant: 0 },
    { id: 'w_flower_1', type: 'flower', x: 0, y: 0, width: 20, height: 24, variant: 1 },
    { id: 'w_flower_2', type: 'flower', x: 0, y: 0, width: 20, height: 24, variant: 2 },
    { id: 'w_flower_3', type: 'flower', x: 0, y: 0, width: 20, height: 24, variant: 3 },
  ];
  for (let i = 0; i < dummyProps.length; i++) {
    getCachedPropSprite(dummyProps[i]);
  }
}

if (typeof window !== 'undefined') {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(() => warmupPropSpriteCache());
  } else {
    setTimeout(() => warmupPropSpriteCache(), 100);
  }
}

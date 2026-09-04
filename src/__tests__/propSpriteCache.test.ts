import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCachedPropSprite,
  drawSolidPropWithCache,
  ENABLE_PROP_SPRITE_CACHE,
  setPropSpriteCacheEnabled,
  clearPropSpriteCache,
  warmupPropSpriteCache,
} from '../rendering/props/propSpriteCache';
import { SolidProp } from '../core/types';

describe('PropSpriteCache - Retina Supersampled Cache & ImageBitmap', () => {
  beforeEach(() => {
    clearPropSpriteCache();
    setPropSpriteCacheEnabled(true);
  });

  const sampleProp: SolidProp = {
    id: 'prop_tree_1',
    type: 'tree',
    x: 100,
    y: 200,
    width: 60,
    height: 80,
    variant: 0,
  };

  it('draws with cache when enabled and canvas is available', () => {
    const mockCtx = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const handled = drawSolidPropWithCache(mockCtx, sampleProp);
    if (typeof document !== 'undefined') {
      expect(handled).toBe(true);
      expect(mockCtx.drawImage).toHaveBeenCalledTimes(1);
    }
  });

  it('respects setPropSpriteCacheEnabled master toggle', () => {
    const mockCtx = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    setPropSpriteCacheEnabled(false);
    expect(ENABLE_PROP_SPRITE_CACHE).toBe(false);

    const handled = drawSolidPropWithCache(mockCtx, sampleProp);
    expect(handled).toBe(false);
    expect(mockCtx.drawImage).not.toHaveBeenCalled();
  });

  it('returns cached sprite for repeated requests without re-allocating', () => {
    if (typeof document === 'undefined') return;

    const sprite1 = getCachedPropSprite(sampleProp);
    const sprite2 = getCachedPropSprite(sampleProp);

    expect(sprite1).not.toBeNull();
    expect(sprite1).toBe(sprite2);
  });

  it('closes ImageBitmap objects upon clearPropSpriteCache', () => {
    if (typeof document === 'undefined') return;

    const sprite = getCachedPropSprite(sampleProp);
    if (sprite) {
      const mockClose = vi.fn();
      sprite.bitmap = { close: mockClose } as unknown as ImageBitmap;

      clearPropSpriteCache();
      expect(mockClose).toHaveBeenCalledTimes(1);
    }
  });

  it('prefers sprite.bitmap over sprite.canvas in drawSolidPropWithCache when available', () => {
    if (typeof document === 'undefined') return;

    const mockCtx = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const sprite = getCachedPropSprite(sampleProp);
    if (sprite) {
      const dummyBitmap = { id: 'gpu_texture_bitmap' } as unknown as ImageBitmap;
      sprite.bitmap = dummyBitmap;

      drawSolidPropWithCache(mockCtx, sampleProp);
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        dummyBitmap,
        -sprite.originX,
        -sprite.originY,
        sprite.boxW,
        sprite.boxH
      );
    }
  });

  it('executes warmupPropSpriteCache without errors', () => {
    expect(() => {
      warmupPropSpriteCache();
    }).not.toThrow();
  });
});


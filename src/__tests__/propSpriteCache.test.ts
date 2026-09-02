import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getCachedPropSprite,
  drawSolidPropWithCache,
  ENABLE_PROP_SPRITE_CACHE,
  setPropSpriteCacheEnabled,
  clearPropSpriteCache,
} from '../rendering/props/propSpriteCache';
import { SolidProp } from '../core/types';

describe('PropSpriteCache - Retina Supersampled Cache', () => {
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
});

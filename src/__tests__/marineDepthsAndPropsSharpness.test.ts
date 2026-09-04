import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderForegroundOcean, WaterRenderContext } from '../rendering/renderWater';
import { renderSkyHorizonOcean, SkyHorizonOceanParams } from '../rendering/sky/renderSkyHorizonOcean';
import { rebuildPropsOffscreenCanvas, createTerrainBuffers } from '../rendering/renderTerrain';
import { drawSolidPropVector } from '../rendering/props/renderDestructibleProp';
import { getCachedPropSprite, clearPropSpriteCache } from '../rendering/props/propSpriteCache';
import { renderBackgroundLayer } from '../components/game/canvas/renderBackgroundLayer';
import { SolidProp, GameState } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

describe('marineDepthsAndPropsSharpness - Underwater Continuity & Zero-Blur Props', () => {
  beforeAll(() => {
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') {
            const ctx = {
              createImageData: (w: number, h: number) => ({
                width: w,
                height: h,
                data: new Uint8ClampedArray(w * h * 4),
              }),
              putImageData: vi.fn(),
              drawImage: vi.fn(),
              clearRect: vi.fn(),
              save: vi.fn(),
              restore: vi.fn(),
              beginPath: vi.fn(),
              arc: vi.fn(),
              fill: vi.fn(),
              translate: vi.fn(),
              rotate: vi.fn(),
              scale: vi.fn(),
              fillRect: vi.fn(),
              strokeRect: vi.fn(),
              stroke: vi.fn(),
              setTransform: vi.fn(),
              createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
              createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
              imageSmoothingEnabled: true,
              imageSmoothingQuality: 'low',
            };
            return {
              width: 0,
              height: 0,
              getContext: () => ctx,
            };
          }
          return {};
        },
      };
    }
  });

  const createMockContext = () => {
    const calls: { method: string; args: unknown[] }[] = [];
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn((x, y) => calls.push({ method: 'moveTo', args: [x, y] })),
      lineTo: vi.fn((x, y) => calls.push({ method: 'lineTo', args: [x, y] })),
      quadraticCurveTo: vi.fn(),
      setTransform: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'low',
      _calls: calls,
    } as unknown as CanvasRenderingContext2D & { _calls: { method: string; args: unknown[] }[] };
  };

  describe('Ocean depths continuity (No waterY + 350 or waterY + 120 clamping)', () => {
    it('renderForegroundOcean extends down to viewBottom + 100 without cutoff', () => {
      const ctx = createMockContext();
      const waterCtx: WaterRenderContext = {
        ctx,
        height: 1200,
        waterY: 500,
        theme: 'ISLAND',
        isDay: true,
        slowTime: 1,
        animTime: 1,
        worldLeft: -1000,
        worldRight: 3000,
        worldBottom: 4000,
        viewLeft: 0,
        viewRight: 1200,
        viewBottom: 1500,
        bubbles: [],
        ripples: [],
        splashes: [],
      };

      renderForegroundOcean(waterCtx);

      const yCoords = ctx._calls
        .filter((c) => c.method === 'moveTo' || c.method === 'lineTo')
        .map((c) => c.args[1] as number);

      expect(yCoords).toContain(1600);
      expect(Math.max(...yCoords)).toBeGreaterThanOrEqual(1600);
    });

    it('renderSkyHorizonOcean extends down to drawBottom without cutoff', () => {
      const ctx = createMockContext();
      const oceanParams: SkyHorizonOceanParams = {
        ctx,
        waterY: 500,
        worldBottom: 4000,
        theme: 'ISLAND',
        isDay: true,
        slowTime: 1,
        drawLeft: -100,
        drawRight: 1300,
        drawBottom: 1500,
      };

      renderSkyHorizonOcean(oceanParams);

      const yCoords = ctx._calls
        .filter((c) => c.method === 'moveTo' || c.method === 'lineTo')
        .map((c) => c.args[1] as number);

      expect(yCoords).toContain(1500);
      expect(Math.max(...yCoords)).toBeGreaterThanOrEqual(1500);
    });

    it('renderSkyHorizonOcean returns early when drawBottom is above waterY - 20', () => {
      const ctx = createMockContext();
      const oceanParams: SkyHorizonOceanParams = {
        ctx,
        waterY: 800,
        worldBottom: 4000,
        theme: 'ISLAND',
        isDay: true,
        slowTime: 1,
        drawLeft: 0,
        drawRight: 1000,
        drawBottom: 700,
      };

      renderSkyHorizonOcean(oceanParams);
      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });

  describe('Props rendering sharpness & 1:1 fidelity', () => {
    it('rebuildPropsOffscreenCanvas enables high image smoothing quality', () => {
      const buffers = createTerrainBuffers(800, 600);
      const mockCtx = createMockContext();
      vi.spyOn(buffers.propsOffscreenCanvas, 'getContext').mockReturnValue(mockCtx);

      rebuildPropsOffscreenCanvas(buffers, [
        { id: 'p1', type: 'oil_drum', x: 200, y: 300, width: 20, height: 26, destroyed: false },
      ]);

      expect(mockCtx.imageSmoothingEnabled).toBe(true);
      expect(mockCtx.imageSmoothingQuality).toBe('high');
    });

    it('drawSolidPropVector rounds translate coordinates to integer pixels', () => {
      const mockCtx = createMockContext();
      const sprop: SolidProp = {
        id: 'p_subpixel',
        type: 'bunker',
        x: 150.7,
        y: 220.3,
        width: 38,
        height: 26,
        destroyed: false,
      };

      drawSolidPropVector(mockCtx, sprop);

      expect(mockCtx.translate).toHaveBeenCalledWith(151, 220);
    });

    it('getCachedPropSprite generates 1:1 pixel aligned sprite cache', () => {
      clearPropSpriteCache();
      const sprop: SolidProp = {
        id: 'p_tree',
        type: 'tree',
        x: 100,
        y: 200,
        width: 32,
        height: 48,
        destroyed: false,
      };

      const sprite = getCachedPropSprite(sprop);
      expect(sprite).not.toBeNull();
      if (sprite) {
        expect(Number.isInteger(sprite.originX)).toBe(true);
        expect(Number.isInteger(sprite.originY)).toBe(true);
        expect(Number.isInteger(sprite.boxW)).toBe(true);
        expect(Number.isInteger(sprite.boxH)).toBe(true);
        expect(sprite.canvas.width).toBe(sprite.boxW);
        expect(sprite.canvas.height).toBe(sprite.boxH);
      }
    });

    it('renderBackgroundLayer sets high image smoothing quality on context', () => {
      const mockCtx = createMockContext();
      const buffers = createTerrainBuffers(800, 600);
      const mockTerrain = {
        data: {
          width: 800,
          height: 600,
          waterLevel: 500,
          grid: new Uint8Array(800 * 600),
          solidProps: [],
          decorItems: [],
          theme: 'ISLAND',
        },
        revision: 0,
      } as unknown as DestructibleTerrain;

      renderBackgroundLayer({
        ctx: mockCtx,
        canvas: document.createElement('canvas'),
        containerRect: { width: 800, height: 600 } as DOMRect,
        terrain: mockTerrain,
        buffers,
        gameState: { config: { mapTheme: 'ISLAND', dayNightCycle: 'DAY' }, slugs: [] } as unknown as GameState,
        bgDpr: 1,
        totalScale: 1,
        pan: { x: 0, y: 0 },
        waterY: 500,
        animTime: 0,
        slowTime: 0,
        viewBounds: { viewLeft: 0, viewRight: 800, viewTop: 0, viewBottom: 600 },
        isMyTurn: false,
      });

      expect(mockCtx.imageSmoothingQuality).toBe('high');
    });
  });
});

import { GameState } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { perfTracker, isolateBenchmark } from '../../../core/perfTracker';
import { TerrainBuffers } from '../../../rendering/renderTerrain';
import { renderSettings } from '../../../core/perf/renderSettings';
import { renderSkyAndAtmosphere } from '../../../rendering/renderSky';
import { renderHDDestructibleGirder, renderHDDestructibleProp } from '../../../rendering/renderProps';
import { renderDecorItems } from '../../../rendering/renderDecorItems';
import { renderHelicopters, renderTombstones } from '../../../rendering/renderEffects';

export interface RenderBackgroundLayerParams {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  containerRect: { width: number; height: number };
  terrain: DestructibleTerrain;
  buffers: TerrainBuffers;
  gameState: GameState;
  bgDpr: number;
  totalScale: number;
  pan: { x: number; y: number };
  waterY: number;
  animTime: number;
  slowTime: number;
  viewBounds: {
    viewLeft: number;
    viewRight: number;
    viewTop: number;
    viewBottom: number;
  };
  isMyTurn: boolean;
}

export function renderBackgroundLayer({
  ctx,
  canvas,
  containerRect,
  terrain,
  buffers,
  gameState,
  bgDpr,
  totalScale,
  pan,
  waterY,
  animTime,
  slowTime,
  viewBounds: { viewLeft, viewRight, viewTop, viewBottom },
  isMyTurn,
}: RenderBackgroundLayerParams) {
  const { width, height, decorItems, grid, solidProps } = terrain.data;
  const theme = gameState.config?.mapTheme || 'ISLAND';
  const isDay = (gameState.config?.dayNightCycle || 'DAY') === 'DAY';
  const bypass = isolateBenchmark.getActiveBypass();

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.scale(bgDpr, bgDpr);
  ctx.translate(containerRect.width / 2 + pan.x, containerRect.height / 2 + pan.y);
  ctx.scale(totalScale, totalScale);
  ctx.translate(-width / 2, -height / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';

  const worldLeft = -3500;
  const worldRight = width + 3500;
  const worldTop = -2500;
  const worldBottom = height + 3500;

  // 1. Sky & Atmosphere
  renderSkyAndAtmosphere({
    ctx,
    width,
    height,
    waterY,
    theme,
    isDay,
    animTime,
    slowTime,
    worldLeft,
    worldRight,
    worldTop,
    worldBottom,
    viewLeft,
    viewRight,
    viewTop,
    viewBottom,
    bypass,
  });

  // 2. Offscreen Terrain Buffer (Clipped to Viewport & Solid Content Bounds)
  const pTerrainStart = performance.now();
  if (bypass !== 'TERRAIN' && bypass !== 'ALL_FOUR' && buffers.offscreenCanvas) {
    const margin = 16;
    const bounds = buffers.contentBounds || { minX: 0, maxX: width, minY: 0, maxY: height };
    const sx = Math.max(bounds.minX, Math.floor(viewLeft - margin));
    const sy = Math.max(bounds.minY, Math.floor(viewTop - margin));
    const ex = Math.min(bounds.maxX, Math.ceil(viewRight + margin));
    const ey = Math.min(bounds.maxY, Math.ceil(viewBottom + margin));
    const sw = ex - sx;
    const sh = ey - sy;
    if (sw > 0 && sh > 0) {
      const threshold = renderSettings.getTerrainMipmapThreshold();
      const useMipmap = renderSettings.getTerrainMipmapEnabled() && totalScale <= threshold && buffers.mipmapCanvas;
      if (useMipmap && buffers.mipmapCanvas) {
        const sxM = Math.floor(sx / 2);
        const syM = Math.floor(sy / 2);
        const swM = Math.ceil(sw / 2);
        const shM = Math.ceil(sh / 2);
        ctx.drawImage(buffers.mipmapCanvas, sxM, syM, swM, shM, sx, sy, sw, sh);
      } else {
        ctx.drawImage(buffers.offscreenCanvas, sx, sy, sw, sh, sx, sy, sw, sh);
      }
    }
  }
  perfTracker.recordRenderPass('terrain_buffer', performance.now() - pTerrainStart);

  // 3. Girders & Solid Props
  const pGirdersStart = performance.now();
  if (bypass !== 'DECOR' && gameState.girders) {
    for (const g of gameState.girders) {
      if (!g.destroyed) {
        if (g.x < viewLeft - 100 || g.x > viewRight + 100) continue;
        if (g.y < viewTop - 100 || g.y > viewBottom + 100) continue;
        renderHDDestructibleGirder(ctx, g, gameState.craters, gameState.explosions, grid, width, terrain.revision);
      }
    }
  }
  perfTracker.recordRenderPass('props_girders', performance.now() - pGirdersStart);

  const pSolidsStart = performance.now();
  if (bypass !== 'PROPS' && bypass !== 'ALL_FOUR') {
    if (buffers.propsOffscreenCanvas) {
      const margin = 32;
      const psx = Math.max(0, Math.floor(viewLeft - margin));
      const psy = Math.max(0, Math.floor(viewTop - margin));
      const pex = Math.min(width, Math.ceil(viewRight + margin));
      const pey = Math.min(height, Math.ceil(viewBottom + margin));
      const psw = pex - psx;
      const psh = pey - psy;
      if (psw > 0 && psh > 0) {
        ctx.drawImage(buffers.propsOffscreenCanvas, psx, psy, psw, psh, psx, psy, psw, psh);
      }
    } else if (solidProps) {
      for (const sprop of solidProps) {
        if (!sprop.destroyed) {
          if (sprop.x < viewLeft - 80 || sprop.x > viewRight + 80) continue;
          if (sprop.y < viewTop - 100 || sprop.y > viewBottom + 100) continue;
          renderHDDestructibleProp(ctx, sprop, gameState.craters, gameState.explosions, animTime, grid, width, terrain.revision);
        }
      }
    }
  }
  perfTracker.recordRenderPass('props_solids', performance.now() - pSolidsStart);

  // 4. Decor Foliage, Helicopters & Tombstones
  const pDecorStart = performance.now();
  if (bypass !== 'DECOR') {
    renderDecorItems(ctx, terrain, decorItems, animTime, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('decor_foliage', performance.now() - pDecorStart);

  const pHelisStart = performance.now();
  if (bypass !== 'DECOR' && gameState.helicopters) {
    renderHelicopters(ctx, gameState.helicopters, gameState, animTime, isMyTurn, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('decor_helicopters', performance.now() - pHelisStart);

  const pTombsStart = performance.now();
  if (bypass !== 'DECOR') {
    renderTombstones(ctx, gameState.slugs, terrain.data.waterLevel, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('decor_tombstones', performance.now() - pTombsStart);

  ctx.restore();
}

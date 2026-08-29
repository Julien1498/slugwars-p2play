import { GameState } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { perfTracker } from '../../../core/perfTracker';
import { TerrainBuffers } from '../../../rendering/renderTerrain';
import { renderSkyAndAtmosphere } from '../../../rendering/renderSky';
import { renderHDDestructibleGirder, renderHDDestructibleProp } from '../../../rendering/renderProps';
import { renderDecorItems } from '../../../rendering/renderDecorItems';
import { renderMines, renderHelicopters, renderTombstones } from '../../../rendering/renderEffects';

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

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.scale(bgDpr, bgDpr);
  ctx.translate(containerRect.width / 2 + pan.x, containerRect.height / 2 + pan.y);
  ctx.scale(totalScale, totalScale);
  ctx.translate(-width / 2, -height / 2);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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
  });

  // 2. Offscreen Terrain Buffer
  const pTerrainStart = performance.now();
  if (buffers.offscreenCanvas) {
    ctx.drawImage(buffers.offscreenCanvas, 0, 0);
  }
  perfTracker.recordRenderPass('terrain_buffer', performance.now() - pTerrainStart);

  // 3. Girders & Solid Props
  const pGirdersStart = performance.now();
  if (gameState.girders) {
    for (const g of gameState.girders) {
      if (!g.destroyed) {
        if (g.x < viewLeft - 100 || g.x > viewRight + 100) continue;
        renderHDDestructibleGirder(ctx, g, gameState.craters, gameState.explosions, grid, width, terrain.revision);
      }
    }
  }
  perfTracker.recordRenderPass('props_girders', performance.now() - pGirdersStart);

  const pSolidsStart = performance.now();
  if (solidProps) {
    for (const sprop of solidProps) {
      if (!sprop.destroyed) {
        if (sprop.x < viewLeft - 80 || sprop.x > viewRight + 80) continue;
        renderHDDestructibleProp(ctx, sprop, gameState.craters, gameState.explosions, animTime, grid, width, terrain.revision);
      }
    }
  }
  perfTracker.recordRenderPass('props_solids', performance.now() - pSolidsStart);

  // 4. Decor Foliage, Mines, Helicopters & Tombstones
  const pDecorStart = performance.now();
  renderDecorItems(ctx, terrain, decorItems, animTime, viewLeft, viewRight);
  perfTracker.recordRenderPass('decor_foliage', performance.now() - pDecorStart);

  const pMinesStart = performance.now();
  if (gameState.mines) {
    renderMines(ctx, gameState.mines, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('decor_mines', performance.now() - pMinesStart);

  const pHelisStart = performance.now();
  if (gameState.helicopters) {
    renderHelicopters(ctx, gameState.helicopters, gameState, animTime, isMyTurn, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('decor_helicopters', performance.now() - pHelisStart);

  const pTombsStart = performance.now();
  renderTombstones(ctx, gameState.slugs, terrain.data.waterLevel, viewLeft, viewRight);
  perfTracker.recordRenderPass('decor_tombstones', performance.now() - pTombsStart);

  ctx.restore();
}

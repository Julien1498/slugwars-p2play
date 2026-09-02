import { GameState, Vector2D } from '../../../core/types';
import { DestructibleTerrain } from '../../../core/terrain';
import { perfTracker } from '../../../core/perfTracker';
import { TerrainBuffers } from '../../../rendering/renderTerrain';
import { renderForegroundOcean, WaterBubble, WaterRipple, WaterSplash } from '../../../rendering/renderWater';
import { renderAllSlugs } from '../../../rendering/renderSlugs';
import { renderProjectiles } from '../../../rendering/renderProjectiles';
import { renderAimGuides } from '../../../rendering/renderAimGuides';
import { renderPlacementGhost } from '../../../rendering/renderPlacementGhost';
import { renderHitboxDebugOverlay } from '../../../rendering/renderHitboxes';
import {
  renderParticles,
  renderClientExplosions,
  renderFloatingDamages,
  renderNinjaRopes,
  renderSupplyCrates,
  renderMines,
  renderMagnets,
  ClientParticle,
  ClientExplosion,
  ClientFloatingDamage,
} from '../../../rendering/renderEffects';

export interface RenderForegroundLayerParams {
  actionCtx: CanvasRenderingContext2D;
  actionCanvas: HTMLCanvasElement;
  containerRect: { width: number; height: number };
  terrain: DestructibleTerrain;
  buffers: TerrainBuffers;
  visualState: GameState;
  curState: GameState;
  actionDpr: number;
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
  slugDeathTimestamps: Map<string, number>;
  clientParticles: ClientParticle[];
  clientExplosions: ClientExplosion[];
  clientFloatingDamages: ClientFloatingDamage[];
  clientWaterBubbles: WaterBubble[];
  clientWaterRipples: WaterRipple[];
  clientWaterSplashes: WaterSplash[];
  mousePos: Vector2D;
  lockedTarget: Vector2D | null;
  pendingPlacementPoint?: Vector2D | null;
  isMyTurn: boolean;
  showHitboxes: boolean;
}

export function renderForegroundLayer({
  actionCtx,
  actionCanvas,
  containerRect,
  terrain,
  buffers,
  visualState,
  curState,
  actionDpr,
  totalScale,
  pan,
  waterY,
  animTime,
  slowTime,
  viewBounds: { viewLeft, viewRight, viewTop, viewBottom },
  slugDeathTimestamps,
  clientParticles,
  clientExplosions,
  clientFloatingDamages,
  clientWaterBubbles,
  clientWaterRipples,
  clientWaterSplashes,
  mousePos,
  lockedTarget,
  pendingPlacementPoint,
  isMyTurn,
  showHitboxes,
}: RenderForegroundLayerParams) {
  const { width, height, waterLevel } = terrain.data;
  const theme = curState.config?.mapTheme || 'ISLAND';
  const isDay = (curState.config?.dayNightCycle || 'DAY') === 'DAY';

  actionCtx.save();
  actionCtx.setTransform(1, 0, 0, 1, 0, 0);
  actionCtx.clearRect(0, 0, actionCanvas.width, actionCanvas.height);

  actionCtx.scale(actionDpr, actionDpr);
  actionCtx.translate(containerRect.width / 2 + pan.x, containerRect.height / 2 + pan.y);
  actionCtx.scale(totalScale, totalScale);
  actionCtx.translate(-width / 2, -height / 2);
  actionCtx.imageSmoothingEnabled = true;
  actionCtx.imageSmoothingQuality = 'high';

  // 1. Ninja Ropes & Slugs (sub-passes granularly recorded inside renderAllSlugs)
  const pRopesStart = performance.now();
  renderNinjaRopes(actionCtx, visualState.slugs);
  perfTracker.recordRenderPass('ninja_ropes', performance.now() - pRopesStart);

  renderAllSlugs({
    ctx: actionCtx,
    gameState: visualState,
    animTime,
    slugDeathTimestamps,
    viewLeft,
    viewRight,
  });

  // 2. Supply Crates, Mines, Magnets, Projectiles & Particle FX
  const pCratesStart = performance.now();
  if (visualState.supplyCrates) {
    renderSupplyCrates(actionCtx, visualState.supplyCrates, animTime, viewLeft, viewRight);
  }
  if (visualState.mines) {
    renderMines(actionCtx, visualState.mines, viewLeft, viewRight);
  }
  if (visualState.magnets) {
    renderMagnets(actionCtx, visualState.magnets, animTime, viewLeft, viewRight);
  }
  perfTracker.recordRenderPass('supply_crates', performance.now() - pCratesStart);

  const pProjStart = performance.now();
  renderProjectiles({ ctx: actionCtx, projectiles: visualState.projectiles || [], animTime, viewLeft, viewRight });
  perfTracker.recordRenderPass('projectiles', performance.now() - pProjStart);

  const pPartsStart = performance.now();
  if (visualState.projectiles && visualState.projectiles.length > 0) {
    for (const proj of visualState.projectiles) {
      if (Math.hypot(proj.vx, proj.vy) > 0.5 && clientParticles.length < 60) {
        clientParticles.push({
          x: proj.x - proj.vx * 0.8,
          y: proj.y - proj.vy * 0.8,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          color: Math.random() < 0.4 ? '#f59e0b' : '#71717a',
          size: 2.5 + Math.random() * 3,
          life: 1.0,
        });
      }
    }
  }
  renderParticles(actionCtx, clientParticles, viewLeft, viewRight);
  perfTracker.recordRenderPass('particles_fx', performance.now() - pPartsStart);

  const pExplosionsStart = performance.now();
  renderClientExplosions(actionCtx, clientExplosions, viewLeft, viewRight);
  perfTracker.recordRenderPass('explosions_fx', performance.now() - pExplosionsStart);

  const pDamagesStart = performance.now();
  renderFloatingDamages(actionCtx, clientFloatingDamages, viewLeft, viewRight);
  perfTracker.recordRenderPass('floating_damages', performance.now() - pDamagesStart);

  // 3. Aim Guides & Placement Preview
  const pAimStart = performance.now();
  const activeSlug = visualState.slugs.find((s) => s.id === curState.activeSlugId);
  if (activeSlug && (curState.phase === 'AIMING' || curState.phase === 'TURN_TIME')) {
    renderAimGuides({
      ctx: actionCtx,
      activeSlug,
      isMyTurn,
      terrain,
      mousePos,
      lockedTarget: lockedTarget || activeSlug.currentTargetPoint || null,
      animTime,
    });
  }
  perfTracker.recordRenderPass('aim_guides', performance.now() - pAimStart);

  if (curState.phase === 'PLACEMENT' && isMyTurn) {
    const pGhostStart = performance.now();
    renderPlacementGhost(
      actionCtx,
      curState,
      terrain,
      pendingPlacementPoint || mousePos,
      isMyTurn,
      animTime
    );
    perfTracker.recordRenderPass('placement_ghost', performance.now() - pGhostStart);
  }

  // 4. Foreground Ocean Waves
  const pOceanStart = performance.now();
  const worldLeft = -3500;
  const worldRight = width + 3500;
  const worldBottom = height + 3500;

  renderForegroundOcean({
    ctx: actionCtx,
    height,
    waterY,
    theme,
    isDay,
    slowTime,
    animTime,
    worldLeft,
    worldRight,
    worldBottom,
    viewLeft,
    viewRight,
    viewTop,
    viewBottom,
    bubbles: clientWaterBubbles,
    ripples: clientWaterRipples,
    splashes: clientWaterSplashes,
  });
  perfTracker.recordRenderPass('ocean_waves', performance.now() - pOceanStart);

  // 5. Debug Hitboxes Overlay
  if (showHitboxes) {
    const pHitboxStart = performance.now();
    renderHitboxDebugOverlay({
      ctx: actionCtx,
      gameState: curState,
      terrain,
      terrainHitboxCanvas: buffers.terrainHitboxCanvas,
      waterLevel,
      width,
      height,
    });
    perfTracker.recordRenderPass('debug_hitboxes', performance.now() - pHitboxStart);
  }

  actionCtx.restore();
}

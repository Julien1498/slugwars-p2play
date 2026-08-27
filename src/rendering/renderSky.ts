import { MapTheme } from '../core/types';
import { perfTracker } from '../core/perfTracker';
import { getCachedSkyGradient, getCachedMountainGradient, getCachedBgWaterGradient } from './sky/skyGradients';
import { renderCloudsAndStars, renderCelestialBodies, SkyAtmosphereParams } from './sky/renderSkyAtmosphere';
import { renderSkyMountainsAndHills } from './sky/renderSkyMountains';
import { renderSkyHorizonOcean } from './sky/renderSkyHorizonOcean';

export { getCachedSkyGradient, getCachedMountainGradient, getCachedBgWaterGradient };

export interface SkyRenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  waterY: number;
  theme: MapTheme;
  isDay: boolean;
  animTime: number;
  slowTime: number;
  worldLeft: number;
  worldRight: number;
  worldTop: number;
  worldBottom: number;
  viewLeft?: number;
  viewRight?: number;
  viewTop?: number;
  viewBottom?: number;
}

export function renderSkyAndAtmosphere(rc: SkyRenderContext) {
  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, worldBottom, animTime, slowTime, width, viewLeft, viewRight } = rc;

  const drawLeft = viewLeft !== undefined ? viewLeft - 100 : worldLeft;
  const drawRight = viewRight !== undefined ? viewRight + 100 : worldRight;
  const drawTop = rc.viewTop !== undefined ? rc.viewTop - 100 : worldTop;
  const drawBottom = rc.viewBottom !== undefined ? rc.viewBottom + 100 : worldBottom;

  // 1. Seamless Infinite Atmospheric Sky Horizon Gradient
  const pSkyGradStart = performance.now();
  const skyGrad = getCachedSkyGradient(ctx, height, waterY, theme, isDay);
  if (drawTop < waterY) {
    ctx.fillStyle = skyGrad;
    ctx.fillRect(drawLeft, drawTop, drawRight - drawLeft, waterY - drawTop);
  }
  perfTracker.recordRenderPass('sky_gradient', performance.now() - pSkyGradStart);

  const atmosphereParams: SkyAtmosphereParams = {
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
    drawLeft,
    drawRight,
    drawTop,
  };

  // 2. Light Rays / Clouds / Atmosphere Particles
  const pCloudsStart = performance.now();
  renderCloudsAndStars(atmosphereParams);
  perfTracker.recordRenderPass('sky_clouds_stars', performance.now() - pCloudsStart);

  // 3. Iconic Celestial Focus (Sun / Moon / Rift / Searchlight)
  const pCelestialStart = performance.now();
  renderCelestialBodies(atmosphereParams);
  perfTracker.recordRenderPass('sky_celestial', performance.now() - pCelestialStart);

  // 4. Background Mountain & Ridge Horizons (Theme-Specific Colors)
  const pMountainsStart = performance.now();
  renderSkyMountainsAndHills({
    ctx,
    height,
    waterY,
    theme,
    isDay,
    drawLeft,
    drawRight,
    drawBottom,
  });
  perfTracker.recordRenderPass('sky_mountains', performance.now() - pMountainsStart);

  // 5. Deep Ocean Horizon Backdrop below Water Level
  const pBackOceanStart = performance.now();
  renderSkyHorizonOcean({
    ctx,
    waterY,
    worldBottom,
    theme,
    isDay,
    slowTime,
    drawLeft,
    drawRight,
    drawBottom,
  });
  perfTracker.recordRenderPass('sky_back_ocean', performance.now() - pBackOceanStart);
}

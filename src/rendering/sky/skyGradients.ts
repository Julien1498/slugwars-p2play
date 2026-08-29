import { MapTheme } from '../../core/types';
import { getThemeConfig } from '../../core/terrain/themeRegistry';

// Cached sky gradient
let _cachedSkyGrad: CanvasGradient | null = null;
let _cachedSkyKey = '';

// Cached mountain gradient
let _cachedMtGrad: CanvasGradient | null = null;
let _cachedMtKey = '';

// Cached background water gradient
let _cachedBgWaterGrad: CanvasGradient | null = null;
let _cachedBgWaterY = -99999;
let _cachedBgWorldBottom = -99999;
let _cachedBgTheme: MapTheme | null = null;
let _cachedBgIsDay = true;

function applyStops(grad: CanvasGradient, colors: string[]) {
  const count = colors.length;
  if (count === 1) {
    grad.addColorStop(0, colors[0]);
    grad.addColorStop(1, colors[0]);
    return;
  }
  for (let i = 0; i < count; i++) {
    grad.addColorStop(i / (count - 1), colors[i]);
  }
}

export function getCachedSkyGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  waterY: number,
  theme: MapTheme,
  isDay: boolean
): CanvasGradient {
  const skyGradTop = Math.min(-650, -height * 0.9);
  const skyKey = `${skyGradTop}_${waterY}_${theme}_${isDay}`;
  if (_cachedSkyKey === skyKey && _cachedSkyGrad) {
    return _cachedSkyGrad;
  }

  const skyGrad = ctx.createLinearGradient(0, skyGradTop, 0, waterY);
  const config = getThemeConfig(theme);
  const colors = isDay ? config.rendering.sky.day : config.rendering.sky.night;
  applyStops(skyGrad, colors);

  _cachedSkyGrad = skyGrad;
  _cachedSkyKey = skyKey;
  return skyGrad;
}

export function getCachedMountainGradient(
  ctx: CanvasRenderingContext2D,
  height: number,
  waterY: number,
  theme: MapTheme,
  isDay: boolean
): CanvasGradient {
  const mtKey = `${height}_${waterY}_${theme}_${isDay}`;
  if (_cachedMtKey === mtKey && _cachedMtGrad) {
    return _cachedMtGrad;
  }

  const mtGrad = ctx.createLinearGradient(0, height * 0.2, 0, waterY + 100);
  const config = getThemeConfig(theme);
  const colors = isDay ? config.rendering.mountains.gradient.day : config.rendering.mountains.gradient.night;
  applyStops(mtGrad, colors);

  _cachedMtGrad = mtGrad;
  _cachedMtKey = mtKey;
  return mtGrad;
}

export function getCachedBgWaterGradient(
  ctx: CanvasRenderingContext2D,
  waterY: number,
  worldBottom: number,
  theme: MapTheme,
  isDay: boolean
): CanvasGradient {
  if (
    _cachedBgWaterGrad &&
    _cachedBgWaterY === waterY &&
    _cachedBgWorldBottom === worldBottom &&
    _cachedBgTheme === theme &&
    _cachedBgIsDay === isDay
  ) {
    return _cachedBgWaterGrad;
  }

  const grad = ctx.createLinearGradient(0, waterY, 0, worldBottom);
  const config = getThemeConfig(theme);
  const colors = isDay ? config.rendering.water.bgGradient.day : config.rendering.water.bgGradient.night;
  applyStops(grad, colors);

  _cachedBgWaterGrad = grad;
  _cachedBgWaterY = waterY;
  _cachedBgWorldBottom = worldBottom;
  _cachedBgTheme = theme;
  _cachedBgIsDay = isDay;
  return grad;
}

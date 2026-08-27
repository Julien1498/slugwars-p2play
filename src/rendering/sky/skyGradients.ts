import { MapTheme } from '../../core/types';

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
  if (isDay) {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      skyGrad.addColorStop(0, '#451a03');
      skyGrad.addColorStop(0.35, '#78350f');
      skyGrad.addColorStop(0.65, '#b45309');
      skyGrad.addColorStop(0.88, '#d97706');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (theme === 'NATURAL_ARCHES') {
      skyGrad.addColorStop(0, '#7c2d12');
      skyGrad.addColorStop(0.3, '#c2410c');
      skyGrad.addColorStop(0.65, '#ea580c');
      skyGrad.addColorStop(0.85, '#f59e0b');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (theme === 'SPIRES') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.35, '#38bdf8');
      skyGrad.addColorStop(0.7, '#7dd3fc');
      skyGrad.addColorStop(0.9, '#bae6fd');
      skyGrad.addColorStop(1, '#f0f9ff');
    } else if (theme === 'ARCHIPELAGO') {
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.3, '#0284c7');
      skyGrad.addColorStop(0.65, '#38bdf8');
      skyGrad.addColorStop(0.88, '#7dd3fc');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else if (theme === 'FORTRESS') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.35, '#0369a1');
      skyGrad.addColorStop(0.7, '#0284c7');
      skyGrad.addColorStop(0.9, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else if (theme === 'FLOATING_CHAOS') {
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.35, '#0284c7');
      skyGrad.addColorStop(0.72, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else {
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.38, '#0284c7');
      skyGrad.addColorStop(0.74, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
    }
  } else {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      skyGrad.addColorStop(0, '#030102');
      skyGrad.addColorStop(0.35, '#170605');
      skyGrad.addColorStop(0.7, '#2b0c07');
      skyGrad.addColorStop(1, '#451a03');
    } else if (theme === 'NATURAL_ARCHES') {
      skyGrad.addColorStop(0, '#1c0a00');
      skyGrad.addColorStop(0.35, '#2e1065');
      skyGrad.addColorStop(0.7, '#4c1d95');
      skyGrad.addColorStop(1, '#1e1b4b');
    } else if (theme === 'SPIRES') {
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.35, '#0f172a');
      skyGrad.addColorStop(0.7, '#1e293b');
      skyGrad.addColorStop(1, '#334155');
    } else if (theme === 'ARCHIPELAGO') {
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.35, '#071527');
      skyGrad.addColorStop(0.7, '#082f49');
      skyGrad.addColorStop(1, '#0c4a6e');
    } else if (theme === 'FORTRESS') {
      skyGrad.addColorStop(0, '#020408');
      skyGrad.addColorStop(0.35, '#070b14');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    } else if (theme === 'FLOATING_CHAOS') {
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.35, '#070d1a');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
    } else {
      skyGrad.addColorStop(0, '#02040a');
      skyGrad.addColorStop(0.35, '#070d1a');
      skyGrad.addColorStop(0.7, '#0f172a');
      skyGrad.addColorStop(1, '#1e1b4b');
    }
  }

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
  if (isDay) {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      mtGrad.addColorStop(0, 'rgba(180, 83, 9, 0.75)');
      mtGrad.addColorStop(1, 'rgba(120, 53, 15, 0.95)');
    } else if (theme === 'NATURAL_ARCHES') {
      mtGrad.addColorStop(0, 'rgba(194, 65, 12, 0.75)');
      mtGrad.addColorStop(1, 'rgba(124, 45, 18, 0.95)');
    } else if (theme === 'SPIRES') {
      mtGrad.addColorStop(0, 'rgba(71, 85, 105, 0.75)');
      mtGrad.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
    } else if (theme === 'FORTRESS') {
      mtGrad.addColorStop(0, 'rgba(71, 85, 105, 0.75)');
      mtGrad.addColorStop(1, 'rgba(20, 83, 45, 0.90)');
    } else if (theme === 'FLOATING_CHAOS') {
      mtGrad.addColorStop(0, 'rgba(16, 185, 129, 0.75)');
      mtGrad.addColorStop(1, 'rgba(5, 150, 105, 0.90)');
    } else {
      mtGrad.addColorStop(0, 'rgba(34, 197, 94, 0.75)');
      mtGrad.addColorStop(1, 'rgba(21, 128, 61, 0.90)');
    }
  } else {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      mtGrad.addColorStop(1, 'rgba(7, 10, 22, 0.95)');
    } else if (theme === 'NATURAL_ARCHES') {
      mtGrad.addColorStop(0, 'rgba(76, 29, 149, 0.85)');
      mtGrad.addColorStop(1, 'rgba(30, 27, 75, 0.95)');
    } else if (theme === 'SPIRES') {
      mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      mtGrad.addColorStop(1, 'rgba(7, 10, 22, 0.95)');
    } else if (theme === 'FORTRESS') {
      mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.88)');
      mtGrad.addColorStop(1, 'rgba(9, 13, 22, 0.95)');
    } else if (theme === 'FLOATING_CHAOS') {
      mtGrad.addColorStop(0, 'rgba(30, 11, 60, 0.85)');
      mtGrad.addColorStop(1, 'rgba(8, 3, 19, 0.95)');
    } else {
      mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
      mtGrad.addColorStop(1, 'rgba(7, 10, 22, 0.95)');
    }
  }

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
  if (theme === 'ORGANIC_CAVES' || theme === 'CAVERN') {
    grad.addColorStop(0, '#78350f');
    grad.addColorStop(0.35, '#451a03');
    grad.addColorStop(0.75, '#1c0a02');
    grad.addColorStop(1, '#0c0401');
  } else if (theme === 'ARCHIPELAGO' || theme === 'SPIRES') {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.35, '#0369a1');
    grad.addColorStop(0.75, '#0c4a6e');
    grad.addColorStop(1, '#082f49');
  } else if (theme === 'NATURAL_ARCHES') {
    grad.addColorStop(0, '#9a3412');
    grad.addColorStop(0.35, '#7c2d12');
    grad.addColorStop(0.75, '#431407');
    grad.addColorStop(1, '#270a03');
  } else {
    grad.addColorStop(0, isDay ? '#0284c7' : '#0369a1');
    grad.addColorStop(0.35, isDay ? '#0369a1' : '#0c4a6e');
    grad.addColorStop(0.75, isDay ? '#0c4a6e' : '#082f49');
    grad.addColorStop(1, isDay ? '#082f49' : '#041d2d');
  }

  _cachedBgWaterGrad = grad;
  _cachedBgWaterY = waterY;
  _cachedBgWorldBottom = worldBottom;
  _cachedBgTheme = theme;
  _cachedBgIsDay = isDay;
  return grad;
}

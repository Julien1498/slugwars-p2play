import { MapTheme } from '../../core/types';
import { getThemeConfig } from '../../core/terrain/themeRegistry';
import { getCachedMountainGradient } from './skyGradients';

export interface SkyMountainParams {
  ctx: CanvasRenderingContext2D;
  height: number;
  waterY: number;
  theme: MapTheme;
  isDay: boolean;
  drawLeft: number;
  drawRight: number;
  drawBottom: number;
}

let _cachedHeight = -99999;
let _cachedWaterY = -99999;
let _cachedDistantPath: Path2D | null = null;
let _cachedRidgePath: Path2D | null = null;

const WORLD_MIN_X = -4000;
const WORLD_MAX_X = 8000;

function ensureMountainPaths(height: number, waterY: number) {
  if (typeof Path2D === 'undefined') return;
  if (_cachedDistantPath && _cachedHeight === height && _cachedWaterY === waterY) {
    return;
  }

  const bottomY = waterY + 80;

  // 1. Distant Mountain Horizons
  const mtStep1 = 40;
  const p1 = new Path2D();
  p1.moveTo(WORLD_MIN_X, bottomY);
  for (let x = WORLD_MIN_X; x <= WORLD_MAX_X; x += mtStep1) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    p1.lineTo(x, my);
  }
  p1.lineTo(WORLD_MAX_X, bottomY);
  p1.closePath();
  _cachedDistantPath = p1;

  // 2. Midground Ridge
  const mtStep2 = 30;
  const p2 = new Path2D();
  p2.moveTo(WORLD_MIN_X, bottomY);
  for (let x = WORLD_MIN_X; x <= WORLD_MAX_X; x += mtStep2) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    p2.lineTo(x, my);
  }
  p2.lineTo(WORLD_MAX_X, bottomY);
  p2.closePath();
  _cachedRidgePath = p2;

  _cachedHeight = height;
  _cachedWaterY = waterY;
}

function renderMountainGrass(
  ctx: CanvasRenderingContext2D,
  height: number,
  config: ReturnType<typeof getThemeConfig>,
  isDay: boolean,
  drawLeft: number,
  drawRight: number
) {
  if (!isDay || !config.rendering.mountains.highlightStroke) return;
  ctx.strokeStyle = config.rendering.mountains.highlightStroke;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  const grassStep = 14;
  const gStart = Math.max(WORLD_MIN_X, Math.floor((drawLeft - 50) / grassStep) * grassStep);
  const gEnd = Math.min(WORLD_MAX_X, drawRight + 50);
  for (let x = gStart; x <= gEnd; x += grassStep) {
    const by = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.moveTo(x, by);
    ctx.lineTo(x + Math.sin(x * 0.1) * 3, by - 5 - (Math.abs(x) % 4));
  }
  ctx.stroke();
}

export function renderSkyMountainsAndHills(p: SkyMountainParams) {
  const { ctx, height, waterY, theme, isDay, drawLeft, drawRight, drawBottom } = p;
  const config = getThemeConfig(theme);

  ensureMountainPaths(height, waterY);

  if (_cachedDistantPath && _cachedRidgePath) {
    // Fast path: Pure GPU-accelerated pre-baked Path2D rendering
    const mtGrad = getCachedMountainGradient(ctx, height, waterY, theme, isDay);
    ctx.fillStyle = mtGrad;
    ctx.fill(_cachedDistantPath);

    ctx.fillStyle = isDay
      ? config.rendering.mountains.ridgeColor.day
      : config.rendering.mountains.ridgeColor.night;
    ctx.fill(_cachedRidgePath);

    renderMountainGrass(ctx, height, config, isDay, drawLeft, drawRight);
    return;
  }

  // Fallback if Path2D is unavailable in environment
  const mtGrad = getCachedMountainGradient(ctx, height, waterY, theme, isDay);
  const mtStep1 = 40;
  const mtStartX1 = Math.floor(drawLeft / mtStep1) * mtStep1;

  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(drawLeft, waterY + 80);
  for (let x = mtStartX1; x <= drawRight + mtStep1 * 2; x += mtStep1) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(drawRight + mtStep1, waterY + 80);
  ctx.lineTo(drawLeft, waterY + 80);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = isDay
    ? config.rendering.mountains.ridgeColor.day
    : config.rendering.mountains.ridgeColor.night;

  const mtStep2 = 30;
  const mtStartX2 = Math.floor(drawLeft / mtStep2) * mtStep2;
  ctx.beginPath();
  ctx.moveTo(drawLeft, waterY + 80);
  for (let x = mtStartX2; x <= drawRight + mtStep2 * 2; x += mtStep2) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(drawRight + mtStep2, waterY + 80);
  ctx.lineTo(drawLeft, waterY + 80);
  ctx.closePath();
  ctx.fill();

  renderMountainGrass(ctx, height, config, isDay, drawLeft, drawRight);
}

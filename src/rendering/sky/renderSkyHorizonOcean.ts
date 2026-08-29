import { MapTheme } from '../../core/types';
import { getThemeConfig } from '../../core/terrain/themeRegistry';
import { getCachedBgWaterGradient } from './skyGradients';

// Pre-allocated typed arrays for background wave points (Zero-allocation per frame)
let _bgWaveX = new Float32Array(1024);
let _bgWaveY = new Float32Array(1024);

export interface SkyHorizonOceanParams {
  ctx: CanvasRenderingContext2D;
  waterY: number;
  worldBottom: number;
  theme: MapTheme;
  isDay: boolean;
  slowTime: number;
  drawLeft: number;
  drawRight: number;
  drawBottom: number;
}

export function renderSkyHorizonOcean(p: SkyHorizonOceanParams) {
  const { ctx, waterY, worldBottom, theme, isDay, slowTime, drawLeft, drawRight, drawBottom } = p;

  ctx.fillStyle = getCachedBgWaterGradient(ctx, waterY, worldBottom, theme, isDay);

  const span = drawRight - drawLeft;
  const waveStep = Math.max(18, Math.min(36, Math.round(span / 60)));
  const waveStartX = Math.floor(drawLeft / waveStep) * waveStep;

  // Layer 1: Back Ocean Deep Body Polygon
  ctx.beginPath();
  ctx.moveTo(drawLeft, drawBottom);
  for (let x = waveStartX; x <= drawRight + waveStep * 2; x += waveStep) {
    const wy1 = waterY + Math.sin(x * 0.008 + slowTime * 1.5) * 10 + Math.cos(x * 0.016 - slowTime * 1.0) * 4;
    ctx.lineTo(x, wy1);
  }
  ctx.lineTo(drawRight + waveStep, drawBottom);
  ctx.lineTo(drawLeft, drawBottom);
  ctx.closePath();
  ctx.fill();

  const config = getThemeConfig(theme);

  // Layer 2: Mid Wave Translucent Swell
  ctx.fillStyle = isDay
    ? config.rendering.water.midWaveColor.day
    : config.rendering.water.midWaveColor.night;
  ctx.beginPath();
  ctx.moveTo(drawLeft, drawBottom);
  for (let x = waveStartX; x <= drawRight + waveStep * 2; x += waveStep) {
    const wy2 = waterY + 3 + Math.sin(x * 0.012 + slowTime * 2.2 + 2.0) * 8 + Math.sin(x * 0.024 - slowTime * 1.4) * 3;
    ctx.lineTo(x, wy2);
  }
  ctx.lineTo(drawRight + waveStep, drawBottom);
  ctx.lineTo(drawLeft, drawBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 3 & 4: Single-pass Horizon Surface Wave Computation
  const neededBgCap = Math.ceil((drawRight - drawLeft) / waveStep) + 8;
  if (_bgWaveX.length < neededBgCap) {
    _bgWaveX = new Float32Array(neededBgCap + 64);
    _bgWaveY = new Float32Array(neededBgCap + 64);
  }

  let bgPtCount = 0;
  for (let x = waveStartX; x <= drawRight + waveStep * 2; x += waveStep) {
    _bgWaveX[bgPtCount] = x;
    _bgWaveY[bgPtCount] = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    bgPtCount++;
  }

  // Layer 3: Front Horizon Wave
  ctx.fillStyle = isDay
    ? config.rendering.water.frontWaveColor.day
    : config.rendering.water.frontWaveColor.night;
  ctx.beginPath();
  ctx.moveTo(drawLeft, drawBottom);
  for (let i = 0; i < bgPtCount; i++) {
    ctx.lineTo(_bgWaveX[i], _bgWaveY[i]);
  }
  ctx.lineTo(drawRight + waveStep, drawBottom);
  ctx.lineTo(drawLeft, drawBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 4: Smooth White Foam Crest Line
  ctx.strokeStyle = isDay ? '#ffffff' : '#94a3b8';
  ctx.lineWidth = 1.6;
  if (bgPtCount > 0) {
    ctx.beginPath();
    ctx.moveTo(_bgWaveX[0], _bgWaveY[0]);
    for (let i = 1; i < bgPtCount; i++) {
      ctx.lineTo(_bgWaveX[i], _bgWaveY[i]);
    }
    ctx.stroke();
  }
}

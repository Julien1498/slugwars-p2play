import { MapTheme } from '../../core/types';
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

export function renderSkyMountainsAndHills(p: SkyMountainParams) {
  const { ctx, height, waterY, theme, isDay, drawLeft, drawRight, drawBottom } = p;

  // 1. Distant Mountain Horizons (Anchored to world coordinate grid)
  const mtGrad = getCachedMountainGradient(ctx, height, waterY, theme, isDay);
  const mtStep1 = 40;
  const mtStartX1 = Math.floor(drawLeft / mtStep1) * mtStep1;

  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(drawLeft, waterY + 100);
  for (let x = mtStartX1; x <= drawRight + mtStep1 * 2; x += mtStep1) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(drawRight + mtStep1, drawBottom);
  ctx.lineTo(drawLeft, drawBottom);
  ctx.closePath();
  ctx.fill();

  // 2. Midground Ridge (Anchored to world coordinate grid)
  if (isDay) {
    ctx.fillStyle =
      theme === 'CAVERN' || theme === 'ORGANIC_CAVES'
        ? '#78350f'
        : theme === 'NATURAL_ARCHES'
        ? '#7c2d12'
        : theme === 'SPIRES'
        ? '#334155'
        : theme === 'FORTRESS'
        ? '#14532d'
        : theme === 'FLOATING_CHAOS'
        ? '#047857'
        : '#15803d';
  } else {
    ctx.fillStyle =
      theme === 'CAVERN' || theme === 'ORGANIC_CAVES'
        ? '#0d0403'
        : theme === 'NATURAL_ARCHES'
        ? '#2e1065'
        : theme === 'SPIRES'
        ? '#0f172a'
        : theme === 'FLOATING_CHAOS'
        ? '#0b0417'
        : '#070b16';
  }

  const mtStep2 = 30;
  const mtStartX2 = Math.floor(drawLeft / mtStep2) * mtStep2;
  ctx.beginPath();
  ctx.moveTo(drawLeft, waterY + 100);
  for (let x = mtStartX2; x <= drawRight + mtStep2 * 2; x += mtStep2) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(drawRight + mtStep2, drawBottom);
  ctx.lineTo(drawLeft, drawBottom);
  ctx.closePath();
  ctx.fill();

  // 3. Dotted Lush Grass Blade Dashes on Green Hills
  if (isDay && (theme === 'ISLAND' || theme === 'FLOATING_CHAOS' || theme === 'FORTRESS' || theme === 'SPIRES' || !theme)) {
    ctx.strokeStyle = theme === 'FLOATING_CHAOS' ? '#6ee7b7' : '#4ade80';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    const grassStep = 14;
    const grassStartX = Math.floor(drawLeft / grassStep) * grassStep;
    for (let x = grassStartX; x <= drawRight + grassStep; x += grassStep) {
      const by = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
      ctx.moveTo(x, by);
      ctx.lineTo(x + Math.sin(x * 0.1) * 3, by - 5 - (Math.abs(x) % 4));
    }
    ctx.stroke();
  }
}

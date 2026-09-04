import { MapTheme } from '../core/types';
import { getThemeConfig } from '../core/terrain/themeRegistry';

export interface WaterBubble { x: number; y: number; vx: number; vy: number; size: number; life: number; }
export interface WaterRipple { x: number; radius: number; life: number; color: string; }
export interface WaterSplash { x: number; y: number; vx: number; vy: number; size: number; life: number; color: string; }

export interface WaterRenderContext {
  ctx: CanvasRenderingContext2D;
  height: number;
  waterY: number;
  theme: MapTheme;
  isDay: boolean;
  slowTime: number;
  animTime: number;
  worldLeft: number;
  worldRight: number;
  worldBottom: number;
  viewLeft?: number;
  viewRight?: number;
  viewTop?: number;
  viewBottom?: number;
  bubbles: WaterBubble[];
  ripples: WaterRipple[];
  splashes: WaterSplash[];
}

// Pre-allocated typed arrays for wave points to avoid any memory allocations per frame
let _waveX = new Float32Array(1024);
let _waveY = new Float32Array(1024);
let _midWaveX = new Float32Array(1024);
let _midWaveY = new Float32Array(1024);

function traceSmoothWave(ctx: CanvasRenderingContext2D, xs: Float32Array, ys: Float32Array, count: number) {
  if (count < 2) return;
  for (let i = 0; i < count - 1; i++) {
    const mx = (xs[i] + xs[i + 1]) * 0.5;
    const my = (ys[i] + ys[i + 1]) * 0.5;
    ctx.quadraticCurveTo(xs[i], ys[i], mx, my);
  }
  ctx.lineTo(xs[count - 1], ys[count - 1]);
}

// Cached gradient to avoid re-instantiating CanvasGradient every frame
let _cachedGrad: CanvasGradient | null = null;
let _cachedWaterY = -99999;
let _cachedHeight = -99999;
let _cachedTheme: MapTheme | null = null;
let _cachedIsDay = true;

function applyStops(grad: CanvasGradient, colors: string[]) {
  const count = colors.length;
  if (count === 1) { grad.addColorStop(0, colors[0]); grad.addColorStop(1, colors[0]); return; }
  for (let i = 0; i < count; i++) grad.addColorStop(i / (count - 1), colors[i]);
}

function getCachedFgWaterGradient(
  ctx: CanvasRenderingContext2D, waterY: number, height: number, theme: MapTheme, isDay: boolean
): CanvasGradient {
  if (_cachedGrad && _cachedWaterY === waterY && _cachedHeight === height && _cachedTheme === theme && _cachedIsDay === isDay) {
    return _cachedGrad;
  }
  const grad = ctx.createLinearGradient(0, waterY, 0, waterY + Math.max(400, height * 0.6));
  const config = getThemeConfig(theme);
  const colors = isDay ? config.rendering.water.gradient.day : config.rendering.water.gradient.night;
  applyStops(grad, colors);
  _cachedGrad = grad; _cachedWaterY = waterY; _cachedHeight = height; _cachedTheme = theme; _cachedIsDay = isDay;
  return grad;
}

export function renderForegroundOcean(rc: WaterRenderContext) {
  const {
    ctx,
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
    viewBottom,
    bubbles,
    ripples,
    splashes,
  } = rc;

  const clampLeft = viewLeft !== undefined ? viewLeft - 100 : worldLeft;
  const clampRight = viewRight !== undefined ? viewRight + 100 : worldRight;
  const clampBottom = Math.min(viewBottom !== undefined ? viewBottom + 50 : waterY + 400, waterY + 350);
  const span = clampRight - clampLeft;
  const waveStep = Math.max(26, Math.min(52, Math.round(span / 40)));

  const config = getThemeConfig(theme);

  // Single-pass computation of both wave layers
  const neededCapacity = Math.ceil(span / waveStep) + 8;
  if (_waveX.length < neededCapacity) {
    _waveX = new Float32Array(neededCapacity + 64);
    _waveY = new Float32Array(neededCapacity + 64);
    _midWaveX = new Float32Array(neededCapacity + 64);
    _midWaveY = new Float32Array(neededCapacity + 64);
  }

  let ptCount = 0;
  for (let x = clampLeft; x <= clampRight + waveStep * 2; x += waveStep) {
    _waveX[ptCount] = x;
    _waveY[ptCount] = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    _midWaveX[ptCount] = x;
    _midWaveY[ptCount] = waterY + 3 + Math.sin(x * 0.012 + slowTime * 2.2 + 2.0) * 8 + Math.sin(x * 0.024 - slowTime * 1.4) * 3;
    ptCount++;
  }

  // Layer 1: Mid Translucent Rolling Wave (Smooth Spline)
  if (ptCount > 1) {
    ctx.fillStyle = isDay
      ? config.rendering.water.midWaveColor.day
      : config.rendering.water.midWaveColor.night;
    ctx.beginPath();
    ctx.moveTo(clampLeft, clampBottom);
    ctx.lineTo(_midWaveX[0], clampBottom);
    ctx.lineTo(_midWaveX[0], _midWaveY[0]);
    traceSmoothWave(ctx, _midWaveX, _midWaveY, ptCount);
    ctx.lineTo(_midWaveX[ptCount - 1], clampBottom);
    ctx.lineTo(clampLeft, clampBottom);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Front Main Ocean Body (Smooth Spline Gradient)
    ctx.fillStyle = getCachedFgWaterGradient(ctx, waterY, height, theme, isDay);
    ctx.beginPath();
    ctx.moveTo(clampLeft, clampBottom);
    ctx.lineTo(_waveX[0], clampBottom);
    ctx.lineTo(_waveX[0], _waveY[0]);
    traceSmoothWave(ctx, _waveX, _waveY, ptCount);
    ctx.lineTo(_waveX[ptCount - 1], clampBottom);
    ctx.lineTo(clampLeft, clampBottom);
    ctx.closePath();
    ctx.fill();

    // Layer 3 & 4: Wave Crest Strokes (Smooth Spline Outline)
    ctx.beginPath();
    ctx.moveTo(_waveX[0], _waveY[0]);
    traceSmoothWave(ctx, _waveX, _waveY, ptCount);

    // Layer 3: Glowing Outer Aqua Rim
    ctx.strokeStyle = isDay
      ? config.rendering.water.outerRimColor.day
      : config.rendering.water.outerRimColor.night;
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Layer 4: Ultra-Crisp Pure White Foam Crest Line
    ctx.strokeStyle = isDay
      ? config.rendering.water.foamColor.day
      : config.rendering.water.foamColor.night;
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }

  // 3. Render Rising Air Bubbles (Batched path execution)
  ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 0.8;

  let writeBubbleIdx = 0;
  let hasBubbles = false;
  ctx.beginPath();
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    b.x += b.vx + Math.sin(animTime * 6 + b.y * 0.1) * 0.4;
    b.y += b.vy;
    b.life -= 0.018;

    if (b.life > 0 && b.y > waterY - 4) {
      if (b.x >= clampLeft - 10 && b.x <= clampRight + 10 && b.y <= clampBottom + 10) {
        ctx.moveTo(b.x + b.size, b.y);
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        hasBubbles = true;
      }
      bubbles[writeBubbleIdx++] = b;
    }
  }
  bubbles.length = writeBubbleIdx;
  if (hasBubbles) {
    ctx.globalAlpha = 0.8;
    ctx.fill();
    ctx.stroke();
  }

  // 4. Render Surface Expanding Water Ripples (Direct alpha assignment, 0 save/restore, 0 GC allocations)
  let writeRippleIdx = 0;
  for (let i = 0; i < ripples.length; i++) {
    const rip = ripples[i];
    rip.radius += 0.85;
    rip.life -= 0.024;

    if (rip.life > 0) {
      if (rip.x >= clampLeft - rip.radius * 2 && rip.x <= clampRight + rip.radius * 2) {
        ctx.globalAlpha = Math.max(0, rip.life * 0.90);
        ctx.strokeStyle = rip.color;
        ctx.lineWidth = Math.max(0.7, 2.2 * rip.life);
        ctx.beginPath();
        const localWaveY = waterY + Math.sin(rip.x * 0.010 + slowTime * 1.8) * 9 + Math.cos(rip.x * 0.020 - slowTime * 1.2) * 4;
        ctx.ellipse(rip.x, localWaveY, rip.radius * 1.45, rip.radius * 0.40, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ripples[writeRippleIdx++] = rip;
    }
  }
  ripples.length = writeRippleIdx;

  // 5. Render Water Splash Droplets (Batched passes)
  let writeSplashIdx = 0;
  for (let i = 0; i < splashes.length; i++) {
    const sp = splashes[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.26;
    sp.life -= 0.028;
    if (sp.life > 0) splashes[writeSplashIdx++] = sp;
  }
  splashes.length = writeSplashIdx;

  if (splashes.length > 0) {
    const minX = clampLeft - 10;
    const maxX = clampRight + 10;
    const maxY = clampBottom + 10;

    // Batch 1: White droplets
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    let countWhite = 0;
    for (let i = 0; i < splashes.length; i++) {
      const sp = splashes[i];
      if (sp.color.charCodeAt(5) === 50 && sp.x >= minX && sp.x <= maxX && sp.y <= maxY) {
        const r = Math.max(1, sp.size * sp.life);
        ctx.moveTo(sp.x + r, sp.y);
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        countWhite++;
      }
    }
    if (countWhite > 0) ctx.fill();

    // Batch 2: Aqua droplets
    ctx.fillStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    let countAqua = 0;
    for (let i = 0; i < splashes.length; i++) {
      const sp = splashes[i];
      if (sp.color.charCodeAt(5) === 53 && sp.x >= minX && sp.x <= maxX && sp.y <= maxY) {
        const r = Math.max(1, sp.size * sp.life);
        ctx.moveTo(sp.x + r, sp.y);
        ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
        countAqua++;
      }
    }
    if (countAqua > 0) ctx.fill();

    // Fallback: any other colored droplets
    for (let i = 0; i < splashes.length; i++) {
      const sp = splashes[i];
      const c = sp.color.charCodeAt(5);
      if (c !== 50 && c !== 53 && sp.x >= minX && sp.x <= maxX && sp.y <= maxY) {
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = Math.max(0, sp.life * 0.95);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1, sp.size * sp.life), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Restore canvas global alpha to default
  ctx.globalAlpha = 1.0;
}

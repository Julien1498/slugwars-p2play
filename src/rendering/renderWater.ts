import { MapTheme } from '../core/types';

export interface WaterBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export interface WaterRipple {
  x: number;
  radius: number;
  life: number;
  color: string;
}

export interface WaterSplash {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

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
  bubbles: WaterBubble[];
  ripples: WaterRipple[];
  splashes: WaterSplash[];
}

// Pre-allocated typed arrays for wave points to avoid any memory allocations per frame
let _waveX = new Float32Array(1024);
let _waveY = new Float32Array(1024);

// Cached gradient to avoid re-instantiating CanvasGradient every frame
let _cachedGrad: CanvasGradient | null = null;
let _cachedWaterY = -99999;
let _cachedHeight = -99999;
let _cachedTheme: MapTheme | null = null;
let _cachedIsDay = true;

function getCachedFgWaterGradient(
  ctx: CanvasRenderingContext2D,
  waterY: number,
  height: number,
  theme: MapTheme,
  isDay: boolean
): CanvasGradient {
  if (
    _cachedGrad &&
    _cachedWaterY === waterY &&
    _cachedHeight === height &&
    _cachedTheme === theme &&
    _cachedIsDay === isDay
  ) {
    return _cachedGrad;
  }

  const grad = ctx.createLinearGradient(0, waterY, 0, waterY + Math.max(400, height * 0.6));
  if (isDay) {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      grad.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
      grad.addColorStop(0.12, 'rgba(249, 115, 22, 0.88)');
      grad.addColorStop(0.45, 'rgba(220, 38, 38, 0.94)');
      grad.addColorStop(1, 'rgba(23, 6, 2, 0.99)');
    } else if (theme === 'ARCHIPELAGO') {
      grad.addColorStop(0, 'rgba(20, 184, 166, 0.70)');
      grad.addColorStop(0.15, 'rgba(13, 148, 136, 0.82)');
      grad.addColorStop(0.45, 'rgba(15, 118, 110, 0.92)');
      grad.addColorStop(1, 'rgba(4, 47, 46, 0.99)');
    } else {
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.65)');
      grad.addColorStop(0.15, 'rgba(2, 132, 199, 0.78)');
      grad.addColorStop(0.45, 'rgba(3, 105, 161, 0.90)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.99)');
    }
  } else {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      grad.addColorStop(0.35, 'rgba(153, 27, 27, 0.94)');
      grad.addColorStop(1, 'rgba(3, 1, 2, 0.99)');
    } else {
      grad.addColorStop(0, 'rgba(14, 165, 233, 0.70)');
      grad.addColorStop(0.20, 'rgba(2, 132, 199, 0.82)');
      grad.addColorStop(0.50, 'rgba(3, 105, 161, 0.94)');
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.99)');
    }
  }

  _cachedGrad = grad;
  _cachedWaterY = waterY;
  _cachedHeight = height;
  _cachedTheme = theme;
  _cachedIsDay = isDay;
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
    bubbles,
    ripples,
    splashes,
  } = rc;

  const clampLeft = viewLeft !== undefined ? Math.max(worldLeft, viewLeft - 100) : worldLeft;
  const clampRight = viewRight !== undefined ? Math.min(worldRight, viewRight + 100) : worldRight;

  // Layer 1: Mid Translucent Rolling Wave
  ctx.fillStyle = isDay
    ? theme === 'CAVERN'
      ? 'rgba(249, 115, 22, 0.60)'
      : 'rgba(14, 165, 233, 0.55)'
    : 'rgba(30, 58, 138, 0.45)';
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  ctx.lineTo(clampLeft, worldBottom);
  for (let x = clampLeft; x <= clampRight; x += 14) {
    const wy2 = waterY + 3 + Math.sin(x * 0.012 + slowTime * 2.2 + 2.0) * 8 + Math.sin(x * 0.024 - slowTime * 1.4) * 3;
    ctx.lineTo(x, wy2);
  }
  ctx.lineTo(clampRight, worldBottom);
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Single-pass computation of the main surface wave points (used by Layers 2, 3, and 4)
  const neededCapacity = Math.ceil((clampRight - clampLeft) / 14) + 4;
  if (_waveX.length < neededCapacity) {
    _waveX = new Float32Array(neededCapacity + 64);
    _waveY = new Float32Array(neededCapacity + 64);
  }

  let ptCount = 0;
  for (let x = clampLeft; x <= clampRight; x += 14) {
    _waveX[ptCount] = x;
    _waveY[ptCount] = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    ptCount++;
  }

  // Layer 2: Front Main Ocean Body (Smooth cached gradient following wave surface)
  ctx.fillStyle = getCachedFgWaterGradient(ctx, waterY, height, theme, isDay);
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  ctx.lineTo(clampLeft, worldBottom);
  for (let i = 0; i < ptCount; i++) {
    ctx.lineTo(_waveX[i], _waveY[i]);
  }
  ctx.lineTo(clampRight, worldBottom);
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 3 & 4: Wave Crest Strokes (Combined single path construction)
  if (ptCount > 0) {
    ctx.beginPath();
    ctx.moveTo(_waveX[0], _waveY[0]);
    for (let i = 1; i < ptCount; i++) {
      ctx.lineTo(_waveX[i], _waveY[i]);
    }

    // Layer 3: Glowing Outer Aqua Rim
    ctx.strokeStyle = isDay
      ? theme === 'CAVERN'
        ? 'rgba(253, 224, 71, 0.75)'
        : 'rgba(56, 189, 248, 0.70)'
      : 'rgba(56, 189, 248, 0.50)';
    ctx.lineWidth = 5.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Layer 4: Ultra-Crisp Pure White Foam Crest Line (stroking the same active path)
    ctx.strokeStyle = isDay
      ? theme === 'CAVERN'
        ? '#ffffff'
        : '#ffffff'
      : '#e0f2fe';
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }

  // 3. Render Rising Air Bubbles (Direct alpha assignment, 0 save/restore, 0 GC allocations)
  ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 0.8;

  let writeBubbleIdx = 0;
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    b.x += b.vx + Math.sin(animTime * 6 + b.y * 0.1) * 0.4;
    b.y += b.vy;
    b.life -= 0.018;

    if (b.life > 0 && b.y > waterY - 4) {
      if (b.x >= worldLeft - 10 && b.x <= worldRight + 10) {
        ctx.globalAlpha = Math.max(0, b.life * 0.8);
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      bubbles[writeBubbleIdx++] = b;
    }
  }
  bubbles.length = writeBubbleIdx;

  // 4. Render Surface Expanding Water Ripples (Direct alpha assignment, 0 save/restore, 0 GC allocations)
  let writeRippleIdx = 0;
  for (let i = 0; i < ripples.length; i++) {
    const rip = ripples[i];
    rip.radius += 0.85;
    rip.life -= 0.024;

    if (rip.life > 0) {
      if (rip.x >= worldLeft - rip.radius * 2 && rip.x <= worldRight + rip.radius * 2) {
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

  // 5. Render Water Splash Droplets (Direct alpha assignment, 0 save/restore, 0 GC allocations)
  let writeSplashIdx = 0;
  for (let i = 0; i < splashes.length; i++) {
    const sp = splashes[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.26;
    sp.life -= 0.028;

    if (sp.life > 0) {
      if (sp.x >= worldLeft - 10 && sp.x <= worldRight + 10) {
        ctx.globalAlpha = Math.max(0, sp.life * 0.95);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, Math.max(1, sp.size * sp.life), 0, Math.PI * 2);
        ctx.fill();
      }
      splashes[writeSplashIdx++] = sp;
    }
  }
  splashes.length = writeSplashIdx;

  // Restore canvas global alpha to default
  ctx.globalAlpha = 1.0;
}

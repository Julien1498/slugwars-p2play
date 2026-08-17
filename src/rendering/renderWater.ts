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
  bubbles: WaterBubble[];
  ripples: WaterRipple[];
  splashes: WaterSplash[];
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
    bubbles,
    ripples,
    splashes,
  } = rc;

  // Layer 1: Mid Translucent Rolling Wave
  ctx.fillStyle = isDay
    ? theme === 'CAVERN'
      ? 'rgba(249, 115, 22, 0.60)'
      : 'rgba(14, 165, 233, 0.55)'
    : 'rgba(30, 58, 138, 0.45)';
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy2 = waterY + 3 + Math.sin(x * 0.012 + slowTime * 2.2 + 2.0) * 8 + Math.sin(x * 0.024 - slowTime * 1.4) * 3;
    ctx.lineTo(x, wy2);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 2: Front Main Ocean Body (Smooth gradient following wave surface)
  const fgWaterGrad = ctx.createLinearGradient(0, waterY, 0, waterY + Math.max(400, height * 0.6));
  if (isDay) {
    if (theme === 'CAVERN') {
      fgWaterGrad.addColorStop(0, 'rgba(253, 224, 71, 0.85)');
      fgWaterGrad.addColorStop(0.12, 'rgba(249, 115, 22, 0.88)');
      fgWaterGrad.addColorStop(0.45, 'rgba(220, 38, 38, 0.94)');
      fgWaterGrad.addColorStop(1, 'rgba(23, 6, 2, 0.99)');
    } else {
      fgWaterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.65)');
      fgWaterGrad.addColorStop(0.15, 'rgba(2, 132, 199, 0.78)');
      fgWaterGrad.addColorStop(0.45, 'rgba(3, 105, 161, 0.90)');
      fgWaterGrad.addColorStop(1, 'rgba(2, 6, 23, 0.99)');
    }
  } else {
    if (theme === 'CAVERN') {
      fgWaterGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');
      fgWaterGrad.addColorStop(0.35, 'rgba(153, 27, 27, 0.94)');
      fgWaterGrad.addColorStop(1, 'rgba(3, 1, 2, 0.99)');
    } else {
      fgWaterGrad.addColorStop(0, 'rgba(14, 165, 233, 0.60)');
      fgWaterGrad.addColorStop(0.3, 'rgba(15, 23, 42, 0.88)');
      fgWaterGrad.addColorStop(1, 'rgba(2, 4, 10, 0.99)');
    }
  }

  ctx.fillStyle = fgWaterGrad;
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy3 = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    ctx.lineTo(x, wy3);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 3: Glowing Outer Aqua Rim
  ctx.strokeStyle = isDay
    ? theme === 'CAVERN'
      ? 'rgba(253, 224, 71, 0.75)'
      : 'rgba(56, 189, 248, 0.70)'
    : 'rgba(56, 189, 248, 0.50)';
  ctx.lineWidth = 5.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  let firstFgPt = true;
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy3 = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    if (firstFgPt) {
      ctx.moveTo(x, wy3);
      firstFgPt = false;
    } else {
      ctx.lineTo(x, wy3);
    }
  }
  ctx.stroke();

  // Layer 4: Ultra-Crisp Pure White Foam Crest Line
  ctx.strokeStyle = isDay
    ? theme === 'CAVERN'
      ? '#ffffff'
      : '#ffffff'
    : '#e0f2fe';
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  firstFgPt = true;
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy3 = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    if (firstFgPt) {
      ctx.moveTo(x, wy3);
      firstFgPt = false;
    } else {
      ctx.lineTo(x, wy3);
    }
  }
  ctx.stroke();

  // 3. Render Rising Air Bubbles
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.x += b.vx + Math.sin(animTime * 6 + b.y * 0.1) * 0.4;
    b.y += b.vy;
    b.life -= 0.018;

    if (b.life <= 0 || b.y <= waterY - 4) {
      bubbles.splice(i, 1);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, b.life * 0.8);
      ctx.fillStyle = 'rgba(224, 242, 254, 0.85)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  // 4. Render Surface Expanding Water Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rip = ripples[i];
    rip.radius += 1.4;
    rip.life -= 0.020;

    if (rip.life <= 0) {
      ripples.splice(i, 1);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, rip.life * 0.95);
      ctx.strokeStyle = rip.color;
      ctx.lineWidth = Math.max(1.2, 3.2 * rip.life);
      ctx.beginPath();
      const localWaveY = waterY + Math.sin(rip.x * 0.010 + slowTime * 1.8) * 9 + Math.cos(rip.x * 0.020 - slowTime * 1.2) * 4;
      ctx.ellipse(rip.x, localWaveY, rip.radius * 1.8, rip.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 5. Render Water Splash Droplets
  for (let i = splashes.length - 1; i >= 0; i--) {
    const sp = splashes[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vy += 0.26;
    sp.life -= 0.028;

    if (sp.life <= 0) {
      splashes.splice(i, 1);
    } else {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.life * 0.95);
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, Math.max(1, sp.size * sp.life), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

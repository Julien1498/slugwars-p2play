import { MapTheme } from '../core/types';

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
}

export function renderSkyAndAtmosphere(rc: SkyRenderContext) {
  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, worldBottom, animTime, slowTime, width } = rc;

  // 1. Seamless Infinite Atmospheric Sky Horizon Gradient
  const skyGradTop = Math.min(-650, -height * 0.9);
  const skyGrad = ctx.createLinearGradient(0, skyGradTop, 0, waterY);
  if (isDay) {
    if (theme === 'CAVERN') {
      skyGrad.addColorStop(0, '#451a03');
      skyGrad.addColorStop(0.35, '#78350f');
      skyGrad.addColorStop(0.65, '#b45309');
      skyGrad.addColorStop(0.88, '#d97706');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (theme === 'FORTRESS') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.35, '#0369a1');
      skyGrad.addColorStop(0.70, '#0284c7');
      skyGrad.addColorStop(0.90, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else {
      skyGrad.addColorStop(0, '#0369a1');
      skyGrad.addColorStop(0.38, '#0284c7');
      skyGrad.addColorStop(0.74, '#38bdf8');
      skyGrad.addColorStop(1, '#e0f2fe');
    }
  } else {
    if (theme === 'CAVERN') {
      skyGrad.addColorStop(0, '#030102');
      skyGrad.addColorStop(0.35, '#170605');
      skyGrad.addColorStop(0.7, '#2b0c07');
      skyGrad.addColorStop(1, '#451a03');
    } else if (theme === 'FORTRESS' || theme === 'FLOATING_CHAOS') {
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
  ctx.fillStyle = skyGrad;
  ctx.fillRect(worldLeft, worldTop, worldRight - worldLeft, waterY - worldTop);

  // 2. Day & Night Atmospheric Particles & Clouds
  if (isDay) {
    if (theme === 'CAVERN') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      for (let b = 0; b < 9; b++) {
        const bx = worldLeft + ((b * 750 + 400) % (worldRight - worldLeft));
        ctx.beginPath();
        ctx.moveTo(bx - 20, worldTop);
        ctx.lineTo(bx + 20, worldTop);
        ctx.lineTo(bx + 160, waterY);
        ctx.lineTo(bx + 40, waterY);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      for (let c = 0; c < 12; c++) {
        const cx = (((Date.now() * 0.014 + c * 620) % (worldRight - worldLeft + 400)) + worldLeft) - 200;
        const cy = -250 + (c * 42) % (Math.max(160, height * 0.22) + 250);
        const cSize = 28 + (c * 7) % 18;

        ctx.beginPath();
        ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
        ctx.arc(cx + cSize * 0.7, cy - cSize * 0.25, cSize * 0.8, 0, Math.PI * 2);
        ctx.arc(cx + cSize * 1.4, cy + cSize * 0.1, cSize * 0.65, 0, Math.PI * 2);
        ctx.arc(cx - cSize * 0.6, cy + cSize * 0.1, cSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    for (let i = 0; i < 180; i++) {
      const sx = worldLeft + ((i * 317 + i * 83) % (worldRight - worldLeft));
      const sy = worldTop + ((i * 179 + i * 47) % (waterY - worldTop));
      const starAlpha = 0.15 + 0.65 * Math.abs(Math.sin(animTime * 0.7 + i * 1.6));
      const sz = i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.0;
      ctx.fillStyle = i % 5 === 0 ? `rgba(165, 243, 252, ${starAlpha})` : `rgba(255, 255, 255, ${starAlpha})`;
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  // 3. Iconic Celestial Focus (Sun / Moon / Rift)
  if (isDay) {
    if (theme === 'ISLAND' || theme === 'FORTRESS' || theme === 'FLOATING_CHAOS') {
      const sunX = width * 0.82;
      const sunY = height * 0.16;
      const sunR = 28;

      const sunGlow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 4.0);
      sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
      sunGlow.addColorStop(0.3, 'rgba(250, 204, 21, 0.5)');
      sunGlow.addColorStop(0.7, 'rgba(253, 224, 71, 0.15)');
      sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = sunGlow;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 4.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(sunX, sunY);
      ctx.rotate(animTime * 0.08);
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.3)';
      ctx.lineWidth = 2.5;
      for (let b = 0; b < 8; b++) {
        const bAngle = (b * Math.PI * 2) / 8;
        ctx.beginPath();
        ctx.moveTo(Math.cos(bAngle) * (sunR + 4), Math.sin(bAngle) * (sunR + 4));
        ctx.lineTo(Math.cos(bAngle) * (sunR + 26), Math.sin(bAngle) * (sunR + 26));
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    if (theme === 'ISLAND') {
      const moonX = width * 0.82;
      const moonY = height * 0.16;
      const moonR = 26;

      const glow = ctx.createRadialGradient(moonX, moonY, moonR * 0.3, moonX, moonY, moonR * 3.2);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      glow.addColorStop(0.5, 'rgba(129, 140, 248, 0.15)');
      glow.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR * 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(moonX, moonY);
      ctx.rotate(-0.35);
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.25)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, moonR * 2.2, moonR * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0a1329';
      ctx.beginPath();
      ctx.arc(moonX - moonR * 0.45, moonY - moonR * 0.2, moonR * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 4. Parallax Mountain & Ridge Horizons
  const mtGrad = ctx.createLinearGradient(0, height * 0.2, 0, waterY + 100);
  if (isDay) {
    if (theme === 'CAVERN') {
      mtGrad.addColorStop(0, 'rgba(180, 83, 9, 0.75)');
      mtGrad.addColorStop(1, 'rgba(120, 53, 15, 0.95)');
    } else if (theme === 'FORTRESS') {
      mtGrad.addColorStop(0, 'rgba(71, 85, 105, 0.75)');
      mtGrad.addColorStop(1, 'rgba(20, 83, 45, 0.90)');
    } else {
      mtGrad.addColorStop(0, 'rgba(34, 197, 94, 0.75)');
      mtGrad.addColorStop(1, 'rgba(21, 128, 61, 0.90)');
    }
  } else {
    mtGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    mtGrad.addColorStop(1, 'rgba(7, 10, 22, 0.95)');
  }

  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 40; x += 35) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, waterY + 100);
  ctx.closePath();
  ctx.fill();

  // Midground Ridge
  if (isDay) {
    ctx.fillStyle = theme === 'CAVERN' ? '#78350f' : theme === 'FORTRESS' ? '#14532d' : '#15803d';
  } else {
    ctx.fillStyle = theme === 'CAVERN' ? '#0d0403' : '#070b16';
  }
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 40; x += 25) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, waterY + 100);
  ctx.closePath();
  ctx.fill();

  // 5. Deep Ocean Horizon Backdrop below Water Level (Clean Multi-Layer Rolling Swell)
  const bgWaterGrad = ctx.createLinearGradient(0, waterY, 0, worldBottom);
  if (isDay) {
    if (theme === 'CAVERN') {
      bgWaterGrad.addColorStop(0, '#d97706');
      bgWaterGrad.addColorStop(0.3, '#9a3412');
      bgWaterGrad.addColorStop(0.7, '#431407');
      bgWaterGrad.addColorStop(1, '#170602');
    } else {
      bgWaterGrad.addColorStop(0, '#0284c7');
      bgWaterGrad.addColorStop(0.25, '#0369a1');
      bgWaterGrad.addColorStop(0.65, '#082f49');
      bgWaterGrad.addColorStop(1, '#020617');
    }
  } else {
    if (theme === 'CAVERN') {
      bgWaterGrad.addColorStop(0, '#dc2626');
      bgWaterGrad.addColorStop(0.35, '#7f1d1d');
      bgWaterGrad.addColorStop(1, '#170602');
    } else {
      bgWaterGrad.addColorStop(0, '#0ea5e9');
      bgWaterGrad.addColorStop(0.3, '#0f172a');
      bgWaterGrad.addColorStop(1, '#020617');
    }
  }

  // Layer 1: Back Ocean Deep Body Polygon
  ctx.fillStyle = bgWaterGrad;
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy1 = waterY + Math.sin(x * 0.008 + slowTime * 1.5) * 10 + Math.cos(x * 0.016 - slowTime * 1.0) * 4;
    ctx.lineTo(x, wy1);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 2: Mid Wave Translucent Swell
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

  // Layer 3: Front Horizon Wave with Clean White Foam Edge
  ctx.fillStyle = isDay
    ? theme === 'CAVERN'
      ? 'rgba(220, 38, 38, 0.80)'
      : 'rgba(2, 132, 199, 0.80)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy3 = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    ctx.lineTo(x, wy3);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Smooth White Foam Crest Line
  ctx.strokeStyle = isDay ? '#ffffff' : '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  let firstPt = true;
  for (let x = worldLeft; x <= worldRight; x += 12) {
    const wy3 = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    if (firstPt) {
      ctx.moveTo(x, wy3);
      firstPt = false;
    } else {
      ctx.lineTo(x, wy3);
    }
  }
  ctx.stroke();
}

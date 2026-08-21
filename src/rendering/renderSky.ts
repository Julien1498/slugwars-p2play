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

let _cachedSkyGrad: CanvasGradient | null = null;
let _cachedSkyGradTop = -99999;
let _cachedSkyWaterY = -99999;
let _cachedSkyTheme: MapTheme | null = null;
let _cachedSkyIsDay = true;

function getCachedSkyGradient(
  ctx: CanvasRenderingContext2D,
  skyGradTop: number,
  waterY: number,
  theme: MapTheme,
  isDay: boolean
): CanvasGradient {
  if (
    _cachedSkyGrad &&
    _cachedSkyGradTop === skyGradTop &&
    _cachedSkyWaterY === waterY &&
    _cachedSkyTheme === theme &&
    _cachedSkyIsDay === isDay
  ) {
    return _cachedSkyGrad;
  }

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
    if (theme === 'CAVERN') {
      skyGrad.addColorStop(0, '#030102');
      skyGrad.addColorStop(0.35, '#170605');
      skyGrad.addColorStop(0.7, '#2b0c07');
      skyGrad.addColorStop(1, '#451a03');
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
  _cachedSkyGradTop = skyGradTop;
  _cachedSkyWaterY = waterY;
  _cachedSkyTheme = theme;
  _cachedSkyIsDay = isDay;
  return skyGrad;
}

export function renderSkyAndAtmosphere(rc: SkyRenderContext) {
  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, worldBottom, animTime, slowTime, width } = rc;

  // 1. Seamless Infinite Atmospheric Sky Horizon Gradient
  const skyGradTop = Math.min(-650, -height * 0.9);
  ctx.fillStyle = getCachedSkyGradient(ctx, skyGradTop, waterY, theme, isDay);
  ctx.fillRect(worldLeft, worldTop, worldRight - worldLeft, waterY - worldTop);

  // 2. Day & Night Atmospheric Particles & Clouds (Streamlined lightweight rendering)
  if (isDay) {
    if (theme === 'CAVERN') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      for (let b = 0; b < 5; b++) {
        const bx = worldLeft + ((b * 900 + 400) % (worldRight - worldLeft));
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
      for (let c = 0; c < 5; c++) {
        const cx = (((Date.now() * 0.012 + c * 750) % (worldRight - worldLeft + 400)) + worldLeft) - 200;
        const cy = -200 + (c * 60) % (Math.max(160, height * 0.22) + 200);
        const cSize = 32 + (c * 8) % 16;

        ctx.beginPath();
        ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
        ctx.arc(cx + cSize * 0.7, cy - cSize * 0.25, cSize * 0.8, 0, Math.PI * 2);
        ctx.arc(cx + cSize * 1.4, cy + cSize * 0.1, cSize * 0.65, 0, Math.PI * 2);
        ctx.arc(cx - cSize * 0.6, cy + cSize * 0.1, cSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else {
    for (let i = 0; i < 40; i++) {
      const sx = worldLeft + ((i * 317 + i * 83) % (worldRight - worldLeft));
      const sy = worldTop + ((i * 179 + i * 47) % (waterY - worldTop));
      const starAlpha = 0.35 + 0.55 * Math.abs(Math.sin(animTime * 0.7 + i * 1.6));
      ctx.fillStyle = i % 5 === 0 ? `rgba(165, 243, 252, ${starAlpha})` : `rgba(255, 255, 255, ${starAlpha})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // 3. Iconic Celestial Focus (Sun / Moon / Rift / Searchlight)
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
    } else if (theme === 'FLOATING_CHAOS') {
      const riftX = width * 0.78;
      const riftY = height * 0.18;
      const riftR = 30;

      const riftGlow = ctx.createRadialGradient(riftX, riftY, 5, riftX, riftY, riftR * 2.8);
      riftGlow.addColorStop(0, 'rgba(192, 132, 252, 0.55)');
      riftGlow.addColorStop(0.5, 'rgba(147, 51, 234, 0.18)');
      riftGlow.addColorStop(1, 'rgba(8, 3, 19, 0)');
      ctx.fillStyle = riftGlow;
      ctx.beginPath();
      ctx.arc(riftX, riftY, riftR * 2.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#c084fc';
      for (let s = 0; s < 6; s++) {
        const sAngle = (s * Math.PI * 2) / 6 + animTime * 0.15;
        const sDist = riftR * 1.1 + Math.sin(animTime * 0.5 + s) * 4;
        const sx = riftX + Math.cos(sAngle) * sDist;
        const sy = riftY + Math.sin(sAngle) * sDist;
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (theme === 'FORTRESS') {
      const beamX = width * 0.22;
      const beamY = height * 0.52;
      const sweepAngle = -0.9 + Math.sin(slowTime * 1.2) * 0.45;
      const beamLen = height * 0.85;

      ctx.save();
      ctx.translate(beamX, beamY);
      ctx.rotate(sweepAngle);

      const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamLen);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      beamGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.08)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-45, -beamLen);
      ctx.lineTo(45, -beamLen);
      ctx.lineTo(6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // 4. Parallax Mountain Horizon (Ultra-fast 120px step path)
  const mtGrad = ctx.createLinearGradient(0, height * 0.2, 0, waterY + 100);
  if (isDay) {
    if (theme === 'CAVERN') {
      mtGrad.addColorStop(0, 'rgba(180, 83, 9, 0.75)');
      mtGrad.addColorStop(1, 'rgba(120, 53, 15, 0.95)');
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
    if (theme === 'CAVERN') {
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

  ctx.fillStyle = mtGrad;
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 120; x += 120) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, waterY + 100);
  ctx.closePath();
  ctx.fill();

  // 5. Midground Ridge (Ultra-fast 100px step path)
  if (isDay) {
    ctx.fillStyle = theme === 'CAVERN' ? '#78350f' : theme === 'FORTRESS' ? '#14532d' : theme === 'FLOATING_CHAOS' ? '#047857' : '#15803d';
  } else {
    ctx.fillStyle = theme === 'CAVERN' ? '#0d0403' : theme === 'FLOATING_CHAOS' ? '#0b0417' : '#070b16';
  }
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 100; x += 100) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, waterY + 100);
  ctx.closePath();
  ctx.fill();

  // 6. Base Ocean Background Fill
  const deepGrad = ctx.createLinearGradient(0, waterY, 0, worldBottom);
  if (isDay) {
    deepGrad.addColorStop(0, theme === 'CAVERN' ? '#d97706' : '#0284c7');
    deepGrad.addColorStop(0.4, theme === 'CAVERN' ? '#9a3412' : '#0369a1');
    deepGrad.addColorStop(1, theme === 'CAVERN' ? '#170602' : '#020617');
  } else {
    deepGrad.addColorStop(0, theme === 'CAVERN' ? '#dc2626' : '#0ea5e9');
    deepGrad.addColorStop(0.4, theme === 'CAVERN' ? '#7f1d1d' : '#0f172a');
    deepGrad.addColorStop(1, theme === 'CAVERN' ? '#170602' : '#020617');
  }
  ctx.fillStyle = deepGrad;
  ctx.fillRect(worldLeft, waterY, worldRight - worldLeft, worldBottom - waterY);
}

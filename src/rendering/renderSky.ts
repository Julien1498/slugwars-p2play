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

interface StaticSkyBackdrop {
  canvas: HTMLCanvasElement;
  originX: number;
  originY: number;
  width: number;
  height: number;
}

let _cachedBackdrop: StaticSkyBackdrop | null = null;
let _cachedBackdropWaterY = -99999;
let _cachedBackdropHeight = -99999;
let _cachedBackdropWidth = -99999;
let _cachedBackdropTheme: MapTheme | null = null;
let _cachedBackdropIsDay = true;

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

function bakeStaticSkyBackdrop(
  width: number,
  height: number,
  waterY: number,
  theme: MapTheme,
  isDay: boolean
): StaticSkyBackdrop {
  const originX = -1400;
  const originY = -1000;
  const bufferWidth = width + 2800;
  const bufferHeight = height + 2000;

  const canvas = document.createElement('canvas');
  canvas.width = bufferWidth;
  canvas.height = bufferHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { canvas, originX, originY, width: bufferWidth, height: bufferHeight };
  }

  ctx.translate(-originX, -originY);

  const worldLeft = originX;
  const worldRight = originX + bufferWidth;
  const worldTop = originY;
  const worldBottom = originY + bufferHeight;

  // 1. Seamless Infinite Sky Horizon Gradient
  const skyGradTop = Math.min(-650, -height * 0.9);
  ctx.fillStyle = getCachedSkyGradient(ctx, skyGradTop, waterY, theme, isDay);
  ctx.fillRect(worldLeft, worldTop, bufferWidth, waterY - worldTop);

  // 2. Day Clouds / Cavern Light Beams / Night Stars
  if (isDay) {
    if (theme === 'CAVERN') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      for (let b = 0; b < 9; b++) {
        const bx = worldLeft + ((b * 750 + 400) % bufferWidth);
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
        const cx = worldLeft + ((c * 620 + 200) % (bufferWidth - 200));
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
      const sx = worldLeft + ((i * 317 + i * 83) % bufferWidth);
      const sy = worldTop + ((i * 179 + i * 47) % (waterY - worldTop));
      const sz = i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.0;
      ctx.fillStyle = i % 5 === 0 ? 'rgba(165, 243, 252, 0.75)' : 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(sx, sy, sz, sz);
    }
  }

  // 3. Static Celestial Body & Glow (Sun / Moon / Rift)
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
    }
  }

  // 4. Parallax Mountains Horizon
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
  for (let x = worldLeft; x <= worldRight + 40; x += 35) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, waterY + 100);
  ctx.closePath();
  ctx.fill();

  // 5. Midground Ridge
  if (isDay) {
    ctx.fillStyle = theme === 'CAVERN' ? '#78350f' : theme === 'FORTRESS' ? '#14532d' : theme === 'FLOATING_CHAOS' ? '#047857' : '#15803d';
  } else {
    ctx.fillStyle = theme === 'CAVERN' ? '#0d0403' : theme === 'FLOATING_CHAOS' ? '#0b0417' : '#070b16';
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

  // 6. Dotted Lush Grass Blade Dashes
  if (isDay && (theme === 'ISLAND' || theme === 'FLOATING_CHAOS' || theme === 'FORTRESS' || !theme)) {
    ctx.strokeStyle = theme === 'FLOATING_CHAOS' ? '#6ee7b7' : '#4ade80';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let x = worldLeft; x <= worldRight; x += 14) {
      const by = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
      ctx.moveTo(x, by);
      ctx.lineTo(x + Math.sin(x * 0.1) * 3, by - 5 - (Math.abs(x) % 4));
    }
    ctx.stroke();
  }

  // 7. Base Deep Water Fill under mountains
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
  ctx.fillRect(worldLeft, waterY, bufferWidth, worldBottom - waterY);

  return {
    canvas,
    originX,
    originY,
    width: bufferWidth,
    height: bufferHeight,
  };
}

function getOrBakeStaticSkyBackdrop(
  width: number,
  height: number,
  waterY: number,
  theme: MapTheme,
  isDay: boolean
): StaticSkyBackdrop {
  if (
    _cachedBackdrop &&
    _cachedBackdropWidth === width &&
    _cachedBackdropHeight === height &&
    _cachedBackdropWaterY === waterY &&
    _cachedBackdropTheme === theme &&
    _cachedBackdropIsDay === isDay
  ) {
    return _cachedBackdrop;
  }

  _cachedBackdrop = bakeStaticSkyBackdrop(width, height, waterY, theme, isDay);
  _cachedBackdropWidth = width;
  _cachedBackdropHeight = height;
  _cachedBackdropWaterY = waterY;
  _cachedBackdropTheme = theme;
  _cachedBackdropIsDay = isDay;
  return _cachedBackdrop;
}

export function renderSkyAndAtmosphere(rc: SkyRenderContext) {
  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, worldBottom, animTime, slowTime, width } = rc;

  // 1. Infinite Sky Fallback Fill for extreme zoom-out
  const skyGradTop = Math.min(-650, -height * 0.9);
  ctx.fillStyle = getCachedSkyGradient(ctx, skyGradTop, waterY, theme, isDay);
  ctx.fillRect(worldLeft, worldTop, worldRight - worldLeft, waterY - worldTop);

  // 2. 1-Call High-Performance Blit of Pre-baked Static Backdrop (0 CPU vector overhead)
  const backdrop = getOrBakeStaticSkyBackdrop(width, height, waterY, theme, isDay);
  if (backdrop) {
    ctx.drawImage(backdrop.canvas, backdrop.originX, backdrop.originY);
  }

  // 3. Dynamic rotating sun rays / searchlight (lightweight 60fps animations on top)
  if (isDay) {
    if (theme === 'ISLAND' || theme === 'FORTRESS' || theme === 'FLOATING_CHAOS') {
      const sunX = width * 0.82;
      const sunY = height * 0.16;
      const sunR = 28;

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
    }
  } else {
    if (theme === 'FORTRESS') {
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
}

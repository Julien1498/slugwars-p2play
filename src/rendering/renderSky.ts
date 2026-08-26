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
  viewLeft?: number;
  viewRight?: number;
}

// Cached sky gradient
let _cachedSkyGrad: CanvasGradient | null = null;
let _cachedSkyKey = '';

// Cached mountain gradient
let _cachedMtGrad: CanvasGradient | null = null;
let _cachedMtKey = '';

// Pre-allocated typed arrays for background wave points
let _bgWaveX = new Float32Array(1024);
let _bgWaveY = new Float32Array(1024);

// Cached background water gradient
let _cachedBgWaterGrad: CanvasGradient | null = null;
let _cachedBgWaterY = -99999;
let _cachedBgWorldBottom = -99999;
let _cachedBgTheme: MapTheme | null = null;
let _cachedBgIsDay = true;

function getCachedBgWaterGradient(
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
  } else if (theme === 'ARCHIPELAGO') {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.35, '#0369a1');
    grad.addColorStop(0.75, '#0c4a6e');
    grad.addColorStop(1, '#082f49');
  } else if (theme === 'NATURAL_ARCHES') {
    grad.addColorStop(0, '#9a3412');
    grad.addColorStop(0.35, '#7c2d12');
    grad.addColorStop(0.75, '#431407');
    grad.addColorStop(1, '#270a03');
  } else if (theme === 'SPIRES') {
    grad.addColorStop(0, '#0284c7');
    grad.addColorStop(0.35, '#0369a1');
    grad.addColorStop(0.75, '#0c4a6e');
    grad.addColorStop(1, '#082f49');
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

export function renderSkyAndAtmosphere(rc: SkyRenderContext) {

  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, worldBottom, animTime, slowTime, width } = rc;

  // 1. Seamless Infinite Atmospheric Sky Horizon Gradient
  const skyGradTop = Math.min(-650, -height * 0.9);
  const skyKey = `${skyGradTop}_${waterY}_${theme}_${isDay}`;
  if (_cachedSkyKey !== skyKey || !_cachedSkyGrad) {
    const skyGrad = ctx.createLinearGradient(0, skyGradTop, 0, waterY);
    if (isDay) {
      if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
        skyGrad.addColorStop(0, '#451a03');
        skyGrad.addColorStop(0.35, '#78350f');
        skyGrad.addColorStop(0.65, '#b45309');
        skyGrad.addColorStop(0.88, '#d97706');
        skyGrad.addColorStop(1, '#fef08a');
      } else if (theme === 'NATURAL_ARCHES') {
        // Warm desert sunset canyon sky
        skyGrad.addColorStop(0, '#7c2d12');
        skyGrad.addColorStop(0.30, '#c2410c');
        skyGrad.addColorStop(0.65, '#ea580c');
        skyGrad.addColorStop(0.85, '#f59e0b');
        skyGrad.addColorStop(1, '#fef08a');
      } else if (theme === 'SPIRES') {
        // Alpine mountain clear azure sky
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.35, '#38bdf8');
        skyGrad.addColorStop(0.70, '#7dd3fc');
        skyGrad.addColorStop(0.90, '#bae6fd');
        skyGrad.addColorStop(1, '#f0f9ff');
      } else if (theme === 'ARCHIPELAGO') {
        // Vibrant tropical turquoise lagoon sky
        skyGrad.addColorStop(0, '#0369a1');
        skyGrad.addColorStop(0.30, '#0284c7');
        skyGrad.addColorStop(0.65, '#38bdf8');
        skyGrad.addColorStop(0.88, '#7dd3fc');
        skyGrad.addColorStop(1, '#e0f2fe');
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
  }

  const drawLeft = rc.viewLeft !== undefined ? Math.max(worldLeft, rc.viewLeft - 100) : worldLeft;
  const drawRight = rc.viewRight !== undefined ? Math.min(worldRight, rc.viewRight + 100) : worldRight;

  ctx.fillStyle = _cachedSkyGrad;
  ctx.fillRect(drawLeft, worldTop, drawRight - drawLeft, waterY - worldTop);


  // 2. Light Rays / Clouds / Atmosphere Particles
  if (isDay) {
    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
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

  // 3. Iconic Celestial Focus (Sun / Moon / Rift / Searchlight)
  if (isDay) {
    if (theme === 'ISLAND' || theme === 'FORTRESS' || theme === 'FLOATING_CHAOS' || theme === 'SPIRES' || theme === 'ARCHIPELAGO') {
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
    if (theme === 'ISLAND' || theme === 'SPIRES' || theme === 'ARCHIPELAGO') {
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
      const beamLen = 900;

      ctx.save();
      ctx.translate(beamX, beamY);
      ctx.rotate(sweepAngle);
      const beamGrad = ctx.createLinearGradient(0, 0, 0, -beamLen);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
      beamGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.12)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(-45, -beamLen);
      ctx.lineTo(45, -beamLen);
      ctx.lineTo(6, 0);
      ctx.restore();
    }
  }

  // 4. Background Mountain & Ridge Horizons (Theme-Specific Colors)
  const mtKey = `${height}_${waterY}_${theme}_${isDay}`;
  if (_cachedMtKey !== mtKey || !_cachedMtGrad) {
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
  }

  ctx.fillStyle = _cachedMtGrad;
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 40; x += 35) {
    const my = height * 0.46 + Math.sin(x * 0.003 + 0.8) * 65 + Math.cos(x * 0.007) * 35;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.lineTo(worldLeft, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Midground Ridge
  if (isDay) {
    ctx.fillStyle = (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') ? '#78350f' : theme === 'NATURAL_ARCHES' ? '#7c2d12' : theme === 'SPIRES' ? '#334155' : theme === 'FORTRESS' ? '#14532d' : theme === 'FLOATING_CHAOS' ? '#047857' : '#15803d';
  } else {
    ctx.fillStyle = (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') ? '#0d0403' : theme === 'NATURAL_ARCHES' ? '#2e1065' : theme === 'SPIRES' ? '#0f172a' : theme === 'FLOATING_CHAOS' ? '#0b0417' : '#070b16';
  }
  ctx.beginPath();
  ctx.moveTo(worldLeft, waterY + 100);
  for (let x = worldLeft; x <= worldRight + 40; x += 25) {
    const my = height * 0.62 + Math.sin(x * 0.005 + 2.4) * 45;
    ctx.lineTo(x, my);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.lineTo(worldLeft, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Dotted Lush Grass Blade Dashes on Green Hills (Island, Floating Chaos, Fortress, Spires)
  if (isDay && (theme === 'ISLAND' || theme === 'FLOATING_CHAOS' || theme === 'FORTRESS' || theme === 'SPIRES' || !theme)) {
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

  // 5. Deep Ocean Horizon Backdrop below Water Level (Clean Multi-Layer Rolling Swell)
  ctx.fillStyle = getCachedBgWaterGradient(ctx, waterY, worldBottom, theme, isDay);


  // Layer 1: Back Ocean Deep Body Polygon
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

  // Layer 3 & 4: Single-pass Horizon Surface Wave Computation
  const neededBgCap = Math.ceil((worldRight - worldLeft) / 12) + 2;
  if (_bgWaveX.length < neededBgCap) {
    _bgWaveX = new Float32Array(neededBgCap + 64);
    _bgWaveY = new Float32Array(neededBgCap + 64);
  }

  let bgPtCount = 0;
  for (let x = worldLeft; x <= worldRight; x += 12) {
    _bgWaveX[bgPtCount] = x;
    _bgWaveY[bgPtCount] = waterY + Math.sin(x * 0.010 + slowTime * 1.8) * 9 + Math.cos(x * 0.020 - slowTime * 1.2) * 4;
    bgPtCount++;
  }

  // Layer 3: Front Horizon Wave
  ctx.fillStyle = isDay
    ? theme === 'CAVERN'
      ? 'rgba(220, 38, 38, 0.80)'
      : 'rgba(2, 132, 199, 0.80)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.beginPath();
  ctx.moveTo(worldLeft, worldBottom);
  for (let i = 0; i < bgPtCount; i++) {
    ctx.lineTo(_bgWaveX[i], _bgWaveY[i]);
  }
  ctx.lineTo(worldRight, worldBottom);
  ctx.closePath();
  ctx.fill();

  // Layer 4: Smooth White Foam Crest Line (reusing same computed points)
  ctx.strokeStyle = isDay ? '#ffffff' : '#94a3b8';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(_bgWaveX[0], _bgWaveY[0]);
  for (let i = 1; i < bgPtCount; i++) {
    ctx.lineTo(_bgWaveX[i], _bgWaveY[i]);
  }
  ctx.stroke();
}

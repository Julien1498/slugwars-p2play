import { MapTheme } from '../../core/types';
import { getThemeConfig } from '../../core/terrain/themeRegistry';
import { getCachedSunGlowGradient, getCachedMoonGlowGradient } from './skyGradients';

export interface SkyAtmosphereParams {
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
  drawLeft: number;
  drawRight: number;
  drawTop: number;
}

export function renderCloudsAndStars(p: SkyAtmosphereParams) {
  const { ctx, height, waterY, theme, isDay, worldLeft, worldRight, worldTop, animTime, drawLeft, drawRight, drawTop } = p;
  const config = getThemeConfig(theme);

  if (isDay) {
    if (config.rendering.atmosphere === 'CAVERN_BEAMS') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
      for (let b = 0; b < 9; b++) {
        const bx = worldLeft + ((b * 750 + 400) % (worldRight - worldLeft));
        if (bx + 180 < drawLeft || bx - 40 > drawRight) continue;
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
      ctx.beginPath();
      for (let c = 0; c < 12; c++) {
        const cx = (((Date.now() * 0.014 + c * 620) % (worldRight - worldLeft + 400)) + worldLeft) - 200;
        const cy = -250 + (c * 42) % (Math.max(160, height * 0.22) + 250);
        const cSize = 28 + (c * 7) % 18;

        // Viewport Culling: Skip clouds completely offscreen
        if (cx + cSize * 2.5 < drawLeft || cx - cSize * 1.5 > drawRight) continue;
        if (cy + cSize * 1.5 < drawTop || cy - cSize * 1.5 > waterY) continue;

        ctx.moveTo(cx + cSize, cy);
        ctx.arc(cx, cy, cSize, 0, Math.PI * 2);
        ctx.moveTo(cx + cSize * 0.7 + cSize * 0.8, cy - cSize * 0.25);
        ctx.arc(cx + cSize * 0.7, cy - cSize * 0.25, cSize * 0.8, 0, Math.PI * 2);
        ctx.moveTo(cx + cSize * 1.4 + cSize * 0.65, cy + cSize * 0.1);
        ctx.arc(cx + cSize * 1.4, cy + cSize * 0.1, cSize * 0.65, 0, Math.PI * 2);
        ctx.moveTo(cx - cSize * 0.6 + cSize * 0.6, cy + cSize * 0.1);
        ctx.arc(cx - cSize * 0.6, cy + cSize * 0.1, cSize * 0.6, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 180; i++) {
      const sx = worldLeft + ((i * 317 + i * 83) % (worldRight - worldLeft));
      if (sx < drawLeft - 5 || sx > drawRight + 5) continue;
      const sy = worldTop + ((i * 179 + i * 47) % (waterY - worldTop));
      if (sy < drawTop - 5 || sy > waterY + 5) continue;

      const starAlpha = 0.15 + 0.65 * Math.abs(Math.sin(animTime * 0.7 + i * 1.6));
      const sz = i % 7 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.0;
      ctx.globalAlpha = starAlpha;
      ctx.fillStyle = i % 5 === 0 ? '#a5f3fc' : '#ffffff';
      ctx.fillRect(sx, sy, sz, sz);
    }
    ctx.globalAlpha = 1.0;
  }
}

export function renderCelestialBodies(p: SkyAtmosphereParams) {
  const { ctx, width, height, theme, isDay, animTime, slowTime } = p;
  const config = getThemeConfig(theme);

  if (isDay) {
    if (config.rendering.celestial.day === 'SUN') {
      const sunX = width * 0.82;
      const sunY = height * 0.16;
      const sunR = 28;

      ctx.fillStyle = getCachedSunGlowGradient(ctx, sunX, sunY, sunR);
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
    const nightCelestial = config.rendering.celestial.night;
    if (nightCelestial === 'MOON') {
      const moonX = width * 0.82;
      const moonY = height * 0.16;
      const moonR = 26;

      ctx.fillStyle = getCachedMoonGlowGradient(ctx, moonX, moonY, moonR);
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
    } else if (nightCelestial === 'CHAOS_RIFT') {
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
    } else if (nightCelestial === 'SEARCHLIGHT') {
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
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

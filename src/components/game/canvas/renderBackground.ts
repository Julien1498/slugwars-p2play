import { GameState } from '../../../core/types';
import { TerrainData } from '../../../core/terrainGenerator';

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  terrainData: TerrainData,
  animTime: number,
  slowTime: number
): void {
  const { width, height, waterLevel } = terrainData;
  const isDay = gameState.config.dayNightCycle === 'DAY';

  // 1. Sky Gradient (Day Azure vs Night Midnight)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isDay) {
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.5, '#38bdf8');
    skyGrad.addColorStop(0.8, '#7dd3fc');
    skyGrad.addColorStop(1, '#bae6fd');
  } else {
    skyGrad.addColorStop(0, '#1e1b4b');
    skyGrad.addColorStop(0.5, '#0f172a');
    skyGrad.addColorStop(1, '#1e293b');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Sun (Day) vs Moon & Stars (Night)
  if (isDay) {
    const sunX = width * 0.82;
    const sunY = 70;
    const sunRadius = 28;

    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 3);
    sunGlow.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
    sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.2)');
    sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Sunny White Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let c = 0; c < 4; c++) {
      const cx = ((Date.now() * 0.015 + c * 350) % (width + 200)) - 100;
      const cy = 40 + (c * 25) % 60;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 35, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - 18, cy - 8, 20, 14, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 18, cy - 6, 22, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 65; i++) {
      const sx = (i * 137.5) % width;
      const sy = (i * 73.1) % (height * 0.5);
      const alpha = 0.3 + 0.7 * Math.abs(Math.sin(animTime * 0.8 + i));
      ctx.globalAlpha = alpha;
      ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
    }
    ctx.globalAlpha = 1.0;

    const moonX = width * 0.82;
    const moonY = 65;
    const moonRadius = 28;

    const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 3.5);
    moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
    moonGlow.addColorStop(0.4, 'rgba(253, 224, 71, 0.25)');
    moonGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Parallax Mountain Silhouettes
  ctx.fillStyle = isDay ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 58, 138, 0.65)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  const mtPeaks = [
    { x: 0, y: height * 0.45 },
    { x: width * 0.15, y: height * 0.25 },
    { x: width * 0.3, y: height * 0.4 },
    { x: width * 0.45, y: height * 0.22 },
    { x: width * 0.65, y: height * 0.38 },
    { x: width * 0.8, y: height * 0.18 },
    { x: width, y: height * 0.42 },
  ];
  for (const p of mtPeaks) {
    ctx.lineTo(p.x, p.y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 5. Parallax Midground Forest Line
  ctx.fillStyle = isDay ? '#15803d' : '#064e3b';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.6);
  for (let tx = 0; tx <= width; tx += 12) {
    const treeH = 25 + Math.sin(tx * 0.08) * 12 + Math.cos(tx * 0.03) * 15;
    const ty = height * 0.55 - treeH;
    ctx.lineTo(tx - 6, ty + treeH);
    ctx.lineTo(tx, ty);
    ctx.lineTo(tx + 6, ty + treeH);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 6. Deep Water Backdrop & Caustics
  const waterBackdropGrad = ctx.createLinearGradient(0, waterLevel - 10, 0, height);
  waterBackdropGrad.addColorStop(0, 'rgba(2, 132, 199, 0.78)');
  waterBackdropGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.9)');
  waterBackdropGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
  ctx.fillStyle = waterBackdropGrad;
  ctx.fillRect(0, waterLevel - 5, width, height - (waterLevel - 5));

  // Underwater Caustic Light Rays
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let r = 0; r < 5; r++) {
    const rx = width * (0.15 + r * 0.18) + Math.sin(animTime * 0.5 + r) * 15;
    ctx.beginPath();
    ctx.moveTo(rx, waterLevel);
    ctx.lineTo(rx - 25, height);
    ctx.lineTo(rx + 35, height);
    ctx.lineTo(rx + 20, waterLevel);
    ctx.closePath();
    ctx.fill();
  }

  // Underwater Kelp & Seaweed Plants
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2.5;
  for (let k = 0; k < 8; k++) {
    const kx = width * (0.05 + k * 0.12);
    const ky = height;
    const kSway = Math.sin(animTime * 1.5 + k) * 12;
    ctx.beginPath();
    ctx.moveTo(kx, ky);
    ctx.quadraticCurveTo(kx + kSway * 0.5, ky - 20, kx + kSway, ky - 40);
    ctx.stroke();
  }

  // Swimming Little Fish Silhouettes
  ctx.fillStyle = '#38bdf8';
  for (let f = 0; f < 4; f++) {
    const fishX = ((Date.now() * 0.04 + f * 180) % (width + 40)) - 20;
    const fishY = waterLevel + 20 + (f * 15) % 35;
    ctx.beginPath();
    ctx.ellipse(fishX, fishY, 4, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fishX - 4, fishY);
    ctx.lineTo(fishX - 7, fishY - 2);
    ctx.lineTo(fishX - 7, fishY + 2);
    ctx.closePath();
    ctx.fill();
  }
}

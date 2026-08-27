import { drawSafeEllipse, drawRoundRect } from './lobbyGeometry';

export const drawFortifiedBastion = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  title: string,
  accentColor: string,
  t: number
) => {
  c.save();
  c.translate(x, y);

  // Heavy Concrete Bunker Base with armored bevels
  c.fillStyle = '#1e1e24';
  c.strokeStyle = '#09090b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(-w / 2 - 12, h);
  c.lineTo(w / 2 + 12, h);
  c.lineTo(w / 2, 0);
  c.closePath();
  c.fill();
  c.stroke();

  // Concrete Wall Armor Panel Seams & Rivets
  c.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(-w / 2 + 15, 12);
  c.lineTo(-w / 2 + 5, h - 10);
  c.moveTo(w / 2 - 15, 12);
  c.lineTo(w / 2 - 5, h - 10);
  c.stroke();

  // Steel Rivets
  c.fillStyle = '#71717a';
  for (let r = 0; r < 4; r++) {
    const ry = 18 + r * 18;
    c.beginPath();
    c.arc(-w / 2 + 8, ry, 1.8, 0, Math.PI * 2);
    c.arc(w / 2 - 8, ry, 1.8, 0, Math.PI * 2);
    c.fill();
  }

  // Glowing Slit Observation Window
  c.fillStyle = accentColor;
  c.shadowColor = accentColor;
  c.shadowBlur = 10;
  drawRoundRect(c, -w * 0.28, 16, w * 0.56, 8, 2);
  c.fill();
  c.shadowBlur = 0;

  // Interior Radar Waveform
  c.fillStyle = '#ffffff';
  c.fillRect(-w * 0.15 + Math.sin(t * 4) * w * 0.1, 18, 4, 4);

  // Flashing Alert Indicator LEDs
  const ledBlink = Math.sin(t * 6) > 0;
  c.fillStyle = ledBlink ? '#ef4444' : '#7f1d1d';
  c.beginPath();
  c.arc(-w * 0.35, 10, 2.5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = ledBlink ? '#22c55e' : '#14532d';
  c.beginPath();
  c.arc(-w * 0.35 + 8, 10, 2.5, 0, Math.PI * 2);
  c.fill();

  // Platform Top Deck
  c.fillStyle = '#15803d';
  drawRoundRect(c, -w / 2 - 6, -6, w + 12, 12, 5);
  c.fill();
  c.fillStyle = '#22c55e';
  drawRoundRect(c, -w / 2 - 4, -6, w + 8, 6, 3);
  c.fill();

  // Barbed Wire Strand
  c.strokeStyle = '#a1a1aa';
  c.lineWidth = 1.2;
  c.beginPath();
  for (let bx = -w / 2 - 4; bx <= w / 2 + 4; bx += 10) {
    c.moveTo(bx, -6);
    c.lineTo(bx + 5, -11);
    c.lineTo(bx + 10, -6);
  }
  c.stroke();

  // Metal Nameplate
  c.fillStyle = 'rgba(0, 0, 0, 0.85)';
  c.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  c.lineWidth = 1;
  drawRoundRect(c, -44, h - 14, 88, 18, 4);
  c.fill();
  c.stroke();

  c.fillStyle = '#e4e4e7';
  c.font = 'bold 10px monospace';
  c.textAlign = 'center';
  c.fillText(title, 0, h - 1);

  c.restore();
};

export const drawSearchlightTower = (
  ctx: CanvasRenderingContext2D,
  searchlightX: number,
  searchlightY: number,
  height: number,
  t: number
) => {
  const sweepAngle = -Math.PI * 0.35 + Math.sin(t * 0.9) * 0.55;

  ctx.save();
  ctx.translate(searchlightX, searchlightY);

  // Steel Lattice Mast
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, 28);
  ctx.lineTo(-4, 4);
  ctx.moveTo(7, 28);
  ctx.lineTo(4, 4);
  ctx.moveTo(-6, 22);
  ctx.lineTo(5, 12);
  ctx.moveTo(6, 22);
  ctx.lineTo(-5, 12);
  ctx.stroke();

  // Concrete Base Collar
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, -10, 24, 20, 6, 2);
  ctx.fill();
  ctx.stroke();

  // Turret Yoke Bracket
  ctx.fillStyle = '#3f3f46';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 4, 5, 0, Math.PI);
  ctx.fill();
  ctx.stroke();

  // Searchlight Housing
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(0, 0, 2, 0, Math.PI * 2);
  ctx.fill();

  // Volumetric Beam
  ctx.rotate(sweepAngle);
  const beamGrad = ctx.createRadialGradient(0, 0, 5, 0, -height * 0.85, height * 0.65);
  beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
  beamGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.22)');
  beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-80, -height * 0.85);
  ctx.lineTo(80, -height * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

export const drawRadarOutpost = (
  ctx: CanvasRenderingContext2D,
  radarX: number,
  radarY: number,
  t: number
) => {
  const radarAngle = t * 3;

  ctx.save();
  ctx.translate(radarX, radarY);

  // Tripod Legs
  ctx.strokeStyle = '#71717a';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-10, 28);
  ctx.lineTo(0, 0);
  ctx.lineTo(10, 28);
  ctx.moveTo(-6, 16);
  ctx.lineTo(6, 16);
  ctx.stroke();

  // Base Pads
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, -12, 24, 24, 6, 2);
  ctx.fill();
  ctx.stroke();

  // Motor Gearbox
  ctx.fillStyle = '#3f3f46';
  ctx.fillRect(-4, -2, 8, 6);

  // Data Link LED
  ctx.fillStyle = Math.sin(t * 8) > 0 ? '#38bdf8' : '#0369a1';
  ctx.beginPath();
  ctx.arc(0, 1, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Rotating Dish
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  drawSafeEllipse(ctx, 0, -4, 14 * Math.abs(Math.cos(radarAngle)), 14);
  ctx.fill();
  ctx.stroke();

  // Center Spike
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawTacticalDrone = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number
) => {
  const droneX =
    width < 1024
      ? width * 0.5 + Math.sin(t * 1.2) * 50
      : Math.max(100, Math.min(width * 0.18, 280)) + Math.sin(t * 1.2) * 20;
  const droneY =
    width < 1024
      ? Math.max(35, height * 0.08) + Math.cos(t * 1.5) * 8
      : Math.max(80, height * 0.15) + Math.cos(t * 1.5) * 10;

  ctx.save();
  ctx.translate(droneX, droneY);
  ctx.fillStyle = '#27272a';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, -14, -8, 28, 16, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  const rotorSpin = t * 25;
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 0);
  ctx.lineTo(-26, -4);
  ctx.stroke();
  drawSafeEllipse(ctx, -26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(26, -4);
  ctx.stroke();
  drawSafeEllipse(ctx, 26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(Math.sin(t * 3) * 30, 160);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
};

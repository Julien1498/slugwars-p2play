import { drawSafeEllipse, drawRoundRect } from './backdropGeometry';

export const drawSlug = (
  c: CanvasRenderingContext2D,
  scale: number,
  skinColor: string = '#ec4899',
  bellyColor: string = '#f472b6',
  eyeOffset: { x: number; y: number } = { x: 0, y: 0 },
  isBlinking: boolean = false
) => {
  c.save();
  c.scale(scale, scale);

  // Body drop shadow
  c.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawSafeEllipse(c, 0, 18, 28, 7);
  c.fill();

  // Main Fleshy Slug Body Gradient
  const bodyGrad = c.createRadialGradient(-4, -4, 4, 0, 6, 28);
  bodyGrad.addColorStop(0, '#fbcfe8');
  bodyGrad.addColorStop(0.45, skinColor);
  bodyGrad.addColorStop(1, '#831843');

  c.fillStyle = bodyGrad;
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-24, 16);
  c.quadraticCurveTo(-28, 4, -14, -10);
  c.quadraticCurveTo(-2, -24, 16, -14);
  c.quadraticCurveTo(28, 2, 24, 16);
  c.quadraticCurveTo(0, 22, -24, 16);
  c.closePath();
  c.fill();
  c.stroke();

  // Belly soft highlight
  c.fillStyle = bellyColor;
  drawSafeEllipse(c, 0, 10, 15, 6, -0.1);
  c.fill();

  // Body Segment creases
  c.strokeStyle = 'rgba(131, 24, 67, 0.6)';
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(-6, 8, 8, -Math.PI * 0.4, Math.PI * 0.2);
  c.moveTo(6, 6);
  c.arc(6, 6, 8, -Math.PI * 0.3, Math.PI * 0.2);
  c.stroke();

  // Eyestalks
  c.strokeStyle = skinColor;
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(2, -10);
  c.lineTo(4, -18);
  c.moveTo(12, -8);
  c.lineTo(15, -16);
  c.stroke();

  // Big Expressive Cartoon Eyes
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.2;

  // Left Eye
  c.beginPath();
  c.arc(4, -18, 8.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  // Right Eye
  c.beginPath();
  c.arc(16, -16, 7.5, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  if (!isBlinking) {
    // Pupils
    c.fillStyle = '#09090b';
    c.beginPath();
    c.arc(5 + eyeOffset.x, -18 + eyeOffset.y, 3.4, 0, Math.PI * 2);
    c.arc(16 + eyeOffset.x, -16 + eyeOffset.y, 3, 0, Math.PI * 2);
    c.fill();

    // Eye Light Glints
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(4 + eyeOffset.x, -20 + eyeOffset.y, 1.4, 0, Math.PI * 2);
    c.arc(15 + eyeOffset.x, -18 + eyeOffset.y, 1.2, 0, Math.PI * 2);
    c.fill();
  } else {
    // Blinking slits
    c.strokeStyle = '#18181b';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-2, -18);
    c.lineTo(10, -18);
    c.moveTo(11, -16);
    c.lineTo(21, -16);
    c.stroke();
  }

  // Smirk / Smile
  c.strokeStyle = '#831843';
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(10, -1, 6, 0.2, Math.PI * 0.7);
  c.stroke();

  c.restore();
};

export const drawFlyingSuperSheep = (
  ctx: CanvasRenderingContext2D,
  sheep: { x: number; y: number; speed: number },
  width: number,
  t: number
) => {
  sheep.x += sheep.speed;
  if (sheep.x > width + 120) sheep.x = -100;
  const sheepY = sheep.y + Math.sin(t * 3) * 10;

  ctx.save();
  ctx.translate(sheep.x, sheepY);

  // Fluttering Red Cape
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-44 + Math.sin(t * 8) * 6, -10 + Math.cos(t * 7) * 4);
  ctx.lineTo(-40 + Math.sin(t * 8) * 6, 8 + Math.sin(t * 7) * 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fluffy White Sheep Body
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-8, 0, 12, 0, Math.PI * 2);
  ctx.arc(4, -2, 11, 0, Math.PI * 2);
  ctx.arc(14, 0, 10, 0, Math.PI * 2);
  ctx.arc(4, 8, 9, 0, Math.PI * 2);
  ctx.arc(-6, 6, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Sheep Face & Eye
  ctx.fillStyle = '#1e293b';
  drawSafeEllipse(ctx, 18, 2, 7, 5, 0.2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(17, 0, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(18, 0, 1, 0, Math.PI * 2);
  ctx.fill();

  // Speed Wind Streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-48, 0);
  ctx.lineTo(-65, 0);
  ctx.moveTo(-42, -10);
  ctx.lineTo(-58, -10);
  ctx.stroke();
  ctx.restore();
};

export const drawParatrooperSlug = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number
) => {
  const paraX = Math.max(90, Math.min(width * 0.16, 260));
  const paraY = Math.max(120, height * 0.22) + Math.sin(t * 1.5) * 15;
  const paraAngle = Math.sin(t * 1.5) * 0.15;

  ctx.save();
  ctx.translate(paraX, paraY);
  ctx.rotate(paraAngle);

  // Parachute Dome
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(0, -50, 40, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(0, -50, 22, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // Suspension Ropes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-38, -50);
  ctx.lineTo(0, -8);
  ctx.moveTo(-18, -50);
  ctx.lineTo(0, -8);
  ctx.moveTo(18, -50);
  ctx.lineTo(0, -8);
  ctx.moveTo(38, -50);
  ctx.lineTo(0, -8);
  ctx.stroke();

  drawSlug(ctx, 0.85, '#ec4899', '#f472b6', { x: 1, y: 1 }, false);
  ctx.restore();
};

export const drawHoveringHelicopterSlug = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number
) => {
  const chopX = Math.max(width - 260, width * 0.84);
  const chopY = Math.max(110, height * 0.2) + Math.sin(t * 2) * 10;
  const rotorAngle = t * 14;

  ctx.save();
  ctx.translate(chopX, chopY);

  // Spinning Rotor Blades
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 3.5;
  drawSafeEllipse(ctx, 0, -26, 44 * Math.abs(Math.cos(rotorAngle)), 4);
  ctx.stroke();

  // Chopper Body
  ctx.fillStyle = '#3f3f46';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  drawRoundRect(ctx, -26, -16, 52, 28, 12);
  ctx.fill();
  ctx.stroke();

  // Glass Dome Cockpit
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(12, -2, 13, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.fill();
  ctx.stroke();

  // Tail Boom & Rotor
  ctx.strokeStyle = '#3f3f46';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, -2);
  ctx.lineTo(-52, -12);
  ctx.stroke();
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2.4;
  drawSafeEllipse(ctx, -52, -12, 4, 14 * Math.abs(Math.sin(rotorAngle * 2)));
  ctx.stroke();

  // Pilot Slug with Aviator Glasses
  ctx.save();
  ctx.translate(8, 3);
  drawSlug(ctx, 0.55, '#ec4899', '#f472b6', { x: 1, y: 0 }, false);
  ctx.fillStyle = '#09090b';
  ctx.fillRect(2, -11, 10, 5);
  ctx.restore();

  ctx.restore();
};

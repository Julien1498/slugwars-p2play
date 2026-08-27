import { ActiveProjectile } from '../../core/types';

export function renderAirStrikeBomb(ctx: CanvasRenderingContext2D) {
  // Heavy Olive Drab Aerodynamic Bomb Body
  const bombGrad = ctx.createLinearGradient(0, -6, 0, 6);
  bombGrad.addColorStop(0, '#365314');
  bombGrad.addColorStop(0.5, '#4d7c0f');
  bombGrad.addColorStop(1, '#1a2e05');
  ctx.fillStyle = bombGrad;
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.3;

  ctx.beginPath();
  ctx.moveTo(-9, -4.5);
  ctx.quadraticCurveTo(2, -5.5, 9, 0);
  ctx.quadraticCurveTo(2, 5.5, -9, 4.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Yellow Hazard Stripe around middle
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, -4.8, 3.5, 9.6);

  // Steel Nose Tip Fuse
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(8, 0, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // 4-Fin Tail Stabilizer
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.1;
  ctx.fillRect(-12, -6.5, 3.5, 13);
  ctx.strokeRect(-12, -6.5, 3.5, 13);
}

export function renderHomingPigeon(ctx: CanvasRenderingContext2D, animTime: number) {
  const flap = Math.sin(animTime * 22) * 5;

  // 1. Pigeon Body (Soft Grey / Blue Plumage)
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 7.5, 5, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // White Pigeon Breast
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.ellipse(2, 1.5, 4.5, 3.2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 2. Animated Wings (Top & Bottom flapping)
  ctx.fillStyle = '#64748b';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.quadraticCurveTo(0, -9 + flap, 6, -6 + flap);
  ctx.lineTo(2, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Pigeon Head & Orange Beak
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(6.5, -2.5, 3.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Orange Beak
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(9, -3.5);
  ctx.lineTo(13.5, -2);
  ctx.lineTo(9, -1);
  ctx.closePath();
  ctx.fill();

  // 4. Pilot Aviator Goggles
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#0369a1';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(6.8, -3.2, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(6.3, -3.6, 0.6, 0, Math.PI * 2);
  ctx.fill();

  // 5. Mini TNT Dynamite Bundle strapped to belly
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(-4, 3, 7, 3);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-2, 3, 2, 3);
}

export function renderSuperSheep(ctx: CanvasRenderingContext2D, animTime: number) {
  // 1. Wind Streaks
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-18, 0);
  ctx.lineTo(-32, 0);
  ctx.moveTo(-14, -6);
  ctx.lineTo(-26, -6);
  ctx.moveTo(-14, 6);
  ctx.lineTo(-26, 6);
  ctx.stroke();

  // 2. Fluttering Red Cape
  const capeWave = Math.sin(animTime * 12) * 4;
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(-24 + capeWave, -8);
  ctx.lineTo(-20 + capeWave, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Fluffy Cloud Wool Body
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(-5, 0, 7, 0, Math.PI * 2);
  ctx.arc(2, -2, 6.5, 0, Math.PI * 2);
  ctx.arc(8, 0, 6, 0, Math.PI * 2);
  ctx.arc(2, 5, 5.5, 0, Math.PI * 2);
  ctx.arc(-4, 4, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Face
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.ellipse(10, 1, 4.5, 3.5, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // 5. Eye
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(9.5, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(10, 0, 0.7, 0, Math.PI * 2);
  ctx.fill();
}

export function renderConcreteDonkey(ctx: CanvasRenderingContext2D, angle: number) {
  ctx.save();
  ctx.rotate(-angle);

  // Pedestal
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fillRect(-18, 10, 36, 8);
  ctx.strokeRect(-18, 10, 36, 8);

  // Donkey Body
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-14, -10, 28, 20);
  ctx.strokeRect(-14, -10, 28, 20);

  // Head & Long Ears
  ctx.fillRect(-18, -18, 12, 12);
  ctx.fillRect(-16, -24, 4, 8);
  ctx.fillRect(-10, -24, 4, 8);

  ctx.restore();
}

export function renderStandardOrb(ctx: CanvasRenderingContext2D, proj: ActiveProjectile) {
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(3, proj.radius), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

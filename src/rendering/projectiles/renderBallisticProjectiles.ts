import { ActiveProjectile } from '../../core/types';

export function renderBazookaOrMissile(ctx: CanvasRenderingContext2D, proj: ActiveProjectile, animTime: number) {
  // HD Streamlined Bazooka / Missile Warhead
  ctx.fillStyle = '#3f3f46';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-8, -3.5, 12, 7);
  ctx.strokeRect(-8, -3.5, 12, 7);

  // Red Nose Cone
  ctx.fillStyle = proj.weaponId === 'homing_missile' ? '#38bdf8' : '#ef4444';
  ctx.beginPath();
  ctx.moveTo(4, -3.5);
  ctx.lineTo(11, 0);
  ctx.lineTo(4, 3.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Laser Sensor Ring for Homing Missile
  if (proj.weaponId === 'homing_missile') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(4, 0, 4.5 + Math.sin(animTime * 15) * 1.2, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Yellow Stabilizing Fins
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-9, -5.5, 3.5, 11);

  // Glowing Thruster Exhaust Flame
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(-8, -2.5);
  ctx.lineTo(-16 + Math.sin(animTime * 16) * 3.5, 0);
  ctx.lineTo(-8, 2.5);
  ctx.closePath();
  ctx.fill();
}

export function renderGrenade(ctx: CanvasRenderingContext2D) {
  // Metallic Green Oval Body with Radial Shading
  const grenGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 7);
  grenGrad.addColorStop(0, '#65a30d');
  grenGrad.addColorStop(0.6, '#3f6212');
  grenGrad.addColorStop(1, '#1a2e05');
  ctx.fillStyle = grenGrad;
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Fragmentation Grid Lines (Pineapple segments)
  ctx.strokeStyle = '#1e3a1e';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-5, -2);
  ctx.lineTo(5, -2);
  ctx.moveTo(-5, 2);
  ctx.lineTo(5, 2);
  ctx.moveTo(-2, -4);
  ctx.lineTo(-2, 4);
  ctx.moveTo(2, -4);
  ctx.lineTo(2, 4);
  ctx.stroke();

  // Metallic Top Fuse Head & Silver Safety Spoon
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.0;
  ctx.fillRect(-2, -7, 4, 3);
  ctx.strokeRect(-2, -7, 4, 3);

  // Curved Silver Lever along top
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-2, -6.5);
  ctx.quadraticCurveTo(-6, -6.5, -6.5, 1);
  ctx.stroke();

  // Golden Pull Ring Pin
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(3.5, -6.5, 2, 0, Math.PI * 2);
  ctx.stroke();
}

export function renderHolyGrenade(ctx: CanvasRenderingContext2D) {
  const orbGrad = ctx.createRadialGradient(-2, -2, 1, 0, 0, 6);
  orbGrad.addColorStop(0, '#fef08a');
  orbGrad.addColorStop(0.5, '#eab308');
  orbGrad.addColorStop(1, '#a16207');
  ctx.fillStyle = orbGrad;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pearl Girdle
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.stroke();

  // Golden Cross on Top
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-1.5, -9, 3, 5);
  ctx.fillRect(-3.5, -7.5, 7, 2.5);
}

export function renderBananaBomb(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 4, 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#713f12';
  ctx.fillRect(6, -2, 3, 2);
}

export function renderClusterBanana(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 5, 2.6, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Green Tip & Brown Stalk
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(-4.5, -1, 1.8, 1.8);
  ctx.fillStyle = '#713f12';
  ctx.fillRect(3.5, -1.2, 1.6, 1.6);
}

export function renderDynamite(ctx: CanvasRenderingContext2D, animTime: number) {
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.fillRect(-8, -4, 16, 8);
  ctx.strokeRect(-8, -4, 16, 8);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-8, -1.5, 16, 3);
  // Spark
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(10, -4, 3 + Math.sin(animTime * 18) * 1.5, 0, Math.PI * 2);
  ctx.fill();
}

export function renderBuckshotPellet(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.arc(-2, 0, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

import { ActiveProjectile } from '../../core/types';

export function renderWalkingSheep(ctx: CanvasRenderingContext2D, proj: ActiveProjectile, animTime: number) {
  const isLeft = proj.behaviorData?.facing === 'left';
  const walkBob = Math.sin(animTime * 14) * 1.5;

  ctx.save();
  if (isLeft) ctx.scale(-1, 1);

  // 1. Legs (Trotting animation)
  ctx.fillStyle = '#0f172a';
  const legOffset1 = Math.sin(animTime * 14) * 3;
  const legOffset2 = -legOffset1;
  ctx.fillRect(-5 + legOffset1, 2, 2.5, 5);
  ctx.fillRect(3 + legOffset2, 2, 2.5, 5);

  // 2. Fluffy Wool Cloud Body
  const woolGrad = ctx.createRadialGradient(-2, -2 + walkBob, 2, 0, walkBob, 8);
  woolGrad.addColorStop(0, '#ffffff');
  woolGrad.addColorStop(0.7, '#f1f5f9');
  woolGrad.addColorStop(1, '#cbd5e1');
  ctx.fillStyle = woolGrad;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.0;

  ctx.beginPath();
  ctx.arc(-3, -1 + walkBob, 5.5, 0, Math.PI * 2);
  ctx.arc(2, -2 + walkBob, 6, 0, Math.PI * 2);
  ctx.arc(4, 1 + walkBob, 4.5, 0, Math.PI * 2);
  ctx.arc(-2, 2 + walkBob, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Pink Muzzle / Head
  ctx.fillStyle = '#fbcfe8';
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.ellipse(6, -2 + walkBob, 4, 3, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 4. Black Eye & Ear
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(6.5, -3 + walkBob, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f472b6';
  ctx.beginPath();
  ctx.ellipse(4, -5 + walkBob, 1.8, 3.2, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderOldLady(ctx: CanvasRenderingContext2D, proj: ActiveProjectile, animTime: number) {
  const isLeft = proj.behaviorData?.facing === 'left';
  const walkBob = Math.sin(animTime * 8) * 1.0;

  ctx.save();
  if (isLeft) ctx.scale(-1, 1);

  // 1. Skirt & Body
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(-3, 0 + walkBob, 6, 6);

  // 2. Floral Pink Shawl
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(0, -1 + walkBob, 5.5, Math.PI, 0);
  ctx.fill();

  // 3. Face
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(2, -4 + walkBob, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Grey Hair Bun
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0, -6 + walkBob, 3, 0, Math.PI * 2);
  ctx.fill();

  // 5. Brown Handbag
  const bagSwing = Math.sin(animTime * 8) * 2.5;
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-5 + bagSwing, 1 + walkBob, 3.5, 4);
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-5 + bagSwing, 1 + walkBob, 3.5, 4);

  ctx.restore();
}

export function renderMeteor(ctx: CanvasRenderingContext2D, _proj: ActiveProjectile, animTime: number) {
  // 1. Intense Fire Trail
  const flameLen = 16 + Math.sin(animTime * 20) * 4;
  const flameGrad = ctx.createLinearGradient(-flameLen, 0, 4, 0);
  flameGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  flameGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.6)');
  flameGrad.addColorStop(0.8, '#eab308');
  flameGrad.addColorStop(1, '#ffffff');

  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(-flameLen, -3);
  ctx.lineTo(4, -6);
  ctx.lineTo(8, 0);
  ctx.lineTo(4, 6);
  ctx.lineTo(-flameLen, 3);
  ctx.closePath();
  ctx.fill();

  // 2. Burning Molten Core (Obsidian rock)
  ctx.fillStyle = '#1c1917';
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(2, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. Incandescent Glow Core
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(2, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

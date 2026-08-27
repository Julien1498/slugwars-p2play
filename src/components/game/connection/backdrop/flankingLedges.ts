import { drawSafeEllipse, drawRoundRect, drawRockyLedge } from './backdropGeometry';
import { drawSlug } from './slugAvatars';
import { SmokeParticlePool } from './backdropParticlePool';

export const drawVeteranBazookaSlug = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number
) => {
  const leftLedgeX = Math.max(120, Math.min(width * 0.16, 280));
  const leftLedgeY = Math.max(380, height * 0.58);

  drawRockyLedge(ctx, leftLedgeX, leftLedgeY + 22, 160, 80);

  ctx.save();
  ctx.translate(leftLedgeX, leftLedgeY);

  const isLeftBlink = Math.sin(t * 1.7) > 0.95;
  drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 }, isLeftBlink);

  // Military Corporal Peaked Cap
  ctx.save();
  ctx.scale(1.35, 1.35);

  const capGrad = ctx.createLinearGradient(4, -37, 12, -25);
  capGrad.addColorStop(0, '#4d7c0f');
  capGrad.addColorStop(0.55, '#365314');
  capGrad.addColorStop(1, '#1a2e05');
  ctx.fillStyle = capGrad;
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.6;

  ctx.beginPath();
  ctx.moveTo(-3, -25.5);
  ctx.quadraticCurveTo(9, -27, 21, -23.5);
  ctx.lineTo(22, -26.5);
  ctx.quadraticCurveTo(15, -38, 7, -37);
  ctx.quadraticCurveTo(-1, -35, -3.5, -26);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Leather Base & Golden Braid & Visor
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-3, -25.5);
  ctx.quadraticCurveTo(9, -27, 21, -23.5);
  ctx.lineTo(21.2, -22.3);
  ctx.quadraticCurveTo(9, -25.8, -3.3, -24.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-1.5, -26);
  ctx.quadraticCurveTo(9, -27.2, 20.5, -24);
  ctx.stroke();

  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(8, -25.5);
  ctx.quadraticCurveTo(17, -26.5, 25, -23.5);
  ctx.quadraticCurveTo(17, -24, 8, -24.5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Golden Corporal Insignia
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(9, -32.5, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(9, -32.5, 1.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Heavy Metal Bazooka & Laser Beam
  ctx.save();
  ctx.translate(16, -10);
  const bazAngle = -0.5 + Math.sin(t * 1.5) * 0.12;
  ctx.rotate(bazAngle);
  ctx.fillStyle = '#4b5563';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  drawRoundRect(ctx, -10, -9, 54, 15, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#eab308';
  ctx.fillRect(20, -8, 5, 13);
  ctx.fillRect(30, -8, 5, 13);
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.beginPath();
  ctx.moveTo(44, -1);
  ctx.lineTo(260, -1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(260, -1, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
};

export const drawDynamiteSlug = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  t: number,
  smokePool: SmokeParticlePool
) => {
  const rightLedgeX = Math.max(width - 280, width * 0.84);
  const rightLedgeY = Math.max(380, height * 0.58);

  drawRockyLedge(ctx, rightLedgeX, rightLedgeY + 22, 160, 80);

  ctx.save();
  ctx.translate(rightLedgeX, rightLedgeY);
  ctx.scale(-1, 1);

  const isRightBlink = Math.sin(t * 2.1) > 0.95;
  drawSlug(ctx, 1.35, '#ec4899', '#f472b6', { x: 2, y: -1 }, isRightBlink);

  // Red Pirate Headband
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2.4;
  drawSafeEllipse(ctx, 10, -22, 18, 6, 0.1);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -22);
  ctx.lineTo(-28 + Math.sin(t * 6) * 5, -28 + Math.cos(t * 5) * 4);
  ctx.lineTo(-24 + Math.sin(t * 6) * 5, -18 + Math.sin(t * 5) * 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3-Stick Dynamite Pack
  ctx.save();
  ctx.translate(22, -6);
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, -5, -14, 12, 26, 3);
  ctx.fill();
  ctx.stroke();
  drawRoundRect(ctx, 5, -16, 12, 26, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-5, -4, 22, 7);

  // Burning Fuse & Spark
  ctx.strokeStyle = '#e4e4e7';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(10, -16);
  ctx.quadraticCurveTo(18, -26, 25, -24);
  ctx.stroke();

  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(25, -24, 3.5 + Math.sin(t * 18) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(25, -24, 7 + Math.sin(t * 18) * 2, 0, Math.PI * 2);
  ctx.fill();

  if (Math.random() < 0.35) {
    smokePool.spawn(
      rightLedgeX - 25,
      rightLedgeY - 30,
      -(Math.random() * 0.5 + 0.2),
      -(Math.random() * 0.9 + 0.6),
      4 + Math.random() * 3
    );
  }
  ctx.restore();

  ctx.restore();
};

import { ActiveProjectile } from '../../core/types';

export function renderBunkerBuster(ctx: CanvasRenderingContext2D, proj: ActiveProjectile, animTime: number) {
  // Heavy Drill Warhead Bunker Buster Bomb
  ctx.save();
  // Pointing straight down or along velocity
  ctx.rotate(Math.PI / 2);

  // 1. Steel Body
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.fillRect(-10, -5, 18, 10);
  ctx.strokeRect(-10, -5, 18, 10);

  // 2. Hazard Yellow / Black Stripes
  ctx.fillStyle = '#eab308';
  ctx.fillRect(-3, -5, 4, 10);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, -5, 3, 10);

  // 3. Titanium Conical Drill Nose
  ctx.fillStyle = '#94a3b8';
  ctx.strokeStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(8, -5);
  ctx.lineTo(16, 0);
  ctx.lineTo(8, 5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spiral drill grooves
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(9, -3);
  ctx.lineTo(13, 2);
  ctx.stroke();

  // 4. Stabilizing Tail Fins
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-12, -7, 4, 14);

  // Sparks if burrowing
  if (proj.behaviorData?.isBurrowing || (proj.behaviorData?.burrowRemaining ?? 100) < 100) {
    ctx.fillStyle = '#f97316';
    for (let i = 0; i < 4; i++) {
      const sx = 8 + (Math.sin(animTime * 30 + i) * 6);
      const sy = (Math.cos(animTime * 30 + i) * 8);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  ctx.restore();
}

export function renderParachuteMine(ctx: CanvasRenderingContext2D, proj: ActiveProjectile, animTime: number) {
  const isFalling = proj.vy > 0.5;

  // 1. Parachute Canopy (visible when falling from sky)
  if (isFalling) {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(0, -18, 12, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Suspension cords
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-11, -18);
    ctx.lineTo(0, -4);
    ctx.moveTo(11, -18);
    ctx.lineTo(0, -4);
    ctx.stroke();
  }

  // 2. Spiky Proximity Mine Body
  ctx.fillStyle = '#7f1d1d';
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Metal spikes
  ctx.fillStyle = '#450a0a';
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
    ctx.fillRect(Math.cos(a) * 5.5 - 1, Math.sin(a) * 5.5 - 1, 2.5, 2.5);
  }

  // 3. Flashing Red Proximity LED
  const isFlashing = Math.sin(animTime * 14) > 0;
  ctx.fillStyle = isFlashing ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

export function renderKamikaze(ctx: CanvasRenderingContext2D, _proj: ActiveProjectile, animTime: number) {
  // Rocket-propelled flying slug with headband
  // 1. Sonic shockwave / jet trail
  const trailLen = 22 + Math.sin(animTime * 25) * 5;
  const grad = ctx.createLinearGradient(-trailLen, 0, 0, 0);
  grad.addColorStop(0, 'rgba(239, 68, 68, 0)');
  grad.addColorStop(0.6, 'rgba(249, 115, 22, 0.7)');
  grad.addColorStop(1, '#fef08a');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(-trailLen, -4);
  ctx.lineTo(4, -8);
  ctx.lineTo(10, 0);
  ctx.lineTo(4, 8);
  ctx.lineTo(-trailLen, 4);
  ctx.closePath();
  ctx.fill();

  // 2. Streamlined Slug Body
  ctx.fillStyle = '#84cc16';
  ctx.strokeStyle = '#3f6212';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(2, 0, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 3. White Headband with Red Sun Dot
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(4, -5.5, 3.5, 11);
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(5.8, 0, 1.4, 0, Math.PI * 2);
  ctx.fill();
}

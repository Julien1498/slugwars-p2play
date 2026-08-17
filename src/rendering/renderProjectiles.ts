import { ActiveProjectile } from '../core/types';

export interface ProjectilesRenderContext {
  ctx: CanvasRenderingContext2D;
  projectiles: ActiveProjectile[];
  animTime: number;
}

export function renderProjectiles(rc: ProjectilesRenderContext) {
  const { ctx, projectiles, animTime } = rc;

  for (const proj of projectiles) {
    ctx.save();
    ctx.translate(proj.x, proj.y);

    const angle = Math.atan2(proj.vy, proj.vx);
    if (Number.isFinite(angle)) {
      ctx.rotate(angle);
    }

    if (proj.weaponId === 'bazooka' || proj.weaponId === 'homing_missile') {
      // --- HD STREAMLINED BAZOOKA / MISSILE WARHEAD ---
      ctx.fillStyle = '#3f3f46';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.2;
      ctx.fillRect(-8, -3.5, 12, 7);
      ctx.strokeRect(-8, -3.5, 12, 7);

      // Red Nose Cone
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(4, -3.5);
      ctx.lineTo(11, 0);
      ctx.lineTo(4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Yellow Stabilizing Fins
      ctx.fillStyle = '#eab308';
      ctx.fillRect(-9, -5.5, 3.5, 11);

      // Glowing Thruster Exhaust Flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-8, -2.5);
      ctx.lineTo(-15 + Math.sin(animTime * 14) * 3, 0);
      ctx.lineTo(-8, 2.5);
      ctx.closePath();
      ctx.fill();
    } else if (proj.weaponId === 'super_sheep') {
      // --- HD STYLIZED SUPER SHEEP ---
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
    } else if (proj.weaponId === 'holy_grenade') {
      // --- HD GOLDEN HOLY HAND GRENADE ---
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
    } else if (proj.weaponId === 'banana_bomb') {
      // --- HD CLUSTER BANANA BOMB ---
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#713f12';
      ctx.fillRect(6, -2, 3, 2);
    } else if (proj.weaponId === 'dynamite') {
      // --- HD DYNAMITE STICK WITH SPARKLING FUSE ---
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
    } else if (proj.weaponId === 'concrete_donkey') {
      // --- HD CHISELLED CONCRETE DONKEY STATUE ---
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
    } else {
      // Standard Projectile Orb
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bouncing Timer Countdown Badge
    if (proj.fuseTimerMs !== undefined && proj.fuseTimerMs > 0) {
      const sec = (proj.fuseTimerMs / 1000).toFixed(1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'extrabold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.strokeText(`⚠️ ${sec}s`, 0, -12);
      ctx.fillText(`⚠️ ${sec}s`, 0, -12);
    }

    ctx.restore();
  }
}

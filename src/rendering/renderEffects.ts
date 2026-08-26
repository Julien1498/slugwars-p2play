import { GameState, Landmine, SupplyCrate, HelicopterVehicle, Slug } from '../core/types';

export interface ClientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

export interface ClientExplosion {
  id: string;
  x: number;
  y: number;
  radius: number;
  startTime: number;
  duration: number;
}

export interface ClientFloatingDamage {
  id: string;
  x: number;
  y: number;
  damage: number;
  startTime: number;
  duration: number;
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: ClientParticle[]) {
  if (particles.length === 0) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.035;

    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      ctx.globalAlpha = Math.max(0, p.life * 0.85);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;
}

export function renderClientExplosions(ctx: CanvasRenderingContext2D, explosions: ClientExplosion[]) {
  const now = performance.now();
  for (let i = explosions.length - 1; i >= 0; i--) {
    const ex = explosions[i];
    const elapsed = now - ex.startTime;
    const progress = Math.min(1, elapsed / ex.duration);
    const alpha = Math.max(0, 1 - progress);
    const safeRadius = ex.radius;

    // Shockwave
    const shockRadius = safeRadius * (0.3 + progress * 0.9);
    if (shockRadius > 0) {
      ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
      ctx.lineWidth = Math.max(1, 3.5 * (1 - progress));
      ctx.beginPath();
      ctx.arc(ex.x, ex.y, shockRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fireball
    const fireballRadius = safeRadius * (0.35 + progress * 0.65);
    const exGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, fireballRadius);
    exGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    exGrad.addColorStop(0.25, `rgba(250, 204, 21, ${alpha * 0.9})`);
    exGrad.addColorStop(0.65, `rgba(239, 68, 68, ${alpha * 0.7})`);
    exGrad.addColorStop(1, 'rgba(127, 29, 29, 0)');

    ctx.fillStyle = exGrad;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, fireballRadius, 0, Math.PI * 2);
    ctx.fill();

    if (progress >= 1) {
      explosions.splice(i, 1);
    }
  }
}

export function renderNinjaRopes(ctx: CanvasRenderingContext2D, slugs: Slug[]) {
  for (const s of slugs) {
    if (s.isAlive && s.ropeState) {
      const rope = s.ropeState;
      ctx.save();
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rope.hookX, rope.hookY);
      ctx.lineTo(s.x, s.y - 8);
      ctx.stroke();

      ctx.strokeStyle = '#71717a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rope.hookX, rope.hookY);
      ctx.lineTo(s.x, s.y - 8);
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(rope.hookX, rope.hookY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }
}

export function renderSupplyCrates(ctx: CanvasRenderingContext2D, crates: SupplyCrate[] | undefined, animTime: number = 0) {
  if (!crates || crates.length === 0) return;
  for (const crate of crates) {
    ctx.save();
    ctx.translate(crate.x, crate.y);

    if (!crate.isLanded) {
      // Gentle parachute sway in the wind
      const swayAngle = Math.sin(animTime * 3.5 + (crate.id.charCodeAt(0) % 7)) * 0.12;
      ctx.rotate(swayAngle);

      // Parachute Canopy
      const canopyGrad = ctx.createLinearGradient(0, -40, 0, -22);
      canopyGrad.addColorStop(0, '#f87171');
      canopyGrad.addColorStop(0.5, '#dc2626');
      canopyGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = canopyGrad;
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.arc(0, -24, 18, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // White Center Stripe
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, -24, 8, Math.PI, 0);
      ctx.fill();

      // Parachute Suspension Cords
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.75)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-16, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(16, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(-6, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(6, -24);
      ctx.lineTo(0, -9);
      ctx.stroke();
    } else {
      // Ground Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 9, 11, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden Supply Crate Body with Beveled Slats
    const crateGrad = ctx.createLinearGradient(-9, -9, 9, 9);
    crateGrad.addColorStop(0, '#eab308');
    crateGrad.addColorStop(0.5, '#ca8a04');
    crateGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = crateGrad;
    ctx.strokeStyle = '#713f12';
    ctx.lineWidth = 1.4;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeRect(-9, -9, 18, 18);

    // Metal Corner Brackets
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-9, -9, 4, 4);
    ctx.fillRect(5, -9, 4, 4);
    ctx.fillRect(-9, 5, 4, 4);
    ctx.fillRect(5, 5, 4, 4);

    // Red Cross Medical / Supply Emblem
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 0.8;
    ctx.fillRect(-2, -6, 4, 12);
    ctx.strokeRect(-2, -6, 4, 12);
    ctx.fillRect(-6, -2, 12, 4);
    ctx.strokeRect(-6, -2, 12, 4);

    // Glowing Badge Label
    if (crate.crateType === 'health') {
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'extrabold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.strokeText(`+${crate.healAmount || 50} HP`, 0, 16);
      ctx.fillText(`+${crate.healAmount || 50} HP`, 0, 16);
    }

    ctx.restore();
  }
}

export function renderFloatingDamages(ctx: CanvasRenderingContext2D, floatingDamages: ClientFloatingDamage[]) {
  if (floatingDamages.length === 0) return;
  const now = performance.now();
  let writeIdx = 0;
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.font = 'extrabold 14px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000000';

  for (let i = 0; i < floatingDamages.length; i++) {
    const fd = floatingDamages[i];
    const elapsed = now - fd.startTime;
    const progress = Math.min(1, elapsed / fd.duration);

    if (progress < 1) {
      const alpha = Math.max(0, 1 - progress);
      const floatY = fd.y - progress * 30;

      ctx.globalAlpha = alpha;
      const isHeal = fd.damage < 0;
      ctx.fillStyle = isHeal ? '#22c55e' : '#facc15';
      const text = isHeal ? `+${-fd.damage} HP` : `-${fd.damage}`;
      ctx.strokeText(text, fd.x, floatY);
      ctx.fillText(text, fd.x, floatY);

      floatingDamages[writeIdx++] = fd;
    }
  }
  ctx.restore();
  floatingDamages.length = writeIdx;
}

export function renderMines(
  ctx: CanvasRenderingContext2D,
  mines: Landmine[] | undefined,
  viewLeft?: number,
  viewRight?: number
) {
  if (!mines) return;
  for (const mine of mines) {
    if (viewLeft !== undefined && viewRight !== undefined && (mine.x < viewLeft - 40 || mine.x > viewRight + 40)) continue;
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.ellipse(mine.x, mine.y, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.stroke();

    const blink = mine.isTriggered
      ? Math.floor(Date.now() / 100) % 2 === 0
      : Math.floor(Date.now() / 600) % 2 === 0;

    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(mine.x, mine.y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (mine.isTriggered && mine.fuseTimerMs !== undefined) {
      const sec = (mine.fuseTimerMs / 1000).toFixed(1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'extrabold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ ${sec}s`, mine.x, mine.y - 12);
    }
  }
}

export function renderHelicopters(
  ctx: CanvasRenderingContext2D,
  helicopters: HelicopterVehicle[] | undefined,
  gameState: GameState,
  animTime: number,
  isMyTurn: boolean,
  viewLeft?: number,
  viewRight?: number
) {
  if (!helicopters) return;
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

  for (const heli of helicopters) {
    if (viewLeft !== undefined && viewRight !== undefined && (heli.x < viewLeft - 100 || heli.x > viewRight + 100)) continue;
    ctx.save();
    ctx.translate(heli.x, heli.y);
    if (heli.facing === 'left') ctx.scale(-1, 1);

    // Dynamic flight tilt
    const tilt = Math.max(-0.25, Math.min(0.25, heli.vx * (heli.facing === 'left' ? -0.06 : 0.06)));
    ctx.rotate(tilt);

    // Skids
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, 14);
    ctx.lineTo(18, 14);
    ctx.moveTo(-10, 8);
    ctx.lineTo(-12, 14);
    ctx.moveTo(10, 8);
    ctx.lineTo(12, 14);
    ctx.stroke();

    // Fuselage
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glass
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(8, -2, 11, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pilot
    if (heli.pilotSlugId) {
      const pilot = gameState.slugs.find((s) => s.id === heli.pilotSlugId);
      const team = pilot ? gameState.teams.find((t) => t.id === pilot.teamId) : null;
      const teamColor = team ? team.color : '#a855f7';

      ctx.save();
      ctx.translate(7, -3);
      ctx.fillStyle = teamColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -1, 5, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-2, -1, 5, 2.5);
      ctx.restore();
    }

    // Tail
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, -3, 20, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-37, -9, 4, 12);

    const isPiloted = Boolean(heli.pilotSlugId);
    const isAirborne = isPiloted || (Math.abs(heli.vx) > 0.1 || Math.abs(heli.vy) > 0.1);

    // Tail Rotor
    const tailRotorSpeed = isPiloted ? 45 : isAirborne ? 20 : 6;
    const tSpin = Math.sin(animTime * tailRotorSpeed);
    ctx.strokeStyle = isPiloted ? '#cbd5e1' : '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-35, -3 - tSpin * 8);
    ctx.lineTo(-35, -3 + tSpin * 8);
    ctx.stroke();

    // Main Rotor
    ctx.fillStyle = '#475569';
    ctx.fillRect(-2, -16, 4, 6);

    // High-speed rotor blur disc when flying
    if (isPiloted) {
      ctx.save();
      ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -16, 45, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const mainRotorSpeed = isPiloted ? 35 : isAirborne ? 16 : 4;
    const currentRotorAngle = animTime * mainRotorSpeed;
    const bladeWidth = Math.cos(currentRotorAngle) * 45;
    ctx.strokeStyle = isPiloted ? '#e2e8f0' : '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-bladeWidth, -16);
    ctx.lineTo(bladeWidth, -16);
    ctx.stroke();

    // Rotor Hub
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Blinking LED Nav Lights
    // Red LED on Tail
    const redBlink = Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = redBlink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(-35, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Green LED on Main Rotor Tip
    const greenBlink = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.fillStyle = greenBlink ? '#22c55e' : '#14532d';
    ctx.beginPath();
    ctx.arc(bladeWidth, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Searchlight Spotlight Cone (Golden Beam from Nose)
    ctx.save();
    const lightOriginX = 14;
    const lightOriginY = 4;

    const lightGrad = ctx.createLinearGradient(lightOriginX, lightOriginY, lightOriginX + 60, lightOriginY + 120);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    lightGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
    lightGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(lightOriginX, lightOriginY);
    ctx.lineTo(lightOriginX - 35, lightOriginY + 130);
    ctx.lineTo(lightOriginX + 75, lightOriginY + 130);
    ctx.closePath();
    ctx.fill();

    // Floating Light Dust Motes in Cone
    ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
    for (let m = 0; m < 5; m++) {
      const mx = lightOriginX + Math.sin(Date.now() * 0.002 + m) * 20;
      const my = lightOriginY + 20 + ((Date.now() * 0.03 + m * 25) % 100);
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Side Rocket Pod
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, 4, 14, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, 5, 2, 3);

    ctx.restore();

    // HP Bar
    const hpPct = Math.max(0, heli.hp / heli.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(heli.x - 20, heli.y - 28, 40, 5);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
    ctx.fillRect(heli.x - 20, heli.y - 28, 40 * hpPct, 5);

    if (isMyTurn && activeSlug && !activeSlug.inVehicleId) {
      const dist = Math.hypot(activeSlug.x - heli.x, activeSlug.y - heli.y);
      if (dist < 65) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚁 [ENTRER / E] pour Piloter', heli.x, heli.y - 36);
      }
    }
  }
}

export function renderTombstones(
  ctx: CanvasRenderingContext2D,
  slugs: Slug[],
  waterLevel: number,
  viewLeft?: number,
  viewRight?: number
) {
  for (const slug of slugs) {
    if (slug.isAlive || !slug.isPlaced) continue;
    if (viewLeft !== undefined && viewRight !== undefined && (slug.x < viewLeft - 40 || slug.x > viewRight + 40)) continue;
    if (slug.y < waterLevel + 10) {
      ctx.save();
      ctx.translate(slug.x, slug.y);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 9, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      const stoneGrad = ctx.createLinearGradient(0, -18, 0, 2);
      stoneGrad.addColorStop(0, '#94a3b8');
      stoneGrad.addColorStop(1, '#475569');
      ctx.fillStyle = stoneGrad;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.moveTo(-7, 2);
      ctx.lineTo(-7, -10);
      ctx.quadraticCurveTo(-7, -18, 0, -18);
      ctx.quadraticCurveTo(7, -18, 7, -10);
      ctx.lineTo(7, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-1, -14, 2, 8);
      ctx.fillRect(-3.5, -12, 7, 2);
      ctx.restore();
    }
  }
}

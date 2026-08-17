import { Slug, Team, GameState } from '../core/types';

export interface SlugsRenderContext {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  animTime: number;
  slugDeathTimestamps: Map<string, number>;
}

export function renderGhostSpirits(
  ctx: CanvasRenderingContext2D,
  slugs: Slug[],
  animTime: number,
  slugDeathTimestamps: Map<string, number>
) {
  const now = performance.now();
  for (const slug of slugs) {
    if (!slug.isAlive) {
      const deathTime = slugDeathTimestamps.get(slug.id);
      if (deathTime) {
        const elapsed = (now - deathTime) / 1000;
        if (elapsed < 3.5) {
          const ghostY = slug.y - elapsed * 28;
          const ghostX = slug.x + Math.sin(elapsed * 4) * 6;
          const alpha = Math.max(0, 1 - elapsed / 3.5);

          ctx.save();
          ctx.translate(ghostX, ghostY);
          ctx.globalAlpha = alpha;

          // Golden Angelic Halo
          const haloY = -18 + Math.sin(animTime * 6) * 1.5;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.ellipse(0, haloY, 5, 2, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Ghost Body
          const ghostGrad = ctx.createRadialGradient(-2, -6, 2, 0, 0, 12);
          ghostGrad.addColorStop(0, '#ffffff');
          ghostGrad.addColorStop(0.7, '#e0f2fe');
          ghostGrad.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
          ctx.fillStyle = ghostGrad;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.2;

          const tailWave = Math.sin(animTime * 5 + slug.id.charCodeAt(0)) * 2;
          ctx.beginPath();
          ctx.moveTo(-6, 2);
          ctx.quadraticCurveTo(-7, -8, 0, -12);
          ctx.quadraticCurveTo(7, -8, 6, 2);
          ctx.quadraticCurveTo(4, 5 + tailWave, 2, 2);
          ctx.quadraticCurveTo(0, -1 - tailWave, -2, 2);
          ctx.quadraticCurveTo(-4, 5 + tailWave, -6, 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Cute Eyes & Blush
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(-2, -6, 1.3, 0, Math.PI * 2);
          ctx.arc(2, -6, 1.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
          ctx.beginPath();
          ctx.arc(-3.5, -4, 1.2, 0, Math.PI * 2);
          ctx.arc(3.5, -4, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }
    }
  }
}

export function renderAllSlugs(rc: SlugsRenderContext) {
  const { ctx, gameState, animTime, slugDeathTimestamps } = rc;

  renderGhostSpirits(ctx, gameState.slugs, animTime, slugDeathTimestamps);

  for (const slug of gameState.slugs) {
    if (!slug.isAlive || !slug.isPlaced) continue;
    const team = gameState.teams.find((t) => t.id === slug.teamId);
    const teamColor = team?.color || '#ec4899';
    const teamIndex = gameState.teams.findIndex((t) => t.id === slug.teamId);
    const isActive = slug.id === gameState.activeSlugId;
    const isAiming = isActive && gameState.phase === 'AIMING';
    const aimRad = (slug.aimAngle * Math.PI) / 180;

    const speed = Math.hypot(slug.vx, slug.vy);
    const isAirbornePanic = speed > 2.0;

    let isDangerNear = slug.hp < 35;
    if (!isDangerNear && gameState.projectiles && gameState.projectiles.length > 0) {
      for (const p of gameState.projectiles) {
        if (Math.hypot(slug.x - p.x, slug.y - p.y) < 70) {
          isDangerNear = true;
          break;
        }
      }
    }
    if (!isDangerNear && gameState.mines && gameState.mines.length > 0) {
      for (const m of gameState.mines) {
        if (m.isTriggered && Math.hypot(slug.x - m.x, slug.y - m.y) < 55) {
          isDangerNear = true;
          break;
        }
      }
    }

    // Active Arrow Indicator
    if (isActive) {
      const arrowBounce = Math.sin(animTime * 1.5) * 3;
      const arrowY = slug.y - 46 + arrowBounce;
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(slug.x, arrowY + 8);
      ctx.lineTo(slug.x - 6, arrowY);
      ctx.lineTo(slug.x - 2, arrowY);
      ctx.lineTo(slug.x - 2, arrowY - 8);
      ctx.lineTo(slug.x + 2, arrowY - 8);
      ctx.lineTo(slug.x + 2, arrowY);
      ctx.lineTo(slug.x + 6, arrowY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Airborne Speed Trails
    if (isAirbornePanic) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.moveTo(slug.x - slug.vx * 1.8 + s * 4, slug.y - slug.vy * 1.8 + s * 3);
        ctx.lineTo(slug.x - slug.vx * 3.6 + s * 4, slug.y - slug.vy * 3.6 + s * 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    const isMoving = Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1;
    const squishX = isAirbornePanic ? Math.min(0.35, speed * 0.035) : (isMoving ? Math.sin(animTime * 14) * 0.12 : 0);
    const squishY = isAirbornePanic ? -Math.min(0.2, speed * 0.02) : (isMoving ? -Math.sin(animTime * 14) * 0.12 : 0);
    const slugScale = 0.72;

    ctx.save();
    ctx.translate(slug.x, slug.y - 2);

    if (isAirbornePanic) {
      const tilt = Math.atan2(slug.vy, slug.vx * (slug.facing === 'left' ? -1 : 1)) * 0.25;
      ctx.rotate(tilt);
    }

    if (slug.facing === 'left') {
      ctx.scale(-1 * (1 + squishX) * slugScale, (1 + squishY) * slugScale);
    } else {
      ctx.scale((1 + squishX) * slugScale, (1 + squishY) * slugScale);
    }

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    const bodyGrad = ctx.createRadialGradient(-3, -3, 2, 0, 2, 14);
    bodyGrad.addColorStop(0, '#fef08a');
    bodyGrad.addColorStop(0.35, teamColor);
    bodyGrad.addColorStop(1, '#180828');

    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = isActive ? '#facc15' : '#18181b';
    ctx.lineWidth = isActive ? 2.2 : 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.quadraticCurveTo(-13, -1, -6, -7);
    ctx.quadraticCurveTo(0, -13, 8, -7);
    ctx.quadraticCurveTo(14, 0, 11, 6);
    ctx.quadraticCurveTo(0, 8, -11, 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Belly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 7.5, 3, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Eyestalks
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(1, -6);
    ctx.lineTo(2, -10);
    ctx.moveTo(6, -5);
    ctx.lineTo(8, -9);
    ctx.stroke();

    // Eyes
    const isBlinking = !isAirbornePanic && !isDangerNear && Math.sin(animTime * 1.5 + (slug.id.charCodeAt(0) % 10)) > 0.94;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;

    if (isAirbornePanic) {
      ctx.beginPath();
      ctx.arc(2, -10, 5.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(8, -9, 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      const jitterX = Math.sin(animTime * 20) * 0.6;
      const jitterY = Math.cos(animTime * 20) * 0.6;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(2.5 + jitterX, -10 + jitterY, 1.2, 0, Math.PI * 2);
      ctx.arc(8.5 + jitterX, -9 + jitterY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(2, -10, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(8, -9, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (!isBlinking) {
        const pupilOffX = isAiming ? Math.cos(aimRad) * 1.4 : Math.sin(animTime * 1.2) * 0.8;
        const pupilOffY = isAiming ? -Math.sin(aimRad) * 1.4 : 0;

        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(2.5 + pupilOffX, -10 + pupilOffY, 1.8, 0, Math.PI * 2);
        ctx.arc(8.5 + pupilOffX, -9 + pupilOffY, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(2 + pupilOffX, -11 + pupilOffY, 0.8, 0, Math.PI * 2);
        ctx.arc(8 + pupilOffX, -10 + pupilOffY, 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-1, -10);
        ctx.lineTo(5, -10);
        ctx.moveTo(6, -9);
        ctx.lineTo(11, -9);
        ctx.stroke();
      }
    }

    // Team Hat
    if (teamIndex % 4 === 0) {
      ctx.fillStyle = '#3f6212';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(5, -13, 9, 5, 0.1, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(5, -15, 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (teamIndex % 4 === 1) {
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(5, -12, 8.5, 3.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, -12);
      ctx.lineTo(-11 + Math.sin(animTime * 6) * 2, -15);
      ctx.lineTo(-9 + Math.sin(animTime * 6) * 2, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (teamIndex % 4 === 2) {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.roundRect(-1.5, -13.5, 7, 7, 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(5, -12.5, 6.5, 7, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(2, -10, 2.2, 0, Math.PI * 2);
      ctx.arc(8, -9, 2.0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = teamColor;
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.quadraticCurveTo(0, -18, 12, -13);
      ctx.quadraticCurveTo(8, -8, -4, -10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(1, -12, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    if (isAirbornePanic) {
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(6, 0, 3.5, 5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(5, -1, 3, 0.2, Math.PI * 0.7);
      ctx.stroke();
    }

    // Held Weapon
    if (isAiming) {
      const weaponId = slug.selectedWeaponId;
      ctx.save();
      ctx.translate(5, -4);
      ctx.rotate(-aimRad);

      if (weaponId === 'bazooka' || weaponId === 'homing_missile') {
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.4;
        ctx.fillRect(0, -3.5, 16, 6);
        ctx.strokeRect(0, -3.5, 16, 6);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(8, -3.5, 2.5, 6);
        ctx.fillRect(13, -3.5, 2.5, 6);
      } else if (weaponId === 'dynamite') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(3, -5, 8, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -2, 8, 3);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(12, -6, 2.5 + Math.sin(animTime * 18) * 1, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'holy_grenade') {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(8, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7, -7, 2, 5);
        ctx.fillRect(5.5, -5.5, 5, 2);
      } else {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(7, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();

    // HP Badge
    const badgeW = 38;
    const badgeH = 14;
    const badgeX = slug.x - badgeW / 2;
    const badgeY = slug.y - 34;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${slug.hp}`, slug.x, badgeY + badgeH / 2);
  }
}

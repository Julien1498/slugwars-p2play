import { Slug, GameState } from '../core/types';
import {
  getTeamBodyGrad,
  SLUG_BODY_PATH,
  SLUG_BELLY_PATH,
  SLUG_SHADOW_PATH,
  SLUG_ARROW_PATH,
  SLUG_STALKS_PATH,
  SLUG_BLINK_PATH,
  SLUG_LEFT_EYE_NORMAL_PATH,
  SLUG_RIGHT_EYE_NORMAL_PATH,
  SLUG_LEFT_EYE_PANIC_PATH,
  SLUG_RIGHT_EYE_PANIC_PATH,
  SLUG_PANIC_MOUTH_PATH,
} from './slugs/slugGradients';
import { renderGhostSpirits } from './slugs/renderGhostSpirits';
import { renderSlugHat } from './slugs/renderSlugHats';
import { renderHeldWeapon } from './slugs/renderSlugWeapons';

export interface SlugsRenderContext {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  animTime: number;
  slugDeathTimestamps: Map<string, number>;
  viewLeft?: number;
  viewRight?: number;
}

export function renderAllSlugs(rc: SlugsRenderContext) {
  const { ctx, gameState, animTime, slugDeathTimestamps, viewLeft, viewRight } = rc;

  if (slugDeathTimestamps && slugDeathTimestamps.size > 0) {
    renderGhostSpirits(ctx, gameState.slugs, animTime, slugDeathTimestamps);
  }

  // Fast zero-cost early exit if no slugs are placed yet (e.g. during PLACEMENT phase)
  let hasLivingPlaced = false;
  for (let i = 0; i < gameState.slugs.length; i++) {
    const s = gameState.slugs[i];
    if (s.isAlive && s.isPlaced !== false) {
      hasLivingPlaced = true;
      break;
    }
  }
  if (!hasLivingPlaced) return;

  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const slug of gameState.slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;
    if (viewLeft !== undefined && viewRight !== undefined && (slug.x < viewLeft - 60 || slug.x > viewRight + 60)) continue;

    const team = gameState.teams.find((t) => t.id === slug.teamId);
    const teamColor = team?.color || '#ec4899';
    const teamIndex = gameState.teams.findIndex((t) => t.id === slug.teamId);
    const isActive = slug.id === (gameState.activeSlugId || (gameState as any).currentTurnSlugId);
    const phaseStr = gameState.phase as string;
    const isAiming = isActive && (phaseStr === 'AIMING' || phaseStr === 'TURN_ACTIVE' || phaseStr === 'ATTACK');
    const aimRad = ((slug.aimAngle ?? 0) * Math.PI) / 180;

    const speed = Math.hypot(slug.vx || 0, slug.vy || 0);
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
      ctx.save();
      ctx.translate(slug.x, arrowY);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#09090b';
      ctx.lineWidth = 1.4;
      ctx.fill(SLUG_ARROW_PATH);
      ctx.stroke(SLUG_ARROW_PATH);
      ctx.restore();
    }

    const isAirbornePanic = Math.abs(slug.vy || 0) > 1.6 || speed > 2.5;
    const isWalking = !isAirbornePanic && (slug.movingDir !== null && slug.movingDir !== undefined || Math.abs(slug.vx || 0) > 0.6);
    const isFacingLeft = slug.facing === 'left' || (slug as any).facingRight === false;

    // Airborne Speed Trails (only during high-speed air flight/falling)
    if (isAirbornePanic && speed > 2.5) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.lineWidth = 1.5;
      for (let s = -1; s <= 1; s++) {
        ctx.beginPath();
        ctx.moveTo(slug.x - (slug.vx || 0) * 1.8 + s * 4, slug.y - (slug.vy || 0) * 1.8 + s * 3);
        ctx.lineTo(slug.x - (slug.vx || 0) * 3.6 + s * 4, slug.y - (slug.vy || 0) * 3.6 + s * 3);
        ctx.stroke();
      }
      ctx.restore();
    }

    const stretchX = isAirbornePanic ? Math.min(0.28, Math.max(0.04, speed * 0.035)) : isWalking ? 0.08 : 0;
    const stretchY = isAirbornePanic ? -Math.min(0.16, Math.max(0.02, speed * 0.02)) : isWalking ? -0.04 : 0;
    const slugScale = 0.72;

    ctx.save();
    ctx.translate(slug.x, slug.y - 2);

    if (isAirbornePanic) {
      const tilt = Math.atan2(slug.vy || 0, Math.abs(slug.vx || 0) * (isFacingLeft ? -1 : 1)) * 0.25;
      ctx.rotate(tilt);
    } else if (isWalking) {
      const walkTilt = isFacingLeft ? -0.1 : 0.1;
      ctx.rotate(walkTilt);
    }

    if (isFacingLeft) {
      ctx.scale(-1 * (1 + stretchX) * slugScale, (1 + stretchY) * slugScale);
    } else {
      ctx.scale((1 + stretchX) * slugScale, (1 + stretchY) * slugScale);
    }

    // Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill(SLUG_SHADOW_PATH);

    // Body
    ctx.fillStyle = getTeamBodyGrad(ctx, teamColor);
    ctx.strokeStyle = isActive ? '#facc15' : '#18181b';
    ctx.lineWidth = isActive ? 2.2 : 1.6;
    ctx.fill(SLUG_BODY_PATH);
    ctx.stroke(SLUG_BODY_PATH);

    // Belly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill(SLUG_BELLY_PATH);

    // Eyestalks
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 2.4;
    ctx.stroke(SLUG_STALKS_PATH);

    // Eyes
    const isBlinking = !isAirbornePanic && !isDangerNear && Math.sin(animTime * 1.5 + (slug.id.charCodeAt(0) % 10)) > 0.94;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;

    if (isAirbornePanic) {
      ctx.fill(SLUG_LEFT_EYE_PANIC_PATH);
      ctx.stroke(SLUG_LEFT_EYE_PANIC_PATH);
      ctx.fill(SLUG_RIGHT_EYE_PANIC_PATH);
      ctx.stroke(SLUG_RIGHT_EYE_PANIC_PATH);

      const jitterX = Math.sin(animTime * 20) * 0.6;
      const jitterY = Math.cos(animTime * 20) * 0.6;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(2.5 + jitterX, -10 + jitterY, 1.2, 0, Math.PI * 2);
      ctx.arc(8.5 + jitterX, -9 + jitterY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fill(SLUG_LEFT_EYE_NORMAL_PATH);
      ctx.stroke(SLUG_LEFT_EYE_NORMAL_PATH);
      ctx.fill(SLUG_RIGHT_EYE_NORMAL_PATH);
      ctx.stroke(SLUG_RIGHT_EYE_NORMAL_PATH);

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
        ctx.stroke(SLUG_BLINK_PATH);
      }
    }

    // Team Hat
    const hatIndex = (slug as any).hatId !== undefined
      ? ['military', 'bandana', 'cyber', 'cowboy'].indexOf((slug as any).hatId)
      : teamIndex >= 0 ? teamIndex : 0;
    renderSlugHat(ctx, hatIndex >= 0 ? hatIndex : 0, teamColor, animTime);

    // Mouth
    if (isAirbornePanic) {
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.2;
      ctx.fill(SLUG_PANIC_MOUTH_PATH);
      ctx.stroke(SLUG_PANIC_MOUTH_PATH);
    } else {
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(5, -1, 3, 0.2, Math.PI * 0.7);
      ctx.stroke();
    }

    // Held Weapon
    if (isAiming) {
      const weaponId = slug.selectedWeaponId || (slug as any).selectedWeapon || 'bazooka';
      renderHeldWeapon(ctx, weaponId, aimRad, animTime);
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
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`${slug.hp}`, slug.x, badgeY + badgeH / 2);
  }
}

export { renderAllSlugs as renderSlugs, renderGhostSpirits };

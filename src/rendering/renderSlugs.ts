import { Slug, Team, GameState } from '../core/types';

export interface SlugsRenderContext {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  animTime: number;
  slugDeathTimestamps: Map<string, number>;
  viewLeft?: number;
  viewRight?: number;
}

// Static reusable vector geometry (Zero CPU allocation & re-evaluation per frame)
const SLUG_BODY_PATH = new Path2D();
SLUG_BODY_PATH.moveTo(-11, 4);
SLUG_BODY_PATH.quadraticCurveTo(-13, -1, -6, -7);
SLUG_BODY_PATH.quadraticCurveTo(0, -13, 8, -7);
SLUG_BODY_PATH.quadraticCurveTo(14, 0, 11, 6);
SLUG_BODY_PATH.quadraticCurveTo(0, 8, -11, 4);
SLUG_BODY_PATH.closePath();

const SLUG_BELLY_PATH = new Path2D();
SLUG_BELLY_PATH.ellipse(0, 3, 7.5, 3, -0.1, 0, Math.PI * 2);

const SLUG_SHADOW_PATH = new Path2D();
SLUG_SHADOW_PATH.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);

const SLUG_ARROW_PATH = new Path2D();
SLUG_ARROW_PATH.moveTo(0, 8);
SLUG_ARROW_PATH.lineTo(-6, 0);
SLUG_ARROW_PATH.lineTo(-2, 0);
SLUG_ARROW_PATH.lineTo(-2, -8);
SLUG_ARROW_PATH.lineTo(2, -8);
SLUG_ARROW_PATH.lineTo(2, 0);
SLUG_ARROW_PATH.lineTo(6, 0);
SLUG_ARROW_PATH.closePath();

// Eyestalks and Eye Path2Ds
const SLUG_STALKS_PATH = new Path2D();
SLUG_STALKS_PATH.moveTo(1, -6);
SLUG_STALKS_PATH.lineTo(2, -10);
SLUG_STALKS_PATH.moveTo(6, -5);
SLUG_STALKS_PATH.lineTo(8, -9);

const SLUG_EYES_WHITE_PATH = new Path2D();
SLUG_EYES_WHITE_PATH.arc(2, -10, 4.2, 0, Math.PI * 2);
SLUG_EYES_WHITE_PATH.arc(8, -9, 3.8, 0, Math.PI * 2);

const SLUG_PANIC_EYES_WHITE_PATH = new Path2D();
SLUG_PANIC_EYES_WHITE_PATH.arc(2, -10, 5.2, 0, Math.PI * 2);
SLUG_PANIC_EYES_WHITE_PATH.arc(8, -9, 4.8, 0, Math.PI * 2);

const SLUG_BLINK_PATH = new Path2D();
SLUG_BLINK_PATH.moveTo(-1, -10);
SLUG_BLINK_PATH.lineTo(5, -10);
SLUG_BLINK_PATH.moveTo(6, -9);
SLUG_BLINK_PATH.lineTo(11, -9);

// Weapon static Path2Ds
const WEAPON_BAT_PATH = new Path2D();
WEAPON_BAT_PATH.moveTo(1, 2);
WEAPON_BAT_PATH.lineTo(4, 2);
WEAPON_BAT_PATH.lineTo(18, -2.5);
WEAPON_BAT_PATH.lineTo(16, -6);
WEAPON_BAT_PATH.lineTo(1, 0);
WEAPON_BAT_PATH.closePath();

const WEAPON_BANANA_PATH = new Path2D();
WEAPON_BANANA_PATH.ellipse(8, 0, 7.5, 3.8, 0.4, 0, Math.PI * 2);

const WEAPON_GRENADE_PATH = new Path2D();
WEAPON_GRENADE_PATH.ellipse(8, 0, 5.5, 4.2, 0, 0, Math.PI * 2);

const WEAPON_GRENADE_GRID_PATH = new Path2D();
WEAPON_GRENADE_GRID_PATH.moveTo(4, 0);
WEAPON_GRENADE_GRID_PATH.lineTo(12, 0);
WEAPON_GRENADE_GRID_PATH.moveTo(8, -3.5);
WEAPON_GRENADE_GRID_PATH.lineTo(8, 3.5);

const WEAPON_PIGEON_BODY_PATH = new Path2D();
WEAPON_PIGEON_BODY_PATH.ellipse(7, 0, 5.5, 3.8, 0, 0, Math.PI * 2);

const WEAPON_PIGEON_BEAK_PATH = new Path2D();
WEAPON_PIGEON_BEAK_PATH.moveTo(12, -1);
WEAPON_PIGEON_BEAK_PATH.lineTo(15, 0);
WEAPON_PIGEON_BEAK_PATH.lineTo(12, 1);
WEAPON_PIGEON_BEAK_PATH.closePath();

const WEAPON_BAZOOKA_ROCKET_NOSE_PATH = new Path2D();
WEAPON_BAZOOKA_ROCKET_NOSE_PATH.moveTo(17, -2.5);
WEAPON_BAZOOKA_ROCKET_NOSE_PATH.lineTo(21, 0);
WEAPON_BAZOOKA_ROCKET_NOSE_PATH.lineTo(17, 2.5);
WEAPON_BAZOOKA_ROCKET_NOSE_PATH.closePath();

const WEAPON_HOLY_GRENADE_PATH = new Path2D();
WEAPON_HOLY_GRENADE_PATH.arc(8, 0, 5.2, 0, Math.PI * 2);

const _cachedTeamBodyGrads: Record<string, CanvasGradient> = {};
function getTeamBodyGrad(ctx: CanvasRenderingContext2D, teamColor: string): CanvasGradient {
  if (!_cachedTeamBodyGrads[teamColor]) {
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 2, 14);
    g.addColorStop(0, '#fef08a');
    g.addColorStop(0.35, teamColor);
    g.addColorStop(1, '#180828');
    _cachedTeamBodyGrads[teamColor] = g;
  }
  return _cachedTeamBodyGrads[teamColor];
}

let _cachedGhostGrad: CanvasGradient | null = null;
function getGhostGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedGhostGrad) {
    const g = ctx.createRadialGradient(-2, -6, 2, 0, 0, 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.7, '#e0f2fe');
    g.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
    _cachedGhostGrad = g;
  }
  return _cachedGhostGrad;
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
          ctx.fillStyle = getGhostGrad(ctx);
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
  const { ctx, gameState, animTime, slugDeathTimestamps, viewLeft, viewRight } = rc;

  renderGhostSpirits(ctx, gameState.slugs, animTime, slugDeathTimestamps);

  for (const slug of gameState.slugs) {
    if (!slug.isAlive || !slug.isPlaced) continue;
    if (viewLeft !== undefined && viewRight !== undefined && (slug.x < viewLeft - 60 || slug.x > viewRight + 60)) continue;

    const team = gameState.teams.find((t) => t.id === slug.teamId);
    const teamColor = team?.color || '#ec4899';
    const teamIndex = gameState.teams.findIndex((t) => t.id === slug.teamId);
    const isActive = slug.id === gameState.activeSlugId;
    const isAiming = isActive && gameState.phase === 'AIMING';
    const aimRad = (slug.aimAngle * Math.PI) / 180;

    const speed = Math.hypot(slug.vx, slug.vy);
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

    const isAirbornePanic = Math.abs(slug.vy) > 1.6 || speed > 2.5;
    const isWalking = !isAirbornePanic && (slug.movingDir !== null || Math.abs(slug.vx) > 0.6);

    // Airborne Speed Trails (only during high-speed air flight/falling)
    if (isAirbornePanic && speed > 2.5) {
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

    const stretchX = isAirbornePanic ? Math.min(0.28, Math.max(0.04, speed * 0.035)) : isWalking ? 0.08 : 0;
    const stretchY = isAirbornePanic ? -Math.min(0.16, Math.max(0.02, speed * 0.02)) : isWalking ? -0.04 : 0;
    const slugScale = 0.72;

    ctx.save();
    ctx.translate(slug.x, slug.y - 2);

    if (isAirbornePanic) {
      const tilt = Math.atan2(slug.vy, Math.abs(slug.vx) * (slug.facing === 'left' ? -1 : 1)) * 0.25;
      ctx.rotate(tilt);
    } else if (isWalking) {
      const walkTilt = slug.facing === 'left' ? -0.1 : 0.1;
      ctx.rotate(walkTilt);
    }

    if (slug.facing === 'left') {
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
      ctx.fill(SLUG_PANIC_EYES_WHITE_PATH);
      ctx.stroke(SLUG_PANIC_EYES_WHITE_PATH);

      const jitterX = Math.sin(animTime * 20) * 0.6;
      const jitterY = Math.cos(animTime * 20) * 0.6;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(2.5 + jitterX, -10 + jitterY, 1.2, 0, Math.PI * 2);
      ctx.arc(8.5 + jitterX, -9 + jitterY, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fill(SLUG_EYES_WHITE_PATH);
      ctx.stroke(SLUG_EYES_WHITE_PATH);

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

    // Team Hat 0: Military Corporal Peaked Cap (Casquette de Caporal à visière profilée)
    if (teamIndex % 4 === 0) {
      ctx.save();

      // 1. Cap Crown (Dôme vert militaire d'officier avec dégradé d'ombre)
      const capGrad = ctx.createLinearGradient(0, -19, 8, -13);
      capGrad.addColorStop(0, '#4d7c0f');
      capGrad.addColorStop(0.55, '#365314');
      capGrad.addColorStop(1, '#1a2e05');
      ctx.fillStyle = capGrad;
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      // Base line along top of brow (laisse les yeux totalement dégagés)
      ctx.moveTo(-3.5, -13);
      ctx.quadraticCurveTo(5, -14, 13, -12.5);
      // Front upward peak
      ctx.lineTo(13.5, -14.5);
      ctx.quadraticCurveTo(9, -19.5, 4, -19);
      // Back downward slope
      ctx.quadraticCurveTo(-2, -18.5, -4, -13.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Leather Finished Base Rim (Bandeau de finition bas propre)
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-3.5, -13);
      ctx.quadraticCurveTo(5, -14, 13, -12.5);
      ctx.lineTo(13.2, -11.7);
      ctx.quadraticCurveTo(5, -13.1, -3.8, -12.2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Golden Braid Cord (Galon doré au-dessus de la visière)
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-2, -13.3);
      ctx.quadraticCurveTo(5, -14.2, 12.5, -12.8);
      ctx.stroke();

      // 4. Subtle Glossy Visor (Visière noire fine pointant vers l'avant au front)
      ctx.fillStyle = '#09090b';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(6, -13.2);
      ctx.quadraticCurveTo(10, -13.5, 14.5, -12.2);
      ctx.quadraticCurveTo(10, -12.4, 6, -12.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 5. Golden Corporal Insignia (Étoile / Cocarde dorée de caporal)
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(5, -16.2, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(5, -16.2, 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
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

      if (weaponId === 'bazooka') {
        // --- MILITARY RPG BAZOOKA ---
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.3;
        ctx.fillRect(0, -3.5, 17, 6);
        ctx.strokeRect(0, -3.5, 17, 6);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(9, -3.5, 2.5, 6);
        // Rocket Nose loaded inside
        ctx.fillStyle = '#ef4444';
        ctx.fill(WEAPON_BAZOOKA_ROCKET_NOSE_PATH);
        // Top Sight
        ctx.fillStyle = '#18181b';
        ctx.fillRect(4, -5.5, 4, 2);
      } else if (weaponId === 'homing_missile') {
        // --- HIGH-TECH HOMING LASER LAUNCHER ---
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.3;
        ctx.fillRect(0, -4, 18, 7);
        ctx.strokeRect(0, -4, 18, 7);
        // Cyan Sensor Stripe & Scope
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(6, -6, 6, 2.5);
        ctx.fillRect(14, -4, 3, 7);
        // Glowing Antenna Tip
        ctx.fillStyle = Math.sin(animTime * 12) > 0 ? '#38bdf8' : '#0284c7';
        ctx.beginPath();
        ctx.arc(4, -7.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'grenade') {
        // --- ARMY GREEN PINEAPPLE FRAG GRENADE ---
        const grenGrad = ctx.createRadialGradient(7, -1, 1, 8, 0, 5);
        grenGrad.addColorStop(0, '#65a30d');
        grenGrad.addColorStop(0.6, '#3f6212');
        grenGrad.addColorStop(1, '#1a2e05');
        ctx.fillStyle = grenGrad;
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1.2;
        ctx.fill(WEAPON_GRENADE_PATH);
        ctx.stroke(WEAPON_GRENADE_PATH);
        // Fragmentation grid
        ctx.strokeStyle = '#1a2e05';
        ctx.lineWidth = 0.8;
        ctx.stroke(WEAPON_GRENADE_GRID_PATH);
        // Silver spoon lever & pin
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(6.5, -5.5, 3, 2);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(5, -5, 1.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (weaponId === 'banana_bomb') {
        // --- CURVED TROPICAL BANANA BOMB ---
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 1.2;
        ctx.fill(WEAPON_BANANA_PATH);
        ctx.stroke(WEAPON_BANANA_PATH);
        // Green tip & brown stalk
        ctx.fillStyle = '#65a30d';
        ctx.fillRect(2, 2, 2, 2);
        ctx.fillStyle = '#713f12';
        ctx.fillRect(13, -3, 2.5, 2.5);
      } else if (weaponId === 'dynamite') {
        // --- RED TNT DYNAMITE STICK ---
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.2;
        ctx.fillRect(3, -5, 9, 10);
        ctx.strokeRect(3, -5, 9, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -2, 9, 3);
        // Spark
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(13, -6.5, 2.5 + Math.sin(animTime * 18) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'holy_grenade') {
        // --- GOLDEN HOLY HAND GRENADE ---
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.2;
        ctx.fill(WEAPON_HOLY_GRENADE_PATH);
        ctx.stroke(WEAPON_HOLY_GRENADE_PATH);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(7, -7.5, 2, 5.5);
        ctx.fillRect(5.5, -5.5, 5, 2);
      } else if (weaponId === 'shotgun') {
        // --- DOUBLE BARREL SHOTGUN ---
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.fillRect(3, -2.5, 15, 4);
        ctx.strokeRect(3, -2.5, 15, 4);
        // Wooden Stock
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-2, -1.5, 6, 4.5);
        // Muzzle Openings
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(17, -2.5, 1.5, 4);
      } else if (weaponId === 'baseball_bat') {
        // --- WOODEN BASEBALL BAT ---
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.fill(WEAPON_BAT_PATH);
        ctx.stroke(WEAPON_BAT_PATH);
        // White Grip Tape
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(2, 0, 4, 2.5);
      } else if (weaponId === 'prod') {
        // --- ELECTRIC CATTLE PROD ---
        ctx.fillStyle = '#334155';
        ctx.fillRect(1, -1.5, 12, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(13, -3, 3, 6);
        // Electric Spark Tip
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(16, 0);
        ctx.lineTo(19 + Math.sin(animTime * 20) * 2, -2 + Math.cos(animTime * 20) * 2);
        ctx.lineTo(21, 0);
        ctx.stroke();
      } else if (weaponId === 'blowtorch') {
        // --- WELDING BLOWTORCH WITH ROARING FLAME ---
        ctx.fillStyle = '#64748b';
        ctx.fillRect(2, -2, 10, 4);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(11, -1, 4, 2);
        // Welding Flame
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(15, -2);
        ctx.lineTo(22 + Math.sin(animTime * 25) * 3, 0);
        ctx.lineTo(15, 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(17, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'air_strike') {
        // --- TACTICAL RADIO BEACON ---
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.fillRect(3, -5, 7, 10);
        ctx.strokeRect(3, -5, 7, 10);
        // Antenna
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(5, -5); ctx.lineTo(5, -10);
        ctx.stroke();
        // Blinking Red LED
        ctx.fillStyle = Math.sin(animTime * 10) > 0 ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(5, -11, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'homing_pigeon') {
        // --- CARRIER PIGEON IN HAND ---
        ctx.fillStyle = '#94a3b8';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.1;
        ctx.fill(WEAPON_PIGEON_BODY_PATH);
        ctx.stroke(WEAPON_PIGEON_BODY_PATH);
        // Beak
        ctx.fillStyle = '#f97316';
        ctx.fill(WEAPON_PIGEON_BEAK_PATH);
        // Aviator Goggles
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(10, -1.5, 1.4, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponId === 'super_sheep') {
        // --- SUPER SHEEP IN HAND ---
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(6, -1, 4.5, 0, Math.PI * 2);
        ctx.arc(9, 1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Red cape
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(1, -2, 4, 6);
      } else if (weaponId === 'concrete_donkey') {
        // --- MINI CONCRETE DONKEY IN HAND ---
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.2;
        ctx.fillRect(4, -5, 8, 9);
        ctx.strokeRect(4, -5, 8, 9);
        // Ears
        ctx.fillRect(8, -8, 2, 4);
        ctx.fillRect(10, -8, 2, 4);
      } else if (weaponId === 'teleport') {
        // --- QUANTUM TELEPORT REMOTE ---
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(3, -4, 8, 8);
        // Pulsing Portal Ring
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(7, 0, 3 + Math.sin(animTime * 12) * 1, 0, Math.PI * 2);
        ctx.stroke();
      } else if (weaponId === 'ninja_rope') {
        // --- NINJA ROPE GRAPPLING HOOK ---
        ctx.fillStyle = '#334155';
        ctx.fillRect(2, -2, 8, 4);
        // Hook Prongs
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(10, 0); ctx.lineTo(14, 0);
        ctx.moveTo(12, -4); ctx.lineTo(14, 0); ctx.lineTo(12, 4);
        ctx.stroke();
      } else if (weaponId === 'girder') {
        // --- STEEL I-BEAM GIRDER ---
        ctx.fillStyle = '#f59e0b';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.fillRect(3, -6, 6, 12);
        ctx.strokeRect(3, -6, 6, 12);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -4, 4, 8);
      } else if (weaponId === 'skip_turn') {
        // --- SURRENDER / SKIP FLAG ---
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(4, 4); ctx.lineTo(4, -10);
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(4, -10, 8, 5);
      } else {
        // Generic Utility Device
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(7, 0, 4.5, 0, Math.PI * 2);
        ctx.fill();
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

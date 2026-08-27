import { Slug, Vector2D } from '../core/types';
import { getWeapon } from '../core/weapons/registry';
import { DestructibleTerrain } from '../core/terrain';

export interface AimGuidesContext {
  ctx: CanvasRenderingContext2D;
  activeSlug: Slug;
  isMyTurn: boolean;
  terrain: DestructibleTerrain;
  mousePos: Vector2D;
  lockedTarget: Vector2D | null;
  animTime: number;
}

function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

const _bSize = 22;
const _bLen = 6;

// Static reusable path geometry for tactical reticles
const TARGET_RETICLE_CORNERS_PATH = createPath((p) => {
  p.moveTo(-_bSize, -_bSize + _bLen);
  p.lineTo(-_bSize, -_bSize);
  p.lineTo(-_bSize + _bLen, -_bSize);
  p.moveTo(_bSize - _bLen, -_bSize);
  p.lineTo(_bSize, -_bSize);
  p.lineTo(_bSize, -_bSize + _bLen);
  p.moveTo(-_bSize, _bSize - _bLen);
  p.lineTo(-_bSize, _bSize);
  p.lineTo(-_bSize + _bLen, _bSize);
  p.moveTo(_bSize - _bLen, _bSize);
  p.lineTo(_bSize, _bSize);
  p.lineTo(_bSize, _bSize - _bLen);
});

const TARGET_RETICLE_CROSS_PATH = createPath((p) => {
  p.moveTo(-10, 0);
  p.lineTo(10, 0);
  p.moveTo(0, -10);
  p.lineTo(0, 10);
});

export function renderAimGuides(rc: AimGuidesContext) {
  const { ctx, activeSlug, isMyTurn, terrain, mousePos, lockedTarget, animTime } = rc;

  const weapon = getWeapon(activeSlug.selectedWeaponId);
  const rad = (activeSlug.aimAngle * Math.PI) / 180;
  const dir = activeSlug.facing === 'right' ? 1 : -1;
  const originX = activeSlug.x + dir * 10;
  const originY = activeSlug.y - 10;

  // 1. Classic Animated Reticle (Bazooka, Grenades, Homing Missile launch angle)
  const showsClassicReticle = !weapon.requiresTarget || weapon.id === 'homing_missile';
  if (isMyTurn && showsClassicReticle && weapon.id !== 'girder') {
    const reticleDist = 58;
    const retX = originX + Math.cos(rad) * reticleDist * dir;
    const retY = originY - Math.sin(rad) * reticleDist;

    ctx.save();
    ctx.translate(retX, retY);

    // Dotted Ray
    ctx.strokeStyle = activeSlug.isChargingPower ? 'rgba(239, 68, 68, 0.55)' : 'rgba(250, 204, 21, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(-(retX - originX), -(retY - originY));
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outer Circle
    const pulse = Math.sin(animTime * 6) * 1.5;
    const outerR = 14 + pulse;
    ctx.strokeStyle = activeSlug.isChargingPower ? '#ef4444' : '#facc15';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, outerR, 0, Math.PI * 2);
    ctx.stroke();

    // 4 Cardinal Ticks
    const tickLen = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -outerR - 2);
    ctx.lineTo(0, -outerR - 2 - tickLen);
    ctx.moveTo(0, outerR + 2);
    ctx.lineTo(0, outerR + 2 + tickLen);
    ctx.moveTo(-outerR - 2, 0);
    ctx.lineTo(-outerR - 2 - tickLen, 0);
    ctx.moveTo(outerR + 2, 0);
    ctx.lineTo(outerR + 2 + tickLen, 0);
    ctx.stroke();

    // Segmented Ring
    ctx.save();
    ctx.rotate(animTime * 2);
    ctx.strokeStyle = activeSlug.isChargingPower ? 'rgba(239, 68, 68, 0.8)' : 'rgba(254, 240, 138, 0.8)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, (i * Math.PI) / 2 + 0.25, ((i + 1) * Math.PI) / 2 - 0.25);
      ctx.stroke();
    }
    ctx.restore();

    // Center Dot
    ctx.fillStyle = activeSlug.isChargingPower ? '#ef4444' : '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Badge
    const badgeX = dir === 1 ? 22 : -22;
    const badgeY = -16;
    const currentFuse = activeSlug.fuseTimerSec ?? (weapon.fuseTimeMs ? Math.round(weapon.fuseTimeMs / 1000) : 3);
    const badgeText = weapon.allowCustomFuse ? `${Math.round(activeSlug.aimAngle)}° [⏱️${currentFuse}s]` : `${Math.round(activeSlug.aimAngle)}°`;

    ctx.font = 'bold 9.5px monospace';
    const textW = ctx.measureText(badgeText).width;
    const padW = textW + 10;
    const padH = 14;

    ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
    ctx.strokeStyle = activeSlug.isChargingPower ? '#ef4444' : '#eab308';
    ctx.lineWidth = 1;
    ctx.fillRect(badgeX - padW / 2, badgeY - padH / 2, padW, padH);
    ctx.strokeRect(badgeX - padW / 2, badgeY - padH / 2, padW, padH);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX, badgeY);

    ctx.restore();
  }

  // 2. Ninja Rope Guide
  if (isMyTurn && weapon.id === 'ninja_rope') {
    const maxDist = 250;
    let hitX = originX + Math.cos(rad) * maxDist * dir;
    let hitY = originY - Math.sin(rad) * maxDist;
    let hasSolid = false;

    for (let d = 10; d <= maxDist; d += 4) {
      const tx = originX + Math.cos(rad) * d * dir;
      const ty = originY - Math.sin(rad) * d;
      if (tx < 0 || tx >= terrain.data.width || ty < 0) break;
      if (terrain.isSolid(Math.floor(tx), Math.floor(ty))) {
        hitX = tx;
        hitY = ty;
        hasSolid = true;
        break;
      }
    }

    ctx.save();
    ctx.strokeStyle = hasSolid ? '#38bdf8' : '#71717a';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(hitX, hitY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (hasSolid) {
      ctx.strokeStyle = '#38bdf8';
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(hitX, hitY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Girder Hologram
  if (isMyTurn && weapon.id === 'girder') {
    const defaultPt = { x: activeSlug.x + (activeSlug.facing === 'right' ? 80 : -80), y: activeSlug.y - 20 };
    const isLocked = !!lockedTarget;
    const targetPt = lockedTarget || (mousePos.x !== 0 || mousePos.y !== 0 ? mousePos : defaultPt);
    const length = 110;
    const thickness = 14;
    const angleDeg = activeSlug.aimAngle || 0;
    const gRad = (angleDeg * Math.PI) / 180;

    // Rotation Ray from locked point to mouse
    if (isLocked && (mousePos.x !== 0 || mousePos.y !== 0)) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(targetPt.x, targetPt.y);
      ctx.lineTo(mousePos.x, mousePos.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(targetPt.x, targetPt.y);

    // Lock ring if position locked
    if (isLocked) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.rotate(gRad);

    ctx.fillStyle = isLocked ? 'rgba(56, 189, 248, 0.45)' : 'rgba(56, 189, 248, 0.25)';
    ctx.strokeStyle = isLocked ? '#38bdf8' : '#71717a';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.fillRect(-length / 2, -thickness / 2, length, thickness);
    ctx.strokeRect(-length / 2, -thickness / 2, length, thickness);
    ctx.setLineDash([]);

    ctx.strokeStyle = isLocked ? '#f59e0b' : '#facc15';
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 6);
    ctx.stroke();

    // Degree readout & hint
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = isLocked
      ? `🔒 ${Math.round(angleDeg % 360)}° [Clic Gauche = Poser]`
      : `${Math.round(angleDeg % 360)}° [Clic Droit = Verrouiller]`;
    ctx.fillText(label, 0, -thickness / 2 - 4);

    ctx.restore();
  }



  // 4. Power Charging Bar
  if (activeSlug.isChargingPower) {
    const barW = 44;
    const barH = 7;
    const barX = activeSlug.x - barW / 2;
    const barY = activeSlug.y - 36;

    ctx.save();
    ctx.fillStyle = '#09090b';
    ctx.fillRect(barX - 1.5, barY - 1.5, barW + 3, barH + 3);

    const pct = Math.min(1, Math.max(0.05, activeSlug.aimPower / 100));
    const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    pGrad.addColorStop(0, '#22c55e');
    pGrad.addColorStop(0.5, '#eab308');
    pGrad.addColorStop(1, '#ef4444');

    ctx.fillStyle = pGrad;
    ctx.fillRect(barX, barY, barW * pct, barH);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9.5px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`⚡ ${Math.round(activeSlug.aimPower)}%`, activeSlug.x, barY - 3);
    ctx.restore();
  }

  // 5. Tactical Target Reticle
  if (isMyTurn && weapon.requiresTarget) {
    const defaultPt = { x: activeSlug.x + (activeSlug.facing === 'right' ? 80 : -80), y: activeSlug.y - 20 };
    const targetPt = lockedTarget || (mousePos.x !== 0 || mousePos.y !== 0 ? mousePos : defaultPt);
    const isLocked = !!lockedTarget;

    ctx.save();
    ctx.translate(targetPt.x, targetPt.y);

    const retColor = isLocked ? '#ef4444' : '#38bdf8';
    const pingR = 18 + ((animTime * 18) % 16);
    const pingAlpha = Math.max(0, 1 - (pingR - 18) / 16);
    ctx.strokeStyle = isLocked ? `rgba(239, 68, 68, ${pingAlpha})` : `rgba(56, 189, 248, ${pingAlpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, pingR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = retColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 2.2;
    ctx.stroke(TARGET_RETICLE_CORNERS_PATH);

    ctx.lineWidth = 1.5;
    ctx.stroke(TARGET_RETICLE_CROSS_PATH);

    ctx.fillStyle = retColor;
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isLocked ? '#ef4444' : '#38bdf8';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = isLocked
      ? '🎯 CIBLE VERROUILLÉE (CLIC GAUCHE = TIRER)'
      : '🎯 POSITIONNER CIBLE (CLIC DROIT / GAUCHE)';
    ctx.fillText(label, 0, -_bSize - 5);

    ctx.restore();
  }
}

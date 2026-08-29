import { Slug } from '../../core/types';
import { WeaponDefinition } from '../../core/weapons/types';

export function renderClassicReticle(
  ctx: CanvasRenderingContext2D,
  activeSlug: Slug,
  weapon: WeaponDefinition,
  originX: number,
  originY: number,
  rad: number,
  dir: number,
  animTime: number
) {
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

import { Slug, Vector2D } from '../../core/types';

export function renderGirderGhost(
  ctx: CanvasRenderingContext2D,
  activeSlug: Slug,
  mousePos: Vector2D,
  lockedTarget: Vector2D | null
) {
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

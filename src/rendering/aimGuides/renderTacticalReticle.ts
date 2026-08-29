import { Slug, Vector2D } from '../../core/types';

function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

const _bSize = 22;
const _bLen = 6;

// Static reusable path geometry for tactical reticles
export const TARGET_RETICLE_CORNERS_PATH = createPath((p) => {
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

export const TARGET_RETICLE_CROSS_PATH = createPath((p) => {
  p.moveTo(-10, 0);
  p.lineTo(10, 0);
  p.moveTo(0, -10);
  p.lineTo(0, 10);
});

export function renderTacticalReticle(
  ctx: CanvasRenderingContext2D,
  activeSlug: Slug,
  mousePos: Vector2D,
  lockedTarget: Vector2D | null,
  animTime: number
) {
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

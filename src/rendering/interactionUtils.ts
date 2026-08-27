import { Vector2D } from '../core/types';

/**
 * Calculates clamped aim angle (-85° to +85°) and facing direction ('left' | 'right')
 * from pointer world coordinates relative to a slug.
 */
export function calculateAimAngleAndFacing(
  pointerPos: Vector2D,
  slugPos: Vector2D
): { aimAngle: number; facing: 'left' | 'right' } {
  const dx = pointerPos.x - slugPos.x;
  const dy = pointerPos.y - slugPos.y;

  let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
  angle = Math.max(-85, Math.min(85, angle));
  if (angle === 0) angle = 0; // Normalize IEEE 754 -0 to +0
  const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

  return { aimAngle: angle, facing };
}

/**
 * Calculates 0°-360° orientation angle for placing metallic girders.
 */
export function calculateGirderAngle(
  pointerPos: Vector2D,
  pivotPos: Vector2D
): number {
  const dx = pointerPos.x - pivotPos.x;
  const dy = pointerPos.y - pivotPos.y;

  let angle = Math.round(Math.atan2(dy, dx) * (180 / Math.PI));
  if (angle < 0) angle += 360;
  return angle;
}

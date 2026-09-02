import React, { useEffect, useRef } from 'react';
import { renderSlugHat } from '../../../rendering/slugs/renderSlugHats';
import {
  SLUG_BODY_PATH,
  SLUG_BELLY_PATH,
  SLUG_STALKS_PATH,
  SLUG_LEFT_EYE_NORMAL_PATH,
  SLUG_RIGHT_EYE_NORMAL_PATH,
  getTeamBodyGrad,
} from '../../../rendering/slugs/slugGradients';

export interface HatPreviewCanvasProps {
  hatId: string;
  teamColor?: string;
  size?: number;
  className?: string;
}

export const HatPreviewCanvas: React.FC<HatPreviewCanvasProps> = ({
  hatId,
  teamColor = '#ec4899',
  size = 48,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    // Coordinate transformation to center the real slug + hat in the box
    // Real slug bounding box: x from -11 to 14, y from -22 to 6
    const scale = size / 32;
    ctx.translate(size / 2 - 1.5 * scale, size / 2 + 8 * scale);
    ctx.scale(scale, scale);

    // 1. Slug Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    if (ctx.ellipse) {
      ctx.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // 2. Real Body with Team Gradient
    ctx.fillStyle = getTeamBodyGrad(ctx, teamColor);
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.6;
    ctx.fill(SLUG_BODY_PATH);
    ctx.stroke(SLUG_BODY_PATH);

    // 3. Belly
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fill(SLUG_BELLY_PATH);

    // 4. Real Eyestalks
    ctx.strokeStyle = teamColor;
    ctx.lineWidth = 2.4;
    ctx.stroke(SLUG_STALKS_PATH);

    // 5. Real Eyes
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1.4;
    ctx.fill(SLUG_LEFT_EYE_NORMAL_PATH);
    ctx.stroke(SLUG_LEFT_EYE_NORMAL_PATH);
    ctx.fill(SLUG_RIGHT_EYE_NORMAL_PATH);
    ctx.stroke(SLUG_RIGHT_EYE_NORMAL_PATH);

    // 6. Pupils
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(2.5, -10, 1.8, 0, Math.PI * 2);
    ctx.arc(8.5, -9, 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 7. Eye glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2, -11, 0.8, 0, Math.PI * 2);
    ctx.arc(8, -10, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // 8. Mouth
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(5, -1, 3, 0.2, Math.PI * 0.7);
    ctx.stroke();

    // 9. Render the actual in-game hat!
    if (hatId !== 'none') {
      renderSlugHat(ctx, hatId, 0, teamColor, 0);
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(3.5, -12, 2.5, -1.2, -0.3);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [hatId, teamColor, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`inline-block flex-shrink-0 ${className}`}
      aria-label={`Aperçu du chapeau ${hatId}`}
    />
  );
};

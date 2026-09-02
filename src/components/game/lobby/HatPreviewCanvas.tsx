import React, { useEffect, useRef } from 'react';
import { renderSlugHat } from '../../../rendering/slugs/renderSlugHats';

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

    // Coordinate transformation to center the slug head + hat in the box
    // Total bounding box of slug head + hat is ~24x24, centered at (4, -12)
    const scale = size / 28;
    ctx.translate(size / 2 - 4 * scale, size / 2 + 12 * scale);
    ctx.scale(scale, scale);

    // 1. Cute mini slug head
    ctx.save();
    ctx.fillStyle = '#f472b6';
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(4, -7.5, 7.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2. Slug eyes
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(2.5, -8, 2.2, 0, Math.PI * 2);
    ctx.arc(6.5, -7.5, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // 3. Slug pupils
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.arc(3.1, -8, 1.1, 0, Math.PI * 2);
    ctx.arc(7.1, -7.5, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // 4. Slug smile
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(4.5, -4.5, 2.2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    ctx.restore();

    // 5. Render the actual in-game hat!
    if (hatId !== 'none') {
      renderSlugHat(ctx, hatId, 0, teamColor, 0);
    } else {
      // For 'none', a subtle bald gleam
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

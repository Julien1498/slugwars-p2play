import React, { useEffect, useRef } from 'react';
import {
  SLUG_BODY_PATH,
  SLUG_BELLY_PATH,
  SLUG_STALKS_PATH,
  SLUG_LEFT_EYE_NORMAL_PATH,
  SLUG_RIGHT_EYE_NORMAL_PATH,
  getTeamBodyGrad,
} from '../../../../rendering/slugs/slugGradients';
import { renderSlugHat } from '../../../../rendering/slugs/renderSlugHats';

interface VictoryCelebrationCanvasProps {
  teamColor: string;
  hatId?: string;
  className?: string;
}

interface ConfettiPiece {
  x: number;
  y: number;
  speedY: number;
  rotation: number;
  rotSpeed: number;
  size: number;
  color: string;
}

export const VictoryCelebrationCanvas: React.FC<VictoryCelebrationCanvasProps> = ({
  teamColor,
  hatId,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const width = 320;
    const height = 160;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // Pre-create confetti pieces (zero allocation in loop)
    const confColors = [teamColor, '#facc15', '#a855f7', '#38bdf8', '#ef4444', '#10b981'];
    const confettis: ConfettiPiece[] = Array.from({ length: 20 }, (_, i) => ({
      x: (i * 23 + 13) % width,
      y: (i * 29) % height,
      speedY: 28 + (i % 5) * 10,
      rotation: i * 0.8,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (2 + (i % 4)),
      size: 3.5 + (i % 3) * 1.5,
      color: confColors[i % confColors.length],
    }));

    const drawSlug = (
      x: number,
      y: number,
      scale: number,
      facingLeft: boolean,
      time: number,
      bounce: number,
      isCaptain: boolean
    ) => {
      ctx.save();
      ctx.translate(x, y - bounce);
      ctx.scale(facingLeft ? -scale : scale, scale);

      // Subtle celebration wobble
      const wobble = Math.sin(time * 6 + (isCaptain ? 0 : 1.5)) * 0.08;
      ctx.rotate(wobble);

      // Shadow on the ground
      ctx.save();
      ctx.translate(0, bounce);
      const shadowScale = Math.max(0.4, 1 - bounce / 22);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      if (ctx.ellipse) {
        ctx.ellipse(0, 6, 12 * shadowScale, 3.5 * shadowScale, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();

      // Body Gradient & Fill
      ctx.fillStyle = getTeamBodyGrad(ctx, teamColor);
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.6;
      ctx.fill(SLUG_BODY_PATH);
      ctx.stroke(SLUG_BODY_PATH);

      // Belly
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.fill(SLUG_BELLY_PATH);

      // Eyestalks
      ctx.strokeStyle = teamColor;
      ctx.lineWidth = 2.4;
      ctx.stroke(SLUG_STALKS_PATH);

      // Happy Eyes
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1.4;
      ctx.fill(SLUG_LEFT_EYE_NORMAL_PATH);
      ctx.stroke(SLUG_LEFT_EYE_NORMAL_PATH);
      ctx.fill(SLUG_RIGHT_EYE_NORMAL_PATH);
      ctx.stroke(SLUG_RIGHT_EYE_NORMAL_PATH);

      // Excited, looking-around pupils
      const pupilOffX = Math.sin(time * 3) * 0.8;
      const pupilOffY = -1.0;
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(2.5 + pupilOffX, -10 + pupilOffY, 1.8, 0, Math.PI * 2);
      ctx.arc(8.5 + pupilOffX, -9 + pupilOffY, 1.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2 + pupilOffX, -11 + pupilOffY, 0.7, 0, Math.PI * 2);
      ctx.arc(8 + pupilOffX, -10 + pupilOffY, 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Broad Joyful Smile
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(5, -0.5, 3.8, 0.2, Math.PI * 0.8);
      ctx.stroke();

      // Team Hat
      renderSlugHat(ctx, hatId || 'military', 0, teamColor, time);

      // Captain Floating Crown
      if (isCaptain) {
        ctx.save();
        const crownHoverY = Math.sin(time * 4) * 3 - 25;
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👑', 4, crownHoverY);
        ctx.restore();
      }

      ctx.restore();
    };

    const render = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Animate and draw celebratory confettis
      for (const c of confettis) {
        const curY = (c.y + elapsed * c.speedY) % (height + 10) - 5;
        const curRot = c.rotation + elapsed * c.rotSpeed;
        ctx.save();
        ctx.translate(c.x, curY);
        ctx.rotate(curRot);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
        ctx.restore();
      }

      // Three Celebrating Slugs (Giant, Heroic & Prominent)
      // 1. Left slug
      const bounceL = Math.abs(Math.sin(elapsed * 4.2 + 1.1)) * 12;
      drawSlug(width * 0.5 - 78, height * 0.82, 2.0, false, elapsed, bounceL, false);

      // 2. Right slug (facing left towards center)
      const bounceR = Math.abs(Math.sin(elapsed * 4.2 + 2.3)) * 12;
      drawSlug(width * 0.5 + 78, height * 0.82, 2.0, true, elapsed, bounceR, false);

      // 3. Center Captain Slug (Largest, in front with floating crown)
      const bounceC = Math.abs(Math.sin(elapsed * 4.2)) * 16;
      drawSlug(width * 0.5, height * 0.80, 2.7, false, elapsed, bounceC, true);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [teamColor, hatId]);

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      <canvas
        ref={canvasRef}
        style={{ width: 320, height: 160 }}
        className="drop-shadow-[0_4px_16px_rgba(0,0,0,0.4)] pointer-events-none select-none max-w-full"
      />
    </div>
  );
};

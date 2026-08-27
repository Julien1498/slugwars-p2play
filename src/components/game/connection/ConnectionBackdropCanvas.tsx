import React, { useEffect, useRef } from 'react';
import {
  createCloudPool,
  updateAndRenderClouds,
  createStarPool,
  updateAndRenderStars,
  SmokeParticlePool,
} from './backdrop/backdropParticlePool';
import {
  drawFlyingSuperSheep,
  drawParatrooperSlug,
  drawHoveringHelicopterSlug,
  drawVeteranBazookaSlug,
  drawDynamiteSlug,
} from './backdrop/backdropCharacters';

export const ConnectionBackdropCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let isRunning = !document.hidden;

    // Cached linear gradient for sky (recalculated only on resize)
    let cachedSkyGrad: CanvasGradient | null = null;
    const updateSkyGradient = () => {
      if (!ctx) return;
      cachedSkyGrad = ctx.createLinearGradient(0, 0, 0, height);
      cachedSkyGrad.addColorStop(0, '#09090b');
      cachedSkyGrad.addColorStop(0.35, '#1e1035');
      cachedSkyGrad.addColorStop(0.75, '#2e1065');
      cachedSkyGrad.addColorStop(1, '#09090b');
    };
    updateSkyGradient();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      updateSkyGradient();
    };
    window.addEventListener('resize', handleResize);

    const clouds = createCloudPool(width, height);
    const stars = createStarPool(width, height);
    const sheep = { x: -100, y: 110, speed: 2.2 };
    const smokePool = new SmokeParticlePool(30);

    let t = 0;

    const render = () => {
      if (!isRunning) return;
      animId = requestAnimationFrame(render);
      t += 0.03;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Gradient (Cached)
        if (cachedSkyGrad) {
          ctx.fillStyle = cachedSkyGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Stars
        updateAndRenderStars(ctx, stars, t);

        // 3. Clouds
        updateAndRenderClouds(ctx, clouds, width);

        // 4. Distant Bottom Hills
        ctx.fillStyle = 'rgba(20, 20, 28, 0.95)';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 20) {
          const hillY = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.lineTo(x, hillY);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        // Grass Edge Accents on bottom hills
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -10; x <= width + 20; x += 14) {
          const y = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.moveTo(x, y);
          ctx.lineTo(x + 2, y - 4.5);
        }
        ctx.stroke();

        // 5. Flying Super Sheep with Fluttering Red Cape 🐑💨
        drawFlyingSuperSheep(ctx, sheep, width, t);

        // 6, 7, 8, 9: Tactical Flanking Characters (Desktop Screens: width >= 1024)
        if (width >= 1024) {
          drawParatrooperSlug(ctx, width, height, t);
          drawHoveringHelicopterSlug(ctx, width, height, t);
          drawVeteranBazookaSlug(ctx, width, height, t);
          drawDynamiteSlug(ctx, width, height, t, smokePool);
        }

        // 10. Update & Render Smoke Particles (0-allocation pool)
        smokePool.updateAndRender(ctx);
      } catch (err) {
        console.error('Backdrop canvas render loop error:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />;
};

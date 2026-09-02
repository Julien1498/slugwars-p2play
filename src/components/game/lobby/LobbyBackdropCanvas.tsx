import React, { useEffect, useRef } from 'react';
import {
  createLobbyStarPool,
  updateAndRenderLobbyStars,
  createNebulaCloudPool,
  updateAndRenderNebulaClouds,
  FlarePool,
} from './backdrop/lobbyParticlePool';
import { drawTacticalSlug } from './backdrop/tacticalSlugs';
import {
  drawFortifiedBastion,
  drawSearchlightTower,
  drawRadarOutpost,
  drawTacticalDrone,
} from './backdrop/lobbyBastions';
import { perfTracker } from '../../../core/perfTracker';

export const LobbyBackdropCanvas: React.FC = () => {
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
      cachedSkyGrad.addColorStop(0, '#06060c');
      cachedSkyGrad.addColorStop(0.35, '#120924');
      cachedSkyGrad.addColorStop(0.7, '#240e46');
      cachedSkyGrad.addColorStop(1, '#09090f');
    };
    updateSkyGradient();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      updateSkyGradient();
    };
    window.addEventListener('resize', handleResize);

    const stars = createLobbyStarPool(width, height);
    const nebulaClouds = createNebulaCloudPool(width, height);
    const flarePool = new FlarePool(3);

    let t = 0;

    const renderBackdrop = () => {
      if (!isRunning) return;
      animId = requestAnimationFrame(renderBackdrop);
      t += 0.025;
      const renderStart = performance.now();

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Gradient (Cached)
        if (cachedSkyGrad) {
          ctx.fillStyle = cachedSkyGrad;
          ctx.fillRect(0, 0, width, height);
        }

        // 2. Stars
        updateAndRenderLobbyStars(ctx, stars, t);

        // 3. Clouds
        updateAndRenderNebulaClouds(ctx, nebulaClouds, width);

        // 4. Distant Mountain Silhouette Ridges
        ctx.fillStyle = 'rgba(15, 12, 28, 0.9)';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 25) {
          const my = height * 0.7 + Math.sin(x * 0.003 + 0.5) * 55;
          ctx.lineTo(x, my);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        // Foreground Fortified Bunker Hills
        ctx.fillStyle = '#0f0f17';
        ctx.beginPath();
        ctx.moveTo(-20, height + 20);
        for (let x = -20; x <= width + 40; x += 20) {
          const by = height * 0.85 + Math.sin(x * 0.004 + 2.1) * 35;
          ctx.lineTo(x, by);
        }
        ctx.lineTo(width + 20, height + 20);
        ctx.closePath();
        ctx.fill();

        // Green Dotted Grass Blade Dashes
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -10; x <= width + 20; x += 14) {
          const by = height * 0.85 + Math.sin(x * 0.004 + 2.1) * 35;
          ctx.moveTo(x, by);
          ctx.lineTo(x + 2, by - 4.5);
        }
        ctx.stroke();

        // 5. & 6. Fortified Bastions & Watchtowers (Desktop Screens: width >= 1024)
        if (width >= 1024) {
          const leftBastionX = Math.max(90, Math.min(width * 0.12, 220));
          const leftBastionY = Math.max(260, height * 0.52);

          drawFortifiedBastion(ctx, leftBastionX, leftBastionY + 20, 150, 95, 'POSTE OBSERV.', '#10b981', t);

          ctx.save();
          ctx.translate(leftBastionX - 15, leftBastionY);
          drawTacticalSlug(ctx, 1.25, 'NIGHT_VISION', true, t);
          ctx.restore();

          drawSearchlightTower(ctx, leftBastionX + 35, leftBastionY - 14, height, t);

          const rightBastionX = Math.max(width - 220, width * 0.88);
          const rightBastionY = Math.max(260, height * 0.52);

          drawFortifiedBastion(ctx, rightBastionX, rightBastionY + 20, 150, 95, 'TRANSMISSIONS', '#38bdf8', t);

          ctx.save();
          ctx.translate(rightBastionX + 15, rightBastionY);
          drawTacticalSlug(ctx, 1.25, 'RADIO_COMM', false, t);
          ctx.restore();

          drawRadarOutpost(ctx, rightBastionX - 35, rightBastionY - 14, t);
        }

        // 7. Tactical Recon Surveillance Drone 🛸
        drawTacticalDrone(ctx, width, height, t);

        // 8. Artillery Tracer Flares (0-allocation pool)
        flarePool.trySpawn(width, height);
        flarePool.updateAndRender(ctx, height);
      } catch (err) {
        console.error('Lobby backdrop render error:', err);
      } finally {
        const dt = Math.max(0.1, performance.now() - renderStart);
        perfTracker.recordRenderPass('lobby_backdrop', dt);
        perfTracker.markFrame(dt, {
          slugs: width >= 1024 ? 2 : 0,
          livingSlugs: width >= 1024 ? 2 : 0,
          projectiles: 0,
          explosions: 0,
          particles: stars.length + nebulaClouds.length,
          mines: 0,
          crates: 0,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animId = requestAnimationFrame(renderBackdrop);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    renderBackdrop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none w-full h-full z-0" />;
};

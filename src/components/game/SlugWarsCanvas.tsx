import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = ({
  gameState,
  terrain,
  isMyTurn,
  onFire,
  onUpdateAim,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSeedRef = useRef<number | null>(null);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());

  // Render terrain to offscreen canvas
  const redrawOffscreenTerrain = useCallback(() => {
    const { width, height, grid } = terrain.data;
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.clearRect(0, 0, width, height);
    const imgData = offCtx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        const idx = (rowOffset + x) * 4;
        if (grid[rowOffset + x] === 1) {
          const isTopGrass = y > 0 && grid[(y - 1) * width + x] === 0;
          data[idx] = isTopGrass ? 34 : 120;
          data[idx + 1] = isTopGrass ? 197 : 85;
          data[idx + 2] = isTopGrass ? 94 : 57;
          data[idx + 3] = 255;
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);
  }, [terrain]);

  // Carve crater on offscreen canvas when explosion happens
  const carveOffscreenCrater = useCallback((x: number, y: number, radius: number) => {
    const offCanvas = offscreenCanvasRef.current;
    if (!offCanvas) return;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.save();
    offCtx.globalCompositeOperation = 'destination-out';
    offCtx.beginPath();
    offCtx.arc(x, y, radius, 0, Math.PI * 2);
    offCtx.fill();
    offCtx.restore();
  }, []);

  // Canvas Click Handler
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * terrain.data.width;
      const clickY = ((e.clientY - rect.top) / rect.height) * terrain.data.height;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.requiresTarget) {
        onFire({ x: clickX, y: clickY });
      } else {
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        const dist = Math.hypot(dx, dy);
        let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
        angle = Math.max(5, Math.min(85, angle));
        const power = Math.max(20, Math.min(100, Math.round((dist / 300) * 100)));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, power, facing);
        onFire();
      }
    },
    [isMyTurn, gameState, terrain, onFire, onUpdateAim]
  );

  // Render Loop
  useEffect(() => {
    if (lastSeedRef.current !== terrain.data.seed) {
      lastSeedRef.current = terrain.data.seed;
      carvedExplosionsRef.current.clear();
      redrawOffscreenTerrain();
    }

    for (const ex of gameState.explosions) {
      if (!carvedExplosionsRef.current.has(ex.id)) {
        carvedExplosionsRef.current.add(ex.id);
        carveOffscreenCrater(ex.x, ex.y, ex.radius);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const { width, height, waterLevel } = terrain.data;
      ctx.clearRect(0, 0, width, height);

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.7, '#1e1b4b');
      skyGrad.addColorStop(1, '#020617');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw Pre-rendered Offscreen Terrain
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      // Draw Water Level
      ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
      ctx.fillRect(0, waterLevel, width, height - waterLevel);

      // Draw Slugs
      for (const slug of gameState.slugs) {
        if (!slug.isAlive) continue;
        const team = gameState.teams.find((t) => t.id === slug.teamId);
        const isActive = slug.id === gameState.activeSlugId;

        // Slug Body
        ctx.fillStyle = team?.color || '#ec4899';
        ctx.beginPath();
        ctx.arc(slug.x, slug.y - 8, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isActive ? '#facc15' : '#ffffff';
        ctx.lineWidth = isActive ? 2.5 : 1;
        ctx.stroke();

        // Eye
        const eyeX = slug.x + (slug.facing === 'right' ? 4 : -4);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX, slug.y - 10, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Name & HP Bar
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slug.name, slug.x, slug.y - 24);

        const hpPercent = slug.hp / slug.maxHp;
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(slug.x - 14, slug.y - 20, 28, 4);
        ctx.fillStyle = hpPercent > 0.4 ? '#22c55e' : '#ef4444';
        ctx.fillRect(slug.x - 14, slug.y - 20, 28 * hpPercent, 4);
      }

      // Trajectory Line & Aim Guide
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && isMyTurn && gameState.phase === 'AIMING') {
        const rad = (activeSlug.aimAngle * Math.PI) / 180;
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        const aimLength = (activeSlug.aimPower / 100) * 60;
        const targetX = activeSlug.x + Math.cos(rad) * aimLength * dir;
        const targetY = activeSlug.y - Math.sin(rad) * aimLength;

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(activeSlug.x, activeSlug.y - 8);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Projectiles
      for (const proj of gameState.projectiles) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Draw Explosions
      for (const ex of gameState.explosions) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState, terrain, isMyTurn, redrawOffscreenTerrain, carveOffscreenCrater]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={terrain.data.width}
        height={terrain.data.height}
        onClick={handleCanvasClick}
        className="w-full h-auto cursor-crosshair block"
      />
    </div>
  );
};

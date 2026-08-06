import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onStartCharge?: () => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = ({
  gameState,
  terrain,
  isMyTurn,
  showHitboxes = false,
  onFire,
  onPlaceSlug,
  onStartCharge,
  onReleaseCharge,
  onUpdateAim,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastSeedRef = useRef<number | null>(null);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 700, y: 350 });

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

  // Calculate exact mouse position inside the rendered canvas area (taking object-contain letterboxing into account!)
  const getCanvasMousePos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): Vector2D => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      const canvasWidth = terrain.data.width;
      const canvasHeight = terrain.data.height;

      const canvasAspect = canvasWidth / canvasHeight;
      const rectAspect = rect.width / rect.height;

      let drawWidth = rect.width;
      let drawHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (rectAspect > canvasAspect) {
        // Pillarboxed (vertical bars on left & right)
        drawWidth = rect.height * canvasAspect;
        offsetX = (rect.width - drawWidth) / 2;
      } else {
        // Letterboxed (horizontal bars on top & bottom)
        drawHeight = rect.width / canvasAspect;
        offsetY = (rect.height - drawHeight) / 2;
      }

      const clientX = e.clientX - rect.left - offsetX;
      const clientY = e.clientY - rect.top - offsetY;

      const mouseX = Math.max(0, Math.min(canvasWidth, (clientX / drawWidth) * canvasWidth));
      const mouseY = Math.max(0, Math.min(canvasHeight, (clientY / drawHeight) * canvasHeight));

      return { x: mouseX, y: mouseY };
    },
    [terrain]
  );

  // Real-time Mouse Aiming Handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);
      setMousePos({ x: mouseX, y: mouseY });

      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const dx = mouseX - activeSlug.x;
      const dy = mouseY - activeSlug.y;
      let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
      angle = Math.max(5, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

      onUpdateAim?.(angle, activeSlug.aimPower, facing);
    },
    [isMyTurn, gameState, getCanvasMousePos, onUpdateAim]
  );

  // Mouse Charging / Placement Handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn) return;
      const { x: mouseX, y: mouseY } = getCanvasMousePos(e);

      if (gameState.phase === 'PLACEMENT') {
        onPlaceSlug?.({ x: mouseX, y: mouseY });
        return;
      }

      if (gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const dx = mouseX - activeSlug.x;
      const dy = mouseY - activeSlug.y;
      let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
      angle = Math.max(5, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';
      onUpdateAim?.(angle, activeSlug.aimPower, facing);

      if (!weapon.requiresTarget) {
        onStartCharge?.();
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      const { x: clickX, y: clickY } = getCanvasMousePos(e);

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.requiresTarget) {
        onFire({ x: clickX, y: clickY });
      } else {
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
        angle = Math.max(5, Math.min(85, angle));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, activeSlug.aimPower, facing);
        onReleaseCharge?.({ x: clickX, y: clickY });
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim]
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

      // Draw Landmines (Tactical Artillery Style Classic Mines!)
      if (gameState.mines) {
        for (const mine of gameState.mines) {
          // Metallic Base Disc
          ctx.fillStyle = '#4b5563';
          ctx.beginPath();
          ctx.ellipse(mine.x, mine.y, 6, 3, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1f2937';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Flashing Red LED Light
          const blink = mine.isTriggered
            ? Math.floor(Date.now() / 100) % 2 === 0
            : Math.floor(Date.now() / 600) % 2 === 0;

          ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(mine.x, mine.y - 4, 2.5, 0, Math.PI * 2);
          ctx.fill();

          if (mine.isTriggered && mine.fuseTimerMs !== undefined) {
            const sec = (mine.fuseTimerMs / 1000).toFixed(1);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'extrabold 10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`⚠️ ${sec}s`, mine.x, mine.y - 12);
          }
        }
      }

      // Draw Slugs (Tactical Artillery Style Expressive Vector Design!)
      const animTime = Date.now() / 300;

      // Placement Ghost Preview
      if (gameState.phase === 'PLACEMENT' && isMyTurn) {
        const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
        const team = gameState.teams.find((t) => t.id === gameState.activeTeamId);

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = team?.color || '#a855f7';
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y - 8, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y - 8, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 Placer ${activeSlug?.name || 'Limace'}`, mousePos.x, mousePos.y - 28);
      }

      for (const slug of gameState.slugs) {
        if (!slug.isAlive || !slug.isPlaced) continue;
        const team = gameState.teams.find((t) => t.id === slug.teamId);
        const isActive = slug.id === gameState.activeSlugId;

        // Active Slug Yellow Floating Arrow Marker (Tactical Artillery Style!)
        if (isActive) {
          const arrowBounce = Math.sin(animTime) * 3;
          const arrowY = slug.y - 48 + arrowBounce;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(slug.x, arrowY + 6);
          ctx.lineTo(slug.x - 5, arrowY);
          ctx.lineTo(slug.x + 5, arrowY);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // --- EXPRESSIVE VECTOR SLUG DRAWING ---
        ctx.save();
        ctx.translate(slug.x, slug.y - 8);
        if (slug.facing === 'left') {
          ctx.scale(-1, 1);
        }

        // Slug Body Goutte / Contour
        ctx.fillStyle = team?.color || '#ec4899';
        ctx.beginPath();
        ctx.moveTo(-9, 4);
        ctx.quadraticCurveTo(-11, 0, -6, -6);
        ctx.quadraticCurveTo(0, -10, 6, -6);
        ctx.quadraticCurveTo(10, 0, 7, 5);
        ctx.quadraticCurveTo(0, 8, -9, 4);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isActive ? '#facc15' : '#09090b';
        ctx.lineWidth = isActive ? 2 : 1.2;
        ctx.stroke();

        // Team Headband / Soldier Helmet
        ctx.fillStyle = team?.color || '#3b82f6';
        ctx.beginPath();
        ctx.ellipse(1, -7, 6.5, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Big Expressive Cartoon Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(3, -5, 3.2, 0, Math.PI * 2);
        ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupils (Target tracking direction)
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.arc(4, -5, 1.3, 0, Math.PI * 2);
        ctx.arc(7.8, -5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Low HP Sweat Drop
        if (slug.hp < 25) {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(-4, -8, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Tactical Artillery Style HP Pill Badge
        ctx.fillStyle = 'rgba(9, 9, 11, 0.55)';
        ctx.strokeStyle = team?.color || '#ffffff';
        ctx.lineWidth = 1;
        const tagW = 34;
        const tagH = 12;
        const tagX = slug.x - tagW / 2;
        const tagY = slug.y - 32;

        ctx.fillRect(tagX, tagY, tagW, tagH);
        ctx.strokeRect(tagX, tagY, tagW, tagH);

        // HP Number
        ctx.fillStyle = '#f4f4f5';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${slug.hp}`, slug.x, tagY + 9.5);
      }

      // Trajectory Line & Aim Guide & Charging Power Bar
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (activeSlug && isMyTurn && gameState.phase === 'AIMING') {
        const rad = (activeSlug.aimAngle * Math.PI) / 180;
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        const aimLength = (activeSlug.aimPower / 100) * 60;
        const targetX = activeSlug.x + Math.cos(rad) * aimLength * dir;
        const targetY = activeSlug.y - Math.sin(rad) * aimLength;

        ctx.strokeStyle = activeSlug.isChargingPower ? '#ef4444' : '#facc15';
        ctx.lineWidth = activeSlug.isChargingPower ? 3 : 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(activeSlug.x, activeSlug.y - 8);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render Power Charging Bar Gauge
        if (activeSlug.isChargingPower) {
          const barW = 40;
          const barH = 6;
          const barX = activeSlug.x - barW / 2;
          const barY = activeSlug.y - 34;

          ctx.fillStyle = '#09090b';
          ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

          const pct = Math.min(1, activeSlug.aimPower / 100);
          const pGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
          pGrad.addColorStop(0, '#22c55e');
          pGrad.addColorStop(0.5, '#eab308');
          pGrad.addColorStop(1, '#ef4444');

          ctx.fillStyle = pGrad;
          ctx.fillRect(barX, barY, barW * pct, barH);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(barX, barY, barW, barH);

          // Percentage Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(activeSlug.aimPower)}%`, activeSlug.x, barY - 3);
        }
      }

      // Draw Projectiles (Custom Vector Weapons & Smoke Trails!)
      for (const proj of gameState.projectiles) {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        const angle = Math.atan2(proj.vy, proj.vx);
        ctx.rotate(angle);

        if (proj.weaponId === 'bazooka' || proj.weaponId === 'homing_pigeon') {
          // Bazooka Rocket Sprite
          ctx.fillStyle = '#eab308'; // Rocket Body
          ctx.fillRect(-6, -3, 9, 6);

          ctx.fillStyle = '#ef4444'; // Nose Cone
          ctx.beginPath();
          ctx.moveTo(3, -3);
          ctx.lineTo(8, 0);
          ctx.lineTo(3, 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#3f3f46'; // Fins
          ctx.fillRect(-7, -4.5, 3, 9);
        } else if (proj.weaponId === 'grenade' || proj.weaponId === 'cluster_bomb') {
          // Pineapple Grenade
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (proj.weaponId === 'holy_grenade') {
          // Holy Hand Grenade
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-1.5, -7, 3, 4);
        } else if (proj.weaponId === 'super_sheep') {
          // Super Sheep Sprite
          ctx.fillStyle = '#ef4444'; // Red Flying Cape
          ctx.fillRect(-8, -4, 6, 8);
          ctx.fillStyle = '#f4f4f5'; // White Wool Body
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Draw Explosions (Fiery Shockwave Core!)
      const now = Date.now();
      for (const ex of gameState.explosions) {
        const age = now - (ex.createdAt || now);
        const alpha = Math.max(0, 1 - age / 350);

        // Outer Shockwave Ring
        ctx.strokeStyle = `rgba(249, 115, 22, ${alpha})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius * (age / 350), 0, Math.PI * 2);
        ctx.stroke();

        // Inner Fireball Core
        const exGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, ex.radius);
        exGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        exGrad.addColorStop(0.3, `rgba(250, 204, 21, ${alpha * 0.9})`);
        exGrad.addColorStop(0.7, `rgba(239, 68, 68, ${alpha * 0.7})`);
        exGrad.addColorStop(1, `rgba(127, 29, 29, 0)`);

        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Floating Damage Numbers (Arcade Style bouncing -45 HP!)
      if (gameState.floatingDamages) {
        for (const fd of gameState.floatingDamages) {
          const age = now - fd.createdAt;
          const alpha = Math.max(0, 1 - age / 1000);
          const floatY = fd.y - (age / 1000) * 25;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.font = 'extrabold 14px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeText(`-${fd.damage}`, fd.x, floatY);
          ctx.fillText(`-${fd.damage}`, fd.x, floatY);
          ctx.restore();
        }
      }

      // DEBUG HITBOX OVERLAY RENDERING
      if (showHitboxes) {
        // Draw Slugs Hitboxes
        for (const slug of gameState.slugs) {
          if (!slug.isAlive) continue;

          // Body Bounding Circle (Radius 8)
          ctx.strokeStyle = '#06b6d4'; // Cyan
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(slug.x, slug.y - 8, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Feet Ground Detection Line (slug.y + 1)
          ctx.strokeStyle = '#22c55e'; // Lime Green
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(slug.x - 4, slug.y + 1);
          ctx.lineTo(slug.x + 4, slug.y + 1);
          ctx.stroke();

          // Head Ceiling Collision Marker (slug.y - 16)
          ctx.fillStyle = '#ef4444'; // Red
          ctx.fillRect(slug.x - 2, slug.y - 16, 4, 2);

          // Center Pivot Dot
          ctx.fillStyle = '#facc15'; // Yellow
          ctx.fillRect(slug.x - 1, slug.y - 8 - 1, 2, 2);

          // Velocity Vector Line
          if (Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1) {
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(slug.x, slug.y - 8);
            ctx.lineTo(slug.x + slug.vx * 5, slug.y - 8 + slug.vy * 5);
            ctx.stroke();
          }
        }

        // Draw Projectile Hitboxes
        for (const proj of gameState.projectiles) {
          ctx.strokeStyle = '#f59e0b'; // Amber
          ctx.lineWidth = 2;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#f59e0b';
          ctx.font = '9px monospace';
          ctx.fillText(`R:${proj.radius}`, proj.x + proj.radius + 2, proj.y);
        }

        // Draw Water Level Line
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.moveTo(0, waterLevel);
        ctx.lineTo(width, waterLevel);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [gameState, terrain, isMyTurn, showHitboxes, redrawOffscreenTerrain, carveOffscreenCrater]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl">
      <canvas
        ref={canvasRef}
        width={terrain.data.width}
        height={terrain.data.height}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        className="w-full h-full object-contain cursor-crosshair block"
      />
    </div>
  );
};

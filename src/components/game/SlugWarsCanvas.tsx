import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { SeededRandom } from '../../core/terrainGenerator';

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
  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 700, y: 350 });

  // Optimized 32-bit fast terrain rendering to offscreen canvas
  const redrawOffscreenTerrain = useCallback(() => {
    const { width, height, grid, theme } = terrain.data;
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offCanvas = offscreenCanvasRef.current;
    if (offCanvas.width !== width || offCanvas.height !== height) {
      offCanvas.width = width;
      offCanvas.height = height;
    }
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.clearRect(0, 0, width, height);
    const imgData = offCtx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);

    // Fast Little-Endian ABGR 32-bit integer colors
    let topColor = 0xff22c55e; // Green grass
    let lightSoilColor = 0xff184378; // Warm topsoil brown
    let darkSoilColor = 0xff081a33; // Dark subsoil brown

    if (theme === 'CAVERN') {
      topColor = 0xfffc84c0;
      lightSoilColor = 0xff951d4c;
      darkSoilColor = 0xff4a0822;
    } else if (theme === 'FORTRESS') {
      topColor = 0xffb8a394;
      lightSoilColor = 0xff554133;
      darkSoilColor = 0xff261c14;
    } else if (theme === 'FLOATING_CHAOS') {
      topColor = 0xff15caff;
      lightSoilColor = 0xff12349a;
      darkSoilColor = 0xff071542;
    }

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      const prevRowOffset = (y - 1) * width;
      const prevRowOffset2 = (y - 2) * width;
      const depthFactor = y / height;

      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x;
        if (grid[idx] === 1) {
          const isTopFringe = y > 0 && (grid[prevRowOffset + x] === 0 || (y > 1 && grid[prevRowOffset2 + x] === 0));
          if (isTopFringe) {
            data32[idx] = topColor;
          } else {
            data32[idx] = depthFactor > 0.52 ? darkSoilColor : lightSoilColor;
          }
        }
      }
    }
    offCtx.putImageData(imgData, 0, 0);

    // Draw Solid Destructible Decor Props (Hedgehogs, Chicks, Mushrooms, Flowers)
    const { solidProps } = terrain.data;
    if (solidProps) {
      for (const sprop of solidProps) {
        offCtx.save();
        offCtx.translate(sprop.x, sprop.y);

        if (sprop.type === 'hedgehog') {
          // Purple/Pink Spiky Hedgehog (Hedgewars Classic!)
          offCtx.fillStyle = '#a855f7'; // Purple Spikes
          for (let s = -12; s <= 12; s += 4) {
            offCtx.beginPath();
            offCtx.moveTo(s, -10);
            offCtx.lineTo(s * 1.25, -20);
            offCtx.lineTo(s + 3, -10);
            offCtx.fill();
          }

          offCtx.fillStyle = '#ec4899'; // Pink Body
          offCtx.beginPath();
          offCtx.ellipse(0, -9, 13, 9, 0, 0, Math.PI * 2);
          offCtx.fill();

          offCtx.fillStyle = '#fef3c7'; // White/Cream Face
          offCtx.beginPath();
          offCtx.ellipse(6, -9, 7, 6, 0, 0, Math.PI * 2);
          offCtx.fill();

          offCtx.fillStyle = '#000000'; // Eye & Nose
          offCtx.beginPath();
          offCtx.arc(8, -10, 2, 0, Math.PI * 2);
          offCtx.arc(12, -8, 1.8, 0, Math.PI * 2);
          offCtx.fill();

          // White Glove Paws
          offCtx.fillStyle = '#ffffff';
          offCtx.beginPath();
          offCtx.arc(-6, -2, 3, 0, Math.PI * 2);
          offCtx.arc(6, -2, 3, 0, Math.PI * 2);
          offCtx.fill();
        } else if (sprop.type === 'chick') {
          // Bright Yellow Chick / Poulet
          offCtx.fillStyle = '#eab308'; // Yellow Body
          offCtx.beginPath();
          offCtx.ellipse(0, -12, 14, 12, 0, 0, Math.PI * 2);
          offCtx.fill();

          offCtx.fillStyle = '#ca8a04'; // Wing
          offCtx.beginPath();
          offCtx.ellipse(-4, -10, 6, 4, -0.3, 0, Math.PI * 2);
          offCtx.fill();

          offCtx.fillStyle = '#f97316'; // Orange Beak
          offCtx.beginPath();
          offCtx.moveTo(10, -14);
          offCtx.lineTo(17, -11);
          offCtx.lineTo(10, -8);
          offCtx.closePath();
          offCtx.fill();

          offCtx.fillStyle = '#000000'; // Cute Black Eye
          offCtx.beginPath();
          offCtx.arc(7, -15, 2.2, 0, Math.PI * 2);
          offCtx.fill();
          offCtx.fillStyle = '#ffffff';
          offCtx.fillRect(7.5, -16, 1, 1);
        } else if (sprop.type === 'mushroom') {
          // Red Spotted Mushroom
          offCtx.fillStyle = '#fef3c7'; // Cream Stem
          offCtx.fillRect(-4, -12, 8, 12);

          offCtx.fillStyle = '#ef4444'; // Red Cap
          offCtx.beginPath();
          offCtx.ellipse(0, -14, 12, 9, 0, Math.PI, 0);
          offCtx.fill();

          offCtx.fillStyle = '#ffffff'; // White Dots
          offCtx.beginPath();
          offCtx.arc(-6, -17, 2, 0, Math.PI * 2);
          offCtx.arc(4, -18, 2, 0, Math.PI * 2);
          offCtx.arc(0, -13, 2, 0, Math.PI * 2);
          offCtx.fill();
        } else if (sprop.type === 'flower') {
          // Colorful Flower
          offCtx.fillStyle = '#15803d'; // Green Stem
          offCtx.fillRect(-1.5, -14, 3, 14);

          offCtx.fillStyle = sprop.variant === 1 ? '#ec4899' : sprop.variant === 2 ? '#3b82f6' : '#c084fc';
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
            offCtx.beginPath();
            offCtx.arc(Math.cos(a) * 7, -16 + Math.sin(a) * 7, 4.5, 0, Math.PI * 2);
            offCtx.fill();
          }

          offCtx.fillStyle = '#facc15'; // Yellow Core
          offCtx.beginPath();
          offCtx.arc(0, -16, 5, 0, Math.PI * 2);
          offCtx.fill();
        }

        offCtx.restore();
      }
    }
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

  // Calculate exact mouse position inside the rendered canvas area
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
        drawWidth = rect.height * canvasAspect;
        offsetX = (rect.width - drawWidth) / 2;
      } else {
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

  // Throttled Real-time Mouse Aiming Handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const dx = pos.x - activeSlug.x;
      const dy = pos.y - activeSlug.y;
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
      const { width, height, waterLevel, decorItems } = terrain.data;
      ctx.clearRect(0, 0, width, height);

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.7, '#1e1b4b');
      skyGrad.addColorStop(1, '#020617');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Deep Water Backdrop
      const waterBackdropGrad = ctx.createLinearGradient(0, waterLevel - 10, 0, height);
      waterBackdropGrad.addColorStop(0, 'rgba(3, 105, 161, 0.7)');
      waterBackdropGrad.addColorStop(1, 'rgba(12, 74, 110, 0.95)');
      ctx.fillStyle = waterBackdropGrad;
      ctx.fillRect(0, waterLevel - 5, width, height - (waterLevel - 5));

      // Draw Pre-rendered Offscreen Terrain (Includes all Solid Destructible Props & Soil Pebbles!)
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      // Draw Smooth & Slow Surface Waves
      const slowTime = Date.now() / 1200;
      const animTime = Date.now() / 300;
      ctx.fillStyle = 'rgba(14, 165, 233, 0.65)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let x = 0; x <= width; x += 10) {
        const wy = waterLevel + Math.sin(x * 0.015 + slowTime * 2) * 2.5;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      ctx.fill();

      // Gentle White Foam Crest Line
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= width; x += 10) {
        const wy = waterLevel + Math.sin(x * 0.015 + slowTime * 2) * 2.5;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();

      // Draw Visual Decor Items (Hanging Leaf Roots & Floating Butterflies)
      if (decorItems) {
        for (const item of decorItems) {
          ctx.save();
          ctx.translate(item.x, item.y);

          if (item.type === 'hanging_leaf') {
            const scale = item.scale || 1.0;
            ctx.scale(scale, scale);
            const sway = Math.sin(animTime + item.x) * 0.15;
            ctx.rotate(sway);
            ctx.fillStyle = '#16a34a';
            for (let l = -1; l <= 1; l++) {
              ctx.beginPath();
              ctx.ellipse(l * 6, 12, 4, 14, l * 0.3, 0, Math.PI * 2);
              ctx.fill();
            }
          } else if (item.type === 'butterfly') {
            const flap = Math.abs(Math.sin(animTime * 4 + item.x));
            ctx.scale(flap, 1);
            ctx.fillStyle = item.variant === 1 ? '#f97316' : '#a855f7';
            ctx.beginPath();
            ctx.ellipse(-5, 0, 5, 3, -0.4, 0, Math.PI * 2);
            ctx.ellipse(5, 0, 5, 3, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.fillRect(-1, -3, 2, 6);
          }

          ctx.restore();
        }
      }

      // Draw Landmines (Worms Style Classic Mines!)
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

      // Draw Slugs (Worms Style Expressive Vector Design!)
      // Placement Ghost Preview
      if (gameState.phase === 'PLACEMENT' && isMyTurn) {
        const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
        const team = gameState.teams.find((t) => t.id === gameState.activeTeamId);
        const mPos = mousePosRef.current;

        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = team?.color || '#a855f7';
        ctx.beginPath();
        ctx.arc(mPos.x, mPos.y - 8, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(mPos.x, mPos.y - 8, 14, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📍 Placer ${activeSlug?.name || 'Limace'}`, mPos.x, mPos.y - 28);
      }

      for (const slug of gameState.slugs) {
        if (!slug.isAlive || !slug.isPlaced) continue;
        const team = gameState.teams.find((t) => t.id === slug.teamId);
        const isActive = slug.id === gameState.activeSlugId;

        // Active Slug Yellow Floating Arrow Marker (Worms Style!)
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

        // --- EXPRESSIVE VECTOR SLUG DRAWING WITH SQUISH & STRETCH ANIMATION ---
        const isMoving = Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1;
        const squishX = isMoving ? Math.sin(animTime * 14) * 0.12 : 0;
        const squishY = isMoving ? -Math.sin(animTime * 14) * 0.12 : 0;

        ctx.save();
        ctx.translate(slug.x, slug.y - 8);
        if (slug.facing === 'left') {
          ctx.scale(-1 * (1 + squishX), 1 + squishY);
        } else {
          ctx.scale(1 + squishX, 1 + squishY);
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

        // --- HELD WEAPON STANCE IN HAND WHEN AIMING ---
        if (isActive && gameState.phase === 'AIMING') {
          const weaponId = slug.selectedWeaponId;
          const aimRad = (slug.aimAngle * Math.PI) / 180;

          ctx.save();
          ctx.translate(4, -3);
          ctx.rotate(-aimRad);

          if (weaponId === 'bazooka' || weaponId === 'homing_pigeon') {
            ctx.fillStyle = '#3f3f46'; // Bazooka Tube
            ctx.fillRect(0, -3, 14, 5);
            ctx.fillStyle = '#eab308';
            ctx.fillRect(10, -4, 3, 7);
          } else if (weaponId === 'baseball_bat') {
            ctx.fillStyle = '#b45309'; // Wooden Bat
            ctx.fillRect(0, -2, 16, 4);
          } else if (weaponId === 'holy_grenade') {
            ctx.fillStyle = '#eab308'; // Holy Hand Grenade
            ctx.beginPath();
            ctx.arc(6, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = '#15803d'; // Grenade in hand
            ctx.beginPath();
            ctx.arc(6, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        ctx.restore();

        // Worms Style HP Pill Badge
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
          // Detailed Super Sheep Sprite
          ctx.fillStyle = '#ef4444'; // Red Flying Cape
          ctx.beginPath();
          ctx.moveTo(-8, -4);
          ctx.lineTo(-14, Math.sin(animTime * 10) * 3);
          ctx.lineTo(-8, 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#f4f4f5'; // White Wool Cloud Body
          ctx.beginPath();
          ctx.arc(-2, 0, 5, 0, Math.PI * 2);
          ctx.arc(2, -2, 4.5, 0, Math.PI * 2);
          ctx.arc(2, 2, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#18181b'; // Black Head & Snout
          ctx.beginPath();
          ctx.arc(6, -1, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(6, -2, 1.5, 1.5);
        } else if (proj.weaponId === 'banana_bomb') {
          // Yellow Curved Banana Bomb Sprite
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 3.5, 0.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#854d0e';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else if (proj.weaponId === 'dynamite') {
          // Red Dynamite Stick Sprite with Blinking Fuse Spark
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-6, -3, 12, 6);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(7, -3, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.weaponId === 'homing_pigeon') {
          // White Flying Pigeon Sprite
          ctx.fillStyle = '#f4f4f5';
          ctx.beginPath();
          ctx.ellipse(0, 0, 6, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#f97316';
          ctx.fillRect(5, -1.5, 3, 2);
        } else if (proj.weaponId === 'shotgun') {
          // High Speed Bullet Flare
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-5, -1.5, 10, 3);
        } else if (proj.weaponId === 'air_strike') {
          // Aerodynamic Black Air Strike Bomb
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ef4444'; // Red Fins
          ctx.fillRect(-8, -4, 3, 8);
        } else {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(0, 0, proj.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Bouncing Timer Projectile Fuse Countdown Badge (Worms Classic ⚠️ 2.4s)
        if (proj.fuseTimerMs !== undefined && proj.fuseTimerMs > 0) {
          const sec = (proj.fuseTimerMs / 1000).toFixed(1);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'extrabold 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeText(`⚠️ ${sec}s`, 0, -12);
          ctx.fillText(`⚠️ ${sec}s`, 0, -12);
        }

        ctx.restore();
      }

      // Draw Smoke & Fire Trail Particles
      if (gameState.particles) {
        for (const p of gameState.particles) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
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

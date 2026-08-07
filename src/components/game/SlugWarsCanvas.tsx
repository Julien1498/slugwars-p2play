import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { SeededRandom } from '../../core/terrainGenerator';
import { sfx } from '../../core/audio';

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

function getPixelHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
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
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
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
            // Organic 4x4 soil block noise (No 1x1 pixel static!)
            const bx = (x / 4) | 0;
            const by = (y / 4) | 0;
            const blockHash = getPixelHash(bx, by);

            // 1. Sparse 3D Pebbles & Rocks (Cell Grid 24x24 px)
            const cellX = (x / 24) | 0;
            const cellY = (y / 24) | 0;
            const cellHash = getPixelHash(cellX * 23, cellY * 47);

            // Only 18% cell density = sparse, clean, distinct pebbles!
            const hasPebble = (cellHash % 100) < 18;
            let isPebblePixel = false;
            let pebbleColor = 0;

            if (hasPebble) {
              const pebbleX = (cellX * 24) + (cellHash % 12) + 6;
              const pebbleY = (cellY * 24) + ((cellHash >> 8) % 12) + 6;
              const pebbleRadiusX = ((cellHash >> 16) % 2) + 2.5; // 2.5 to 3.5 px
              const pebbleRadiusY = ((cellHash >> 20) % 2) + 2.0; // 2.0 to 3.0 px

              const dx = x - pebbleX;
              const dy = y - pebbleY;
              const distSq = (dx * dx) / (pebbleRadiusX * pebbleRadiusX) + (dy * dy) / (pebbleRadiusY * pebbleRadiusY);

              if (distSq <= 1.0) {
                isPebblePixel = true;
                const pType = (cellHash >> 4) % 3;

                const isHighlight = dy < -0.5 && dx < 0;
                const isShadow = dy > 0.5 && dx > 0;

                if (theme === 'CAVERN') {
                  if (pType === 0) pebbleColor = isHighlight ? 0xfff472b6 : (isShadow ? 0xff4a0822 : 0xff951d4c);
                  else if (pType === 1) pebbleColor = isHighlight ? 0xffe9d5ff : (isShadow ? 0xff581c87 : 0xffa855f7);
                  else pebbleColor = isHighlight ? 0xffffffff : 0xffc084fc;
                } else if (theme === 'FORTRESS') {
                  if (pType === 0) pebbleColor = isHighlight ? 0xffcbd5e1 : (isShadow ? 0xff1e293b : 0xff475569);
                  else if (pType === 1) pebbleColor = isHighlight ? 0xfffca5a5 : (isShadow ? 0xff450a0a : 0xff991b1b);
                  else pebbleColor = isHighlight ? 0xff94a3b8 : 0xff0f172a;
                } else if (theme === 'FLOATING_CHAOS') {
                  if (pType === 0) pebbleColor = isHighlight ? 0xff7dd3fc : (isShadow ? 0xff0c4a6e : 0xff0284c7);
                  else if (pType === 1) pebbleColor = isHighlight ? 0xfff0abfc : (isShadow ? 0xff4c1d95 : 0xffc084fc);
                  else pebbleColor = isHighlight ? 0xffffffff : 0xff38bdf8;
                } else {
                  // ISLAND Theme (Classic Earth)
                  if (pType === 0) pebbleColor = isHighlight ? 0xffcbd5e1 : (isShadow ? 0xff1e293b : 0xff64748b);
                  else if (pType === 1) pebbleColor = isHighlight ? 0xfffde047 : (isShadow ? 0xff451a03 : 0xffb45309);
                  else pebbleColor = isHighlight ? 0xff94a3b8 : 0xff334155;
                }
              }
            }

            if (isPebblePixel) {
              data32[idx] = pebbleColor;
            } else {
              // 2. Smooth Organic Soil Patches (4x4 clusters, 2 subtle tones)
              const isDeep = depthFactor > 0.52;
              const baseColor = isDeep ? darkSoilColor : lightSoilColor;
              const patchTone = (blockHash % 100) < 22;

              if (patchTone) {
                data32[idx] = isDeep ? 0xff0b182d : 0xff1c4c87;
              } else {
                data32[idx] = baseColor;
              }
            }
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
          // HD Super Cute Hedgewars Style Hedgehog!
          const spikeAngles = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];

          // 1. Dark Undercoat Spikes
          offCtx.fillStyle = '#451a03';
          for (const a of spikeAngles) {
            const sx = Math.cos(a - 0.7) * 14;
            const sy = Math.sin(a - 0.7) * 11 - 10;
            offCtx.beginPath();
            offCtx.moveTo(sx * 0.5, sy * 0.5 - 6);
            offCtx.lineTo(sx * 1.35, sy * 1.35);
            offCtx.lineTo(sx * 0.5 + 3, sy * 0.5 - 6);
            offCtx.closePath();
            offCtx.fill();
          }

          // Golden/Brown Foreground Spikes
          offCtx.fillStyle = '#b45309';
          offCtx.strokeStyle = '#f59e0b';
          offCtx.lineWidth = 0.8;
          for (const a of spikeAngles) {
            const sx = Math.cos(a - 0.75) * 12;
            const sy = Math.sin(a - 0.75) * 9 - 10;
            offCtx.beginPath();
            offCtx.moveTo(sx * 0.4, sy * 0.4 - 5);
            offCtx.lineTo(sx * 1.2, sy * 1.2);
            offCtx.lineTo(sx * 0.4 + 2, sy * 0.4 - 5);
            offCtx.closePath();
            offCtx.fill();
            offCtx.stroke();
          }

          // 2. Plump Brown Body
          offCtx.fillStyle = '#78350f';
          offCtx.beginPath();
          offCtx.ellipse(-2, -9, 12, 9, 0, 0, Math.PI * 2);
          offCtx.fill();

          // 3. Soft Peach Face & Snout
          offCtx.fillStyle = '#fef08a';
          offCtx.beginPath();
          offCtx.ellipse(4, -8, 8, 6.5, 0.2, 0, Math.PI * 2);
          offCtx.fill();

          // Snout Tip Point
          offCtx.beginPath();
          offCtx.moveTo(8, -10);
          offCtx.lineTo(13, -7);
          offCtx.lineTo(8, -4);
          offCtx.closePath();
          offCtx.fill();

          // Pink Cheek Blush
          offCtx.fillStyle = 'rgba(244, 114, 182, 0.6)';
          offCtx.beginPath();
          offCtx.ellipse(4, -5, 2.5, 1.5, 0, 0, Math.PI * 2);
          offCtx.fill();

          // Black Button Nose
          offCtx.fillStyle = '#09090b';
          offCtx.beginPath();
          offCtx.arc(13, -7, 1.8, 0, Math.PI * 2);
          offCtx.fill();

          // 4. Glossy Eye with White Sparkle
          offCtx.fillStyle = '#09090b';
          offCtx.beginPath();
          offCtx.arc(7, -10, 2.2, 0, Math.PI * 2);
          offCtx.fill();

          offCtx.fillStyle = '#ffffff';
          offCtx.beginPath();
          offCtx.arc(7.6, -10.6, 0.8, 0, Math.PI * 2);
          offCtx.fill();

          // Cute Ear
          offCtx.fillStyle = '#fde047';
          offCtx.strokeStyle = '#78350f';
          offCtx.lineWidth = 1;
          offCtx.beginPath();
          offCtx.arc(-2, -14, 2.5, 0, Math.PI * 2);
          offCtx.fill();
          offCtx.stroke();

          // 5. Cute Dark Paws on Ground
          offCtx.fillStyle = '#542608';
          offCtx.beginPath();
          offCtx.ellipse(-6, -1, 3.5, 2, 0, 0, Math.PI * 2);
          offCtx.ellipse(4, -1, 3.5, 2, 0, 0, Math.PI * 2);
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
          // HD Organic Worms/Super Mario Toadstool!
          const isPurple = sprop.variant === 1;
          const isGold = sprop.variant === 2;

          // 1. Grass Tufts at Base (Seamless terrain blending)
          offCtx.fillStyle = '#22c55e';
          offCtx.beginPath();
          offCtx.ellipse(-6, -1, 4, 2, -0.4, 0, Math.PI * 2);
          offCtx.ellipse(6, -1, 4, 2, 0.4, 0, Math.PI * 2);
          offCtx.fill();

          // 2. Organic Curved Stem (Flared base & soft outline)
          const stemGrad = offCtx.createLinearGradient(0, -16, 0, 0);
          stemGrad.addColorStop(0, '#fef9c3');
          stemGrad.addColorStop(1, '#fde047');

          offCtx.fillStyle = stemGrad;
          offCtx.strokeStyle = '#a16207';
          offCtx.lineWidth = 1.2;
          offCtx.beginPath();
          offCtx.moveTo(-4, -16);
          offCtx.quadraticCurveTo(-6, -6, -7, 0);
          offCtx.lineTo(7, 0);
          offCtx.quadraticCurveTo(6, -6, 4, -16);
          offCtx.closePath();
          offCtx.fill();
          offCtx.stroke();

          // Ring Veil under cap
          offCtx.fillStyle = '#ffffff';
          offCtx.beginPath();
          offCtx.ellipse(0, -14, 5.5, 2, 0, 0, Math.PI * 2);
          offCtx.fill();

          // 3. Dark Shadow under Cap Gills
          offCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          offCtx.beginPath();
          offCtx.ellipse(0, -16, 12, 4, 0, 0, Math.PI * 2);
          offCtx.fill();

          // 4. Plump 3D Umbrella Dome Cap
          const capGrad = offCtx.createLinearGradient(0, -28, 0, -14);
          if (isPurple) {
            capGrad.addColorStop(0, '#c084fc');
            capGrad.addColorStop(0.5, '#9333ea');
            capGrad.addColorStop(1, '#581c87');
          } else if (isGold) {
            capGrad.addColorStop(0, '#fde047');
            capGrad.addColorStop(0.5, '#d97706');
            capGrad.addColorStop(1, '#78350f');
          } else {
            capGrad.addColorStop(0, '#f87171');
            capGrad.addColorStop(0.5, '#dc2626');
            capGrad.addColorStop(1, '#7f1d1d');
          }

          offCtx.fillStyle = capGrad;
          offCtx.beginPath();
          offCtx.moveTo(-14, -16);
          offCtx.quadraticCurveTo(-15, -28, 0, -28);
          offCtx.quadraticCurveTo(15, -28, 14, -16);
          offCtx.quadraticCurveTo(0, -13, -14, -16);
          offCtx.closePath();
          offCtx.fill();

          // 5. Polka Dots
          offCtx.fillStyle = isPurple ? '#f472b6' : isGold ? '#fef3c7' : '#ffffff';
          offCtx.beginPath();
          offCtx.arc(0, -21, 2.8, 0, Math.PI * 2);
          offCtx.arc(-7, -20, 2.2, 0, Math.PI * 2);
          offCtx.arc(7, -19, 2.4, 0, Math.PI * 2);
          offCtx.arc(-2, -25, 1.8, 0, Math.PI * 2);
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

  const lockedTargetRef = useRef<Vector2D | null>(null);

  // Right-Click Target Locking Handler (Clic Droit = Poser la Cible!)
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const pos = getCanvasMousePos(e);
      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      if (weapon.requiresTarget) {
        lockedTargetRef.current = pos;
        sfx.play('tick');
      }
    },
    [isMyTurn, gameState, getCanvasMousePos]
  );

  // Mouse Charging / Placement Handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn) return;
      if (e.button !== 0) return; // Left Click Only for charging/aiming!

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

      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (!isInstantTarget) {
        const targetPt = lockedTargetRef.current || { x: mouseX, y: mouseY };
        onStartCharge?.(targetPt);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onPlaceSlug, onStartCharge, onUpdateAim]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      if (e.button !== 0) return; // Left Click Only!

      const { x: clickX, y: clickY } = getCanvasMousePos(e);

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const targetPt = lockedTargetRef.current || { x: clickX, y: clickY };
      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (isInstantTarget) {
        onFire(targetPt);
        lockedTargetRef.current = null;
      } else {
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
        angle = Math.max(5, Math.min(85, angle));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, activeSlug.aimPower, facing);
        onReleaseCharge?.(targetPt);
        lockedTargetRef.current = null;
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onFire, onReleaseCharge, onUpdateAim]
  );

  // Render Loop
  useEffect(() => {
    if (lastSeedRef.current !== terrain.data.seed || gameState.phase === 'PLACEMENT' || gameState.phase === 'LOBBY') {
      lastSeedRef.current = terrain.data.seed;
      carvedExplosionsRef.current.clear();
      lockedTargetRef.current = null;
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
            // HD Organic Swaying Jungle Vines & Creepers!
            const scale = item.scale || 1.0;
            ctx.scale(scale, scale);

            const sway = Math.sin(animTime * 1.8 + item.x) * 0.12;
            ctx.rotate(sway);

            // 1. Root Anchor Collar at Ceiling
            ctx.fillStyle = '#63310d';
            ctx.fillRect(-3, -2, 6, 3);

            // 2. Main Thin Vine Stem
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(-4, 10, 2, 20);
            ctx.quadraticCurveTo(6, 28, 0, 36);
            ctx.stroke();

            // 3. Alternating Teardrop Tropical Leaves
            const leaves = [
              { x: -3, y: 7, rx: -0.4, size: 4 },
              { x: 3, y: 13, rx: 0.5, size: 4.5 },
              { x: -2, y: 19, rx: -0.6, size: 4 },
              { x: 4, y: 26, rx: 0.4, size: 3.5 },
              { x: 0, y: 36, rx: 0.1, size: 3 }, // Tip leaf
            ];

            for (const leaf of leaves) {
              ctx.save();
              ctx.translate(leaf.x, leaf.y);
              ctx.rotate(leaf.rx);

              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.ellipse(0, 0, leaf.size, leaf.size * 0.4, 0, 0, Math.PI * 2);
              ctx.fill();

              // Leaf Center Vein Highlight
              ctx.fillStyle = '#84cc16';
              ctx.beginPath();
              ctx.ellipse(0, 0, leaf.size * 0.6, leaf.size * 0.2, 0, 0, Math.PI * 2);
              ctx.fill();

              ctx.restore();
            }

            // 4. Little Red Berry on Tip
            if ((item.variant || 0) % 2 === 1) {
              ctx.fillStyle = '#f43f5e';
              ctx.beginPath();
              ctx.arc(2, 38, 2.2, 0, Math.PI * 2);
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

      // Draw Helicopters (Vector Military Attack Helicopter with Spinning Rotor & Cockpit Glass!)
      if (gameState.helicopters) {
        const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

        for (const heli of gameState.helicopters) {
          ctx.save();
          ctx.translate(heli.x, heli.y);
          if (heli.facing === 'left') ctx.scale(-1, 1);

          // 1. Landing Skids
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-18, 14);
          ctx.lineTo(18, 14);
          ctx.moveTo(-10, 8);
          ctx.lineTo(-12, 14);
          ctx.moveTo(10, 8);
          ctx.lineTo(12, 14);
          ctx.stroke();

          // 2. Main Body Fuselage (Dark Gunmetal)
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 3. Cockpit Glass Canopy (Cyan Glass)
          ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(8, -2, 11, 7, 0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // 4. Pilot Slug Head in Cockpit
          if (heli.pilotSlugId) {
            const pilot = gameState.slugs.find((s) => s.id === heli.pilotSlugId);
            const team = pilot ? gameState.teams.find((t) => t.id === pilot.teamId) : null;
            const teamColor = team ? team.color : '#a855f7';

            ctx.save();
            ctx.translate(7, -3);

            // Pilot Slug Head
            ctx.fillStyle = teamColor;
            ctx.beginPath();
            ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Aviator Flight Helmet
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(0, -1, 5, Math.PI, Math.PI * 2);
            ctx.fill();

            // Helmet Visor
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-2, -1, 5, 2.5);

            ctx.restore();
          }

          // 5. Tail Boom & Rear Tail Rotor
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-35, -3, 20, 5);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-37, -9, 4, 12);

          // Spinning Tail Rotor Blades
          const tSpin = Math.sin(Date.now() * 0.05);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(-35, -3 - tSpin * 8);
          ctx.lineTo(-35, -3 + tSpin * 8);
          ctx.stroke();

          // 6. Top Main Rotor Shaft & Spinning Main Blades
          ctx.fillStyle = '#475569';
          ctx.fillRect(-2, -16, 4, 6);

          // Spinning Main Blades
          const bladeWidth = Math.cos(heli.rotorAngle) * 45;
          ctx.strokeStyle = heli.isFlying ? '#cbd5e1' : '#64748b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-bladeWidth, -16);
          ctx.lineTo(bladeWidth, -16);
          ctx.stroke();

          // Rotor Hub Cap
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // 7. Side Rocket Pod
          ctx.fillStyle = '#475569';
          ctx.fillRect(-6, 4, 14, 5);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(8, 5, 2, 3);

          ctx.restore();

          // 8. Health Bar above Helicopter
          const hpPct = Math.max(0, heli.hp / heli.maxHp);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
          ctx.fillRect(heli.x - 20, heli.y - 28, 40, 5);
          ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
          ctx.fillRect(heli.x - 20, heli.y - 28, 40 * hpPct, 5);

          // 9. Interactive Prompt when Active Slug is Near
          if (isMyTurn && activeSlug && !activeSlug.inVehicleId) {
            const dist = Math.hypot(activeSlug.x - heli.x, activeSlug.y - heli.y);
            if (dist < 65) {
              ctx.fillStyle = '#f59e0b';
              ctx.font = 'black 11px Outfit, sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('🚁 Appuyez sur [ENTRER / E] pour Piloter', heli.x, heli.y - 36);
            }
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
        ctx.translate(slug.x, slug.y - 2);
        if (slug.facing === 'left') {
          ctx.scale(-1 * (1 + squishX), 1 + squishY);
        } else {
          ctx.scale(1 + squishX, 1 + squishY);
        }

        // Slug Body Goutte / Contour (Flat belly resting solidly on terrain grass)
        ctx.fillStyle = team?.color || '#ec4899';
        ctx.beginPath();
        ctx.moveTo(-9, 1);
        ctx.quadraticCurveTo(-11, -3, -6, -8);
        ctx.quadraticCurveTo(0, -12, 6, -8);
        ctx.quadraticCurveTo(10, -3, 7, 2);
        ctx.quadraticCurveTo(0, 3, -9, 1);
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
          } else if (weaponId === 'blowtorch' || slug.isBlowtorching) {
            // Blowtorch Metal Canister & Nozzle
            ctx.fillStyle = '#dc2626'; // Red Gas Tank
            ctx.fillRect(-2, 0, 7, 10);
            ctx.fillStyle = '#64748b'; // Nozzle
            ctx.fillRect(5, -3, 10, 4);

            // Animated Blowtorch Plasma Flame Jet
            const flamePulse = Math.sin(Date.now() * 0.05) * 4;
            const flameLen = 30 + flamePulse;

            // Outer Orange Glow
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(15, -5);
            ctx.lineTo(15 + flameLen, -1);
            ctx.lineTo(15, 3);
            ctx.closePath();
            ctx.fill();

            // Inner Yellow Core
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.moveTo(15, -3);
            ctx.lineTo(15 + flameLen * 0.7, -1);
            ctx.lineTo(15, 1);
            ctx.closePath();
            ctx.fill();

            // Blue Plasma Base
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(15, -1, 3, 0, Math.PI * 2);
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

        // Homing Target Crosshair Reticle (for weapons requiring a target!)
        const weapon = getWeapon(activeSlug.selectedWeaponId);
        if (weapon.requiresTarget) {
          const targetPt = lockedTargetRef.current || mousePosRef.current;

          ctx.save();
          ctx.strokeStyle = lockedTargetRef.current ? '#ef4444' : '#3b82f6';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(targetPt.x, targetPt.y, 14, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(targetPt.x - 20, targetPt.y);
          ctx.lineTo(targetPt.x + 20, targetPt.y);
          ctx.moveTo(targetPt.x, targetPt.y - 20);
          ctx.lineTo(targetPt.x, targetPt.y + 20);
          ctx.stroke();

          ctx.fillStyle = lockedTargetRef.current ? '#ef4444' : '#60a5fa';
          ctx.font = 'bold 10px Outfit, sans-serif';
          ctx.textAlign = 'center';
          const label = lockedTargetRef.current
            ? '🎯 Cible verrouillée ! (Clic gauche pour tirer)'
            : '🎯 Clic Droit = Placer Cible | Clic Gauche = Tirer';
          ctx.fillText(label, targetPt.x, targetPt.y - 22);
          ctx.restore();
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
        } else if (proj.weaponId === 'homing_missile') {
          // Military Homing Missile Sprite
          ctx.fillStyle = '#2563eb'; // Blue Metallic Body
          ctx.fillRect(-8, -3, 11, 6);

          ctx.fillStyle = '#ef4444'; // Red Nose Cone
          ctx.beginPath();
          ctx.moveTo(3, -3);
          ctx.lineTo(9, 0);
          ctx.lineTo(3, 3);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#facc15'; // Yellow Fins
          ctx.fillRect(-9, -4.5, 3, 9);
        } else if (proj.weaponId === 'concrete_donkey') {
          // Massive 3D Grey Concrete Donkey Statue Sprite (Worms Classic!)
          ctx.save();
          ctx.rotate(-angle);

          // Pedestal Base
          ctx.fillStyle = '#475569';
          ctx.fillRect(-18, 10, 36, 8);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-18, 10, 36, 8);

          // Concrete Body
          ctx.fillStyle = '#64748b';
          ctx.fillRect(-14, -10, 28, 20);
          ctx.strokeRect(-14, -10, 28, 20);

          // Concrete Head & Snout
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(4, -22, 16, 14);
          ctx.strokeRect(4, -22, 16, 14);

          // Big Funny Ears
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(2, -22);
          ctx.lineTo(-4, -34);
          ctx.lineTo(6, -22);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Goofy Donkey Eyes & Teeth Grin
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(10, -18, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(14, -12, 5, 4);

          ctx.restore();
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
        onContextMenu={handleContextMenu}
        className="w-full h-full object-contain cursor-crosshair block"
      />
    </div>
  );
};

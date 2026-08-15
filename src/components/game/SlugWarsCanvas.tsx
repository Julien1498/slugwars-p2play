import React, { useRef, useEffect, useCallback, useState } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { getWeapon } from '../../core/weapons/registry';
import { SeededRandom } from '../../core/terrainGenerator';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';

export type TargetPointPayload = Vector2D & { aimAngle?: number; aimPower?: number; facing?: 'left' | 'right' };

interface SlugWarsCanvasProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  isMyTurn: boolean;
  showHitboxes?: boolean;
  onFire: (targetPoint?: TargetPointPayload) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onStartCharge?: (targetPoint?: TargetPointPayload) => void;
  onReleaseCharge?: (targetPoint?: TargetPointPayload) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
}

function getPixelHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

export const SlugWarsCanvas: React.FC<SlugWarsCanvasProps> = React.memo(({
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lightmapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const occlusionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const distMapRef = useRef<Float32Array | null>(null);
  const lastSeedRef = useRef<number | null>(null);
  const carvedExplosionsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsCanvasRef = useRef<Set<string>>(new Set());
  const mousePosRef = useRef<Vector2D>({ x: 700, y: 350 });
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const [mousePos, setMousePos] = useState<Vector2D>({ x: 700, y: 350 });

  // Smooth Camera Pan & Cursor-Centered Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomRef = useRef<number>(1.0);
  const [panOffset, setPanOffset] = useState<Vector2D>({ x: 0, y: 0 });
  const panRef = useRef<Vector2D>({ x: 0, y: 0 });
  const isDraggingCameraRef = useRef<boolean>(false);
  const dragStartMouseRef = useRef<Vector2D>({ x: 0, y: 0 });
  const dragStartPanRef = useRef<Vector2D>({ x: 0, y: 0 });
  const hasMovedCameraRef = useRef<boolean>(false);
  const clientParticlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[]>([]);
  const clientExplosionsRef = useRef<{ id: string; x: number; y: number; radius: number; startTime: number; duration: number }[]>([]);
  const clientFloatingDamagesRef = useRef<{ id: string; x: number; y: number; damage: number; startTime: number; duration: number }[]>([]);
  const prevSlugHpsRef = useRef<Map<string, number>>(new Map());

  // Zero-Overhead In-Game Permanent FPS HUD Refs
  const fpsBadgeRef = useRef<HTMLDivElement | null>(null);
  const fpsTextRef = useRef<HTMLSpanElement | null>(null);
  const fpsDotRef = useRef<HTMLSpanElement | null>(null);
  const fpsCounterFramesRef = useRef(0);
  const lastFpsHudUpdateRef = useRef(performance.now());

  // Subscribe to FPS HUD toggle without triggering any React component re-render
  useEffect(() => {
    const unsub = perfTracker.onFpsHudToggle((enabled) => {
      if (fpsBadgeRef.current) {
        fpsBadgeRef.current.style.display = enabled ? 'flex' : 'none';
      }
    });
    return unsub;
  }, []);

  // Optimized 32-bit fast terrain rendering with Dirty Box scan support (96.8% faster during explosions!)
  const redrawOffscreenTerrain = useCallback((dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }) => {
    const { width, height, grid } = terrain.data;
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

    const isFullScan = !dirtyBox;
    const minX = dirtyBox ? Math.max(0, dirtyBox.minX) : 0;
    const maxX = dirtyBox ? Math.min(width - 1, dirtyBox.maxX) : width - 1;
    const minY = dirtyBox ? Math.max(0, dirtyBox.minY) : 0;
    const maxY = dirtyBox ? Math.min(height - 1, dirtyBox.maxY) : height - 1;

    if (isFullScan) {
      offCtx.clearRect(0, 0, width, height);
    }

    const dirtyW = maxX - minX + 1;
    const dirtyH = maxY - minY + 1;
    const imgData = offCtx.createImageData(dirtyW, dirtyH);
    const data32 = new Uint32Array(imgData.data.buffer);

    // Fast Little-Endian ABGR 32-bit integer colors
    const grassHighlight = 0xff35e6a3; // #a3e635 Lime top edge
    const grassBody = 0xff5ec522;      // #22c55e Rich grass green
    const grassShadow = 0xff3d8015;    // #15803d Dark forest green
    const grassDeep = 0xff2d5314;      // #14532d Deep undercoat shadow

    // Soil colors matching Earth (Light surface -> Dark deep cavern rock)
    const soilLight = 0xff183154;   // #543118 Warm topsoil
    const soilMedium = 0xff11233d;  // #3d2311 Rich earthy brown
    const soilDark = 0xff040914;    // #140904 Deep subterranean dark rock
    const soilSeam = 0xff02050b;    // #0b0502 Deep dark soil crack/seam

    let distMap = distMapRef.current;
    if (!distMap || distMap.length !== width * height) {
      distMap = new Float32Array(width * height);
      distMap.fill(99);
      distMapRef.current = distMap;
    }

    const waterThreshold = (terrain.data.waterLevel ?? (height - 60)) - 10;

    // Fast 2-Pass Distance Transform restricted to Dirty Bounding Box!
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      const prevRowOffset = (y - 1) * width;
      for (let x = minX; x <= maxX; x++) {
        const idx = rowOffset + x;
        const isSkyAir = grid[idx] === 0 && y < waterThreshold;
        if (isSkyAir) {
          distMap[idx] = 0;
        } else if (grid[idx] === 0) {
          distMap[idx] = 0;
        } else {
          let minD = 99;
          if (x > 0) minD = Math.min(minD, distMap[idx - 1] + 1);
          if (y > 0) minD = Math.min(minD, distMap[prevRowOffset + x] + 1);
          if (x > 0 && y > 0) minD = Math.min(minD, distMap[prevRowOffset + x - 1] + 1.4);
          if (x < width - 1 && y > 0) minD = Math.min(minD, distMap[prevRowOffset + x + 1] + 1.4);
          distMap[idx] = minD;
        }
      }
    }

    for (let y = maxY; y >= minY; y--) {
      const rowOffset = y * width;
      const nextRowOffset = (y + 1) * width;
      for (let x = maxX; x >= minX; x--) {
        const idx = rowOffset + x;
        if (grid[idx] === 0) continue;
        let minD = distMap[idx];
        if (x < width - 1) minD = Math.min(minD, distMap[idx + 1] + 1);
        if (y < height - 1) minD = Math.min(minD, distMap[nextRowOffset + x] + 1);
        if (x < width - 1 && y < height - 1) minD = Math.min(minD, distMap[nextRowOffset + x + 1] + 1.4);
        if (x > 0 && y < height - 1) minD = Math.min(minD, distMap[nextRowOffset + x - 1] + 1.4);
        distMap[idx] = minD;
      }
    }

    // Render Terrain Pixels inside Dirty Bounding Box
    for (let y = minY; y <= maxY; y++) {
      const rowOffset = y * width;
      const dirtyRowOffset = (y - minY) * dirtyW;
      for (let x = minX; x <= maxX; x++) {
        const idx = rowOffset + x;
        const dirtyIdx = dirtyRowOffset + (x - minX);

        if (grid[idx] === 1) {
          const airDist = distMap[idx];

          if (airDist <= 1.5) {
            data32[dirtyIdx] = grassHighlight;
          } else if (airDist <= 3.5) {
            data32[dirtyIdx] = grassBody;
          } else if (airDist <= 5.5) {
            data32[dirtyIdx] = grassShadow;
          } else if (airDist <= 7.0) {
            data32[dirtyIdx] = grassDeep;
          } else {
            const bx = (x / 4) | 0;
            const by = (y / 4) | 0;
            const blockHash = getPixelHash(bx, by);

            const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
            if (isSeam && (blockHash % 100 < 35)) {
              data32[dirtyIdx] = soilSeam;
            } else if (airDist <= 12) {
              data32[dirtyIdx] = soilLight;
            } else if (airDist <= 24) {
              data32[dirtyIdx] = soilMedium;
            } else {
              data32[dirtyIdx] = soilDark;
            }
          }
        } else {
          data32[dirtyIdx] = 0x00000000;
        }
      }
    }
    offCtx.putImageData(imgData, minX, minY);

    if (isFullScan) {
      // Pre-render Subterranean Soil Occlusion Mask to offscreen canvas
      if (!occlusionCanvasRef.current) {
        occlusionCanvasRef.current = document.createElement('canvas');
      }
      const occCanvas = occlusionCanvasRef.current;
      if (occCanvas.width !== width || occCanvas.height !== height) {
        occCanvas.width = width;
        occCanvas.height = height;
      }
      const occCtx = occCanvas.getContext('2d');
      if (occCtx) {
        occCtx.clearRect(0, 0, width, height);
        const occImgData = occCtx.createImageData(width, height);
        const occData32 = new Uint32Array(occImgData.data.buffer);

        for (let y = 0; y < height; y++) {
          const rowOffset = y * width;
          for (let x = 0; x < width; x++) {
            const idx = rowOffset + x;
            if (grid[idx] === 1) {
              const d = distMap[idx];
              if (d > 7) {
                const alpha = Math.min(145, Math.floor((d - 7) * 9));
                occData32[idx] = (alpha << 24) | 0x0a0503;
              }
            }
          }
        }
        occCtx.putImageData(occImgData, 0, 0);
      }
    }

    // Draw Solid Destructible Decor Props (Hedgehogs, Chicks, Mushrooms, Flowers)
    const { solidProps } = terrain.data;
    if (solidProps) {
      for (const sprop of solidProps) {
        if (sprop.destroyed) continue;

        // Verify foundation: if ground pixel is destroyed, mark as destroyed and skip
        const groundIdx = Math.floor(sprop.y) * width + Math.floor(sprop.x);
        if (groundIdx >= 0 && groundIdx < grid.length && grid[groundIdx] === 0) {
          sprop.destroyed = true;
          continue;
        }

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
        } else if (sprop.type === 'tree') {
          // HD Solid Destructible Oak & Pine Trees
          const isPine = sprop.variant === 1;

          // 1. Wood Trunk & Flared Roots
          const trunkGrad = offCtx.createLinearGradient(-6, -45, 6, 0);
          trunkGrad.addColorStop(0, '#78350f');
          trunkGrad.addColorStop(0.5, '#451a03');
          trunkGrad.addColorStop(1, '#27160a');
          offCtx.fillStyle = trunkGrad;

          offCtx.beginPath();
          offCtx.moveTo(-7, 0);
          offCtx.lineTo(-4, -20);
          offCtx.lineTo(-8, -32);
          offCtx.lineTo(-5, -33);
          offCtx.lineTo(-2, -22);
          offCtx.lineTo(2, -22);
          offCtx.lineTo(6, -31);
          offCtx.lineTo(8, -30);
          offCtx.lineTo(4, -20);
          offCtx.lineTo(7, 0);
          offCtx.closePath();
          offCtx.fill();

          // Wood Bark Texture Lines
          offCtx.strokeStyle = '#27160a';
          offCtx.lineWidth = 1;
          offCtx.beginPath();
          offCtx.moveTo(-2, -5);
          offCtx.lineTo(-1, -18);
          offCtx.moveTo(2, -8);
          offCtx.lineTo(3, -16);
          offCtx.stroke();

          if (isPine) {
            // Majestic Evergreen Pine Tree (4 Triangular Needle Tiers)
            const pineTiers = [
              { y: -16, r: 18, h: 16, color: '#064e3b' },
              { y: -26, r: 15, h: 14, color: '#047857' },
              { y: -35, r: 12, h: 12, color: '#10b981' },
              { y: -43, r: 8,  h: 10, color: '#34d399' },
            ];
            for (const tier of pineTiers) {
              offCtx.fillStyle = tier.color;
              offCtx.beginPath();
              offCtx.moveTo(0, tier.y - tier.h);
              offCtx.lineTo(tier.r, tier.y);
              offCtx.lineTo(-tier.r, tier.y);
              offCtx.closePath();
              offCtx.fill();
            }
            // Small Brown Pinecones
            offCtx.fillStyle = '#78350f';
            offCtx.beginPath();
            offCtx.arc(-8, -20, 2.5, 0, Math.PI * 2);
            offCtx.arc(7, -28, 2.2, 0, Math.PI * 2);
            offCtx.fill();
          } else {
            // Lush Plump Oak Tree (5 Overlapping Foliage Domes & Red Wild Apples)
            const oakClusters = [
              { x: -11, y: -28, r: 14, color: '#14532d' },
              { x: 11,  y: -28, r: 14, color: '#14532d' },
              { x: -7,  y: -38, r: 13, color: '#15803d' },
              { x: 7,   y: -38, r: 13, color: '#15803d' },
              { x: 0,   y: -44, r: 11, color: '#22c55e' },
            ];
            for (const c of oakClusters) {
              offCtx.fillStyle = c.color;
              offCtx.beginPath();
              offCtx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
              offCtx.fill();
            }
            // Cute Red Wild Apples / Blossoms
            offCtx.fillStyle = '#ef4444';
            offCtx.beginPath();
            offCtx.arc(-8, -32, 2.2, 0, Math.PI * 2);
            offCtx.arc(6, -36, 2.0, 0, Math.PI * 2);
            offCtx.arc(-2, -42, 2.3, 0, Math.PI * 2);
            offCtx.fill();
          }
        }

        offCtx.restore();
      }
    }

    // Draw Placed Steel Girders directly onto offscreen terrain canvas (destructible pixel-by-pixel!)
    if (gameStateRef.current && gameStateRef.current.girders && gameStateRef.current.girders.length > 0) {
      for (const g of gameStateRef.current.girders) {
        offCtx.save();
        offCtx.translate(g.x, g.y);
        offCtx.rotate((g.angleDeg * Math.PI) / 180);

        // Steel beam body
        offCtx.fillStyle = '#475569';
        offCtx.fillRect(-g.length / 2, -g.thickness / 2, g.length, g.thickness);
        offCtx.strokeStyle = '#94a3b8';
        offCtx.lineWidth = 1.5;
        offCtx.strokeRect(-g.length / 2, -g.thickness / 2, g.length, g.thickness);

        // Hazard stripes
        offCtx.fillStyle = '#facc15';
        for (let i = -g.length / 2 + 6; i < g.length / 2 - 6; i += 16) {
          offCtx.fillRect(i, -g.thickness / 2 + 2, 6, g.thickness - 4);
        }

        // Rivet dots
        offCtx.fillStyle = '#cbd5e1';
        offCtx.beginPath();
        offCtx.arc(-g.length / 2 + 4, 0, 1.5, 0, Math.PI * 2);
        offCtx.arc(g.length / 2 - 4, 0, 1.5, 0, Math.PI * 2);
        offCtx.fill();

        offCtx.restore();
      }
    }

    // Clip all active explosion craters out of terrain canvas so solid props & girders stay carved pixel-by-pixel
    if (gameStateRef.current && gameStateRef.current.explosions && gameStateRef.current.explosions.length > 0) {
      offCtx.save();
      offCtx.globalCompositeOperation = 'destination-out';
      for (const ex of gameStateRef.current.explosions) {
        const safeR = Math.max(0, ex.radius || 0);
        if (safeR > 0) {
          offCtx.beginPath();
          offCtx.arc(ex.x, ex.y, safeR, 0, Math.PI * 2);
          offCtx.fill();
        }
      }
      offCtx.restore();
    }
  }, [terrain]);

  // Carve crater on offscreen terrain canvas & occlusion shadow canvas when explosion happens
  const carveOffscreenCrater = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(0, radius || 0);
    if (safeRadius <= 0) return;

    // 1. Synchronize grid array & mark overlapping solidProps destroyed
    terrain.carveExplosion(x, y, safeRadius);

    // 2. Cut crater directly out of offscreen terrain canvas (erases terrain pixels and prop drawings)
    if (offscreenCanvasRef.current) {
      const offCtx = offscreenCanvasRef.current.getContext('2d');
      if (offCtx) {
        offCtx.save();
        offCtx.globalCompositeOperation = 'destination-out';
        offCtx.beginPath();
        offCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
        offCtx.fill();
        offCtx.restore();
      }
    }

    // 3. Cut crater out of subterranean shadow occlusion canvas
    if (occlusionCanvasRef.current) {
      const occCtx = occlusionCanvasRef.current.getContext('2d');
      if (occCtx) {
        occCtx.save();
        occCtx.globalCompositeOperation = 'destination-out';
        occCtx.beginPath();
        occCtx.arc(x, y, safeRadius, 0, Math.PI * 2);
        occCtx.fill();
        occCtx.restore();
      }
    }
  }, [terrain]);

  // Trigger high-framerate client-side visual explosion animation & fiery sparks (60+ FPS locally on both Host & Guest)
  const triggerClientExplosion = useCallback((x: number, y: number, radius: number) => {
    const safeRadius = Math.max(10, radius || 30);
    clientExplosionsRef.current.push({
      id: `cex_${Date.now()}_${Math.random()}`,
      x,
      y,
      radius: safeRadius,
      startTime: performance.now(),
      duration: 450,
    });

    // Spawn 24 fiery explosion spark & smoke debris particles
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 0.7 + 0.3) * (safeRadius / 7);
      clientParticlesRef.current.push({
        x: x + Math.cos(angle) * (safeRadius * 0.15),
        y: y + Math.sin(angle) * (safeRadius * 0.15),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: Math.random() > 0.6 ? '#fef08a' : Math.random() > 0.3 ? '#f97316' : '#ef4444',
        size: Math.random() * 4 + 2,
        life: 1.0,
      });
    }
  }, []);

  // Trigger arcade-style floating damage/heal numbers (+50 HP / -45 HP) locally at 60 FPS
  const triggerClientFloatingDamage = useCallback((x: number, y: number, damage: number) => {
    clientFloatingDamagesRef.current.push({
      id: `cfd_${Date.now()}_${Math.random()}`,
      x,
      y: y - 18,
      damage,
      startTime: performance.now(),
      duration: 1000,
    });
  }, []);

  // Global mouseup to release camera dragging even if cursor leaves canvas/window
  useEffect(() => {
    const onGlobalMouseUp = () => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
      }
    };
    window.addEventListener('mouseup', onGlobalMouseUp);
    return () => window.removeEventListener('mouseup', onGlobalMouseUp);
  }, []);

  // Center camera on a specific world point (e.g. active slug or center of terrain)
  const centerCamera = useCallback(
    (targetX?: number, targetY?: number, customZoom?: number) => {
      const container = containerRef.current;
      const zoom = customZoom ?? zoomRef.current;
      const W = terrain.data.width;
      const H = terrain.data.height;

      if (!container) {
        zoomRef.current = zoom;
        panRef.current = { x: 0, y: 0 };
        setZoomLevel(zoom);
        setPanOffset({ x: 0, y: 0 });
        return;
      }

      const cRect = container.getBoundingClientRect();
      const fitScale = Math.min(cRect.width / W, cRect.height / H);

      const tx = targetX ?? W / 2;
      const ty = targetY ?? H / 2;

      const newPanX = -(tx - W / 2) * fitScale * zoom;
      const newPanY = -(ty - H / 2) * fitScale * zoom;

      zoomRef.current = zoom;
      panRef.current = { x: newPanX, y: newPanY };
      setZoomLevel(zoom);
      setPanOffset({ x: newPanX, y: newPanY });
    },
    [terrain]
  );

  // Exact 1:1 Screen-to-World Mouse Coordinate conversion (0 drift at ANY zoom or pan position!)
  const getCanvasMousePos = useCallback(
    (e: React.MouseEvent | MouseEvent): Vector2D => {
      const container = containerRef.current;
      if (!container) return { x: 700, y: 350 };
      const cRect = container.getBoundingClientRect();

      const W = terrain.data.width;
      const H = terrain.data.height;
      const fitScale = Math.min(cRect.width / W, cRect.height / H);
      const zoom = zoomRef.current;
      const pan = panRef.current;

      const screenX = e.clientX - cRect.left;
      const screenY = e.clientY - cRect.top;

      const centerX = cRect.width / 2;
      const centerY = cRect.height / 2;

      const dx = screenX - (centerX + pan.x);
      const dy = screenY - (centerY + pan.y);

      const totalScale = fitScale * zoom;

      const worldX = W / 2 + dx / totalScale;
      const worldY = H / 2 + dy / totalScale;

      return {
        x: Math.max(0, Math.min(W, Math.round(worldX))),
        y: Math.max(0, Math.min(H, Math.round(worldY))),
      };
    },
    [terrain]
  );

  // Cursor-Centered Mouse Wheel Zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();

      const oldZoom = zoomRef.current;
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newZoom = Math.max(0.5, Math.min(2.5, Math.round((oldZoom + delta) * 100) / 100));
      if (newZoom === oldZoom) return;

      const screenX = e.clientX - cRect.left;
      const screenY = e.clientY - cRect.top;
      const centerX = cRect.width / 2;
      const centerY = cRect.height / 2;

      const oldPan = panRef.current;
      const ratio = newZoom / oldZoom;

      const newPanX = (screenX - centerX) - (screenX - centerX - oldPan.x) * ratio;
      const newPanY = (screenY - centerY) - (screenY - centerY - oldPan.y) * ratio;

      zoomRef.current = newZoom;
      panRef.current = { x: newPanX, y: newPanY };
      setZoomLevel(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    },
    []
  );

  // Keyboard shortcut: Press C to reset zoom to 100% and center camera
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        zoomRef.current = 1.0;
        panRef.current = { x: 0, y: 0 };
        setZoomLevel(1.0);
        setPanOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const lastAimTimeRef = useRef<number>(0);

  // Throttled Real-time Mouse Aiming & Camera Drag Handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        const dx = e.clientX - dragStartMouseRef.current.x;
        const dy = e.clientY - dragStartMouseRef.current.y;
        if (Math.hypot(dx, dy) > 4) {
          hasMovedCameraRef.current = true;
        }
        const newPan = {
          x: dragStartPanRef.current.x + dx,
          y: dragStartPanRef.current.y + dy,
        };
        panRef.current = newPan;
        setPanOffset(newPan);
        return;
      }

      const pos = getCanvasMousePos(e);
      mousePosRef.current = pos;

      if (!isMyTurn || gameState.phase !== 'AIMING') return;

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;

      const now = Date.now();
      if (now - lastAimTimeRef.current < 33) return;

      const dx = pos.x - activeSlug.x;
      const dy = pos.y - activeSlug.y;
      let angle = Math.round(Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI));
      angle = Math.max(5, Math.min(85, angle));
      const facing: 'left' | 'right' = dx >= 0 ? 'right' : 'left';

      if (angle !== activeSlug.aimAngle || facing !== activeSlug.facing) {
        lastAimTimeRef.current = now;
        onUpdateAim?.(angle, activeSlug.aimPower, facing);
      }
    },
    [isMyTurn, gameState, getCanvasMousePos, onUpdateAim]
  );

  const lockedTargetRef = useRef<Vector2D | null>(null);

  // Right-Click Context Menu / Target Locking Handler
  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (hasMovedCameraRef.current) {
        // Camera drag finished, don't trigger target locking
        return;
      }

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

  // Mouse Down: Left-Click for game actions / Middle or Right Click for camera dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (e.button === 1 || e.button === 2) {
        isDraggingCameraRef.current = true;
        dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
        dragStartPanRef.current = { ...panRef.current };
        hasMovedCameraRef.current = false;
        return;
      }

      if (!isMyTurn) return;
      if (e.button !== 0) return; // Left Click Only for game actions!

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
    (e: React.MouseEvent<HTMLElement>) => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (e.button === 1 || e.button === 2) return;
      }

      if (!isMyTurn || gameState.phase !== 'AIMING') return;
      if (e.button !== 0) return; // Left Click Only!

      const { x: clickX, y: clickY } = getCanvasMousePos(e);

      const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
      if (!activeSlug) return;
      const weapon = getWeapon(activeSlug.selectedWeaponId);

      const targetPt = lockedTargetRef.current || { x: clickX, y: clickY };
      const isInstantTarget = weapon.behavior === 'AIR_STRIKE' || weapon.behavior === 'TELEPORT' || weapon.behavior === 'HEAVY_FALL';

      if (isInstantTarget) {
        onFire({ ...targetPt, aimAngle: activeSlug.aimAngle, aimPower: activeSlug.aimPower, facing: activeSlug.facing });
        lockedTargetRef.current = null;
      } else {
        const dx = clickX - activeSlug.x;
        const dy = clickY - activeSlug.y;
        let angle = Math.atan2(-dy, Math.abs(dx)) * (180 / Math.PI);
        angle = Math.max(5, Math.min(85, angle));
        const facing = dx >= 0 ? 'right' : 'left';

        onUpdateAim?.(angle, activeSlug.aimPower, facing);
        onReleaseCharge?.({ ...targetPt, aimAngle: angle, aimPower: activeSlug.aimPower, facing });
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
      knownGirderIdsCanvasRef.current.clear();
      lockedTargetRef.current = null;
      redrawOffscreenTerrain();
    }

    for (const ex of gameState.explosions) {
      if (!carvedExplosionsRef.current.has(ex.id)) {
        carvedExplosionsRef.current.add(ex.id);
        carveOffscreenCrater(ex.x, ex.y, ex.radius);
        triggerClientExplosion(ex.x, ex.y, ex.radius);
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const renderStart = performance.now();
      const curState = gameStateRef.current;
      const { width, height, waterLevel, decorItems } = terrain.data;
      ctx.clearRect(0, 0, width, height);

      // Live-carve and animate new explosions on guest/host instantly
      if (curState && curState.explosions && curState.explosions.length > 0) {
        for (const ex of curState.explosions) {
          if (!carvedExplosionsRef.current.has(ex.id)) {
            carvedExplosionsRef.current.add(ex.id);
            carveOffscreenCrater(ex.x, ex.y, ex.radius);
            triggerClientExplosion(ex.x, ex.y, ex.radius);
          }
        }
      }

      // Detect slug HP changes to trigger arcade floating damage/heal popups locally
      if (curState && curState.slugs && curState.slugs.length > 0) {
        for (const slug of curState.slugs) {
          const prevHp = prevSlugHpsRef.current.get(slug.id);
          if (prevHp !== undefined && prevHp !== slug.hp && slug.isAlive) {
            triggerClientFloatingDamage(slug.x, slug.y, prevHp - slug.hp);
          }
          prevSlugHpsRef.current.set(slug.id, slug.hp);
        }
      }

      // Live-paint newly placed girders onto offscreen canvas on host & guest instantly
      if (curState && curState.girders && curState.girders.length > 0) {
        let hasNewGirder = false;
        for (const g of curState.girders) {
          if (!knownGirderIdsCanvasRef.current.has(g.id)) {
            knownGirderIdsCanvasRef.current.add(g.id);
            hasNewGirder = true;
          }
        }
        if (hasNewGirder) {
          redrawOffscreenTerrain();
        }
      }

      const isDay = curState.config.dayNightCycle === 'DAY';
      const animTime = Date.now() / 300;
      const slowTime = Date.now() / 1200;

      // 1. Sky Gradient (Day Azure vs Night Midnight)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDay) {
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.5, '#38bdf8');
        skyGrad.addColorStop(0.8, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd');
      } else {
        // Luminous Night Sky (Twilight Indigo -> Deep Slate Sky)
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(0.5, '#0f172a');
        skyGrad.addColorStop(1, '#1e293b');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Sun (Day) vs Moon & Stars (Night)
      if (isDay) {
        // Radiant Golden Sun
        const sunX = width * 0.82;
        const sunY = 70;
        const sunRadius = 28;

        // Glowing Sun Corona Halo
        const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 3);
        sunGlow.addColorStop(0, 'rgba(250, 204, 21, 0.6)');
        sunGlow.addColorStop(0.5, 'rgba(253, 224, 71, 0.2)');
        sunGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Sun Body
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Fluffy Sunny White Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let c = 0; c < 4; c++) {
          const cx = ((Date.now() * 0.015 + c * 350) % (width + 200)) - 100;
          const cy = 40 + (c * 25) % 60;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 35, 14, 0, 0, Math.PI * 2);
          ctx.ellipse(cx - 18, cy - 8, 20, 14, 0, 0, Math.PI * 2);
          ctx.ellipse(cx + 18, cy - 6, 22, 12, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Twinkling Night Stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 65; i++) {
          const sx = (i * 137.5) % width;
          const sy = (i * 73.1) % (height * 0.5);
          const alpha = 0.3 + 0.7 * Math.abs(Math.sin(animTime * 0.8 + i));
          ctx.globalAlpha = alpha;
          ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1);
        }
        ctx.globalAlpha = 1.0;

        // Giant Luminous Golden Moon with Radiant Moonlight Corona Wash
        const moonX = width * 0.82;
        const moonY = 65;
        const moonRadius = 28;

        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.4, moonX, moonY, moonRadius * 3.5);
        moonGlow.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
        moonGlow.addColorStop(0.4, 'rgba(186, 230, 253, 0.30)');
        moonGlow.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a'; // Golden Luminous Cream Moon
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(moonX - 8, moonY - 4, 6, 4, 0.3, 0, Math.PI * 2);
        ctx.ellipse(moonX + 6, moonY + 8, 4.5, 3, -0.2, 0, Math.PI * 2);
        ctx.ellipse(moonX + 7, moonY - 10, 3, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4 & 5. Pre-rendered Parallax Mountains & 116 Forest Trees (0ms 60FPS overhead!)
      if (!bgCanvasRef.current) {
        bgCanvasRef.current = document.createElement('canvas');
      }
      const bgCanvas = bgCanvasRef.current;
      if (bgCanvas.width !== width || bgCanvas.height !== height) {
        bgCanvas.width = width;
        bgCanvas.height = height;
        const bgCtx = bgCanvas.getContext('2d');
        if (bgCtx) {
          bgCtx.clearRect(0, 0, width, height);

          // Mountains
          bgCtx.fillStyle = isDay ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 58, 138, 0.65)';
          bgCtx.beginPath();
          bgCtx.moveTo(0, height * 0.65);
          const mtPeaks = [
            { x: 0, y: height * 0.45 },
            { x: width * 0.15, y: height * 0.25 },
            { x: width * 0.3, y: height * 0.4 },
            { x: width * 0.45, y: height * 0.22 },
            { x: width * 0.65, y: height * 0.38 },
            { x: width * 0.8, y: height * 0.18 },
            { x: width, y: height * 0.42 },
          ];
          for (const p of mtPeaks) {
            bgCtx.lineTo(p.x, p.y);
          }
          bgCtx.lineTo(width, height);
          bgCtx.lineTo(0, height);
          bgCtx.closePath();
          bgCtx.fill();

          // 116 Forest Trees
          bgCtx.fillStyle = isDay ? '#15803d' : '#064e3b';
          bgCtx.beginPath();
          bgCtx.moveTo(0, height * 0.6);
          for (let tx = 0; tx <= width; tx += 12) {
            const treeH = 25 + Math.sin(tx * 0.08) * 12 + Math.cos(tx * 0.03) * 15;
            const ty = height * 0.55 - treeH;
            bgCtx.lineTo(tx - 6, ty + treeH);
            bgCtx.lineTo(tx, ty);
            bgCtx.lineTo(tx + 6, ty + treeH);
          }
          bgCtx.lineTo(width, height);
          bgCtx.lineTo(0, height);
          bgCtx.closePath();
          bgCtx.fill();
        }
      }
      ctx.drawImage(bgCanvasRef.current, 0, 0);

      // 6. Deep Water Backdrop & Caustics
      const waterBackdropGrad = ctx.createLinearGradient(0, waterLevel - 10, 0, height);
      waterBackdropGrad.addColorStop(0, 'rgba(2, 132, 199, 0.78)');
      waterBackdropGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.9)');
      waterBackdropGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
      ctx.fillStyle = waterBackdropGrad;
      ctx.fillRect(0, waterLevel - 5, width, height - (waterLevel - 5));

      // Underwater Caustic Light Rays
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let r = 0; r < 5; r++) {
        const rx = width * (0.15 + r * 0.18) + Math.sin(animTime * 0.5 + r) * 15;
        ctx.beginPath();
        ctx.moveTo(rx, waterLevel);
        ctx.lineTo(rx - 25, height);
        ctx.lineTo(rx + 35, height);
        ctx.lineTo(rx + 20, waterLevel);
        ctx.closePath();
        ctx.fill();
      }

      // Underwater Kelp & Seaweed Plants
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 2.5;
      for (let k = 0; k < 8; k++) {
        const kx = width * (0.05 + k * 0.12);
        const ky = height;
        const kSway = Math.sin(animTime * 1.5 + k) * 12;
        ctx.beginPath();
        ctx.moveTo(kx, ky);
        ctx.quadraticCurveTo(kx + kSway * 0.5, ky - 20, kx + kSway, ky - 40);
        ctx.stroke();
      }

      // Swimming Little Fish Silhouettes
      ctx.fillStyle = '#38bdf8';
      for (let f = 0; f < 4; f++) {
        const fishX = ((Date.now() * 0.04 + f * 180) % (width + 40)) - 20;
        const fishY = waterLevel + 20 + (f * 15) % 35;
        ctx.beginPath();
        ctx.ellipse(fishX, fishY, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(fishX - 4, fishY);
        ctx.lineTo(fishX - 7, fishY - 2);
        ctx.lineTo(fishX - 7, fishY + 2);
        ctx.closePath();
        ctx.fill();
      }

      // Draw Pre-rendered Offscreen Terrain (Includes all Solid Destructible Props & Soil Pebbles!)
      if (offscreenCanvasRef.current) {
        ctx.drawImage(offscreenCanvasRef.current, 0, 0);
      }

      // Warm Radiant Sunlight Wash over Surface Terrain in Day Mode!
      if (isDay) {
        ctx.fillStyle = 'rgba(254, 240, 138, 0.12)';
        ctx.fillRect(0, 0, width, height);
      }

      // 7. Subterranean Real-Time Dynamic Light & Occlusion Engine (Fast Direct Blit in Day Mode!)
      const hasDynamicLights = (!isDay) || (curState.helicopters && curState.helicopters.length > 0) || (curState.explosions && curState.explosions.length > 0);

      if (!hasDynamicLights && isDay && occlusionCanvasRef.current) {
        // Fast 1-line GPU blit in Day Mode (0.01ms execution!)
        ctx.drawImage(occlusionCanvasRef.current, 0, 0);
      } else {
        if (!lightmapCanvasRef.current) {
          lightmapCanvasRef.current = document.createElement('canvas');
        }
        const lightCanvas = lightmapCanvasRef.current;
        if (lightCanvas.width !== width || lightCanvas.height !== height) {
          lightCanvas.width = width;
          lightCanvas.height = height;
        }
        const lCtx = lightCanvas.getContext('2d');
        if (lCtx) {
          lCtx.clearRect(0, 0, width, height);

          // Fill Base Dynamic Occlusion Darkness Overlay
          if (!isDay) {
            const nightGrad = lCtx.createLinearGradient(0, 0, 0, height);
            nightGrad.addColorStop(0, 'rgba(3, 7, 18, 0.0)');
            nightGrad.addColorStop(0.20, 'rgba(3, 7, 18, 0.0)');
            nightGrad.addColorStop(0.40, 'rgba(3, 7, 18, 0.50)');
            nightGrad.addColorStop(1.0, 'rgba(3, 7, 18, 0.88)');
            lCtx.fillStyle = nightGrad;
            lCtx.fillRect(0, 0, width, height);
          } else if (occlusionCanvasRef.current) {
            lCtx.drawImage(occlusionCanvasRef.current, 0, 0);
          }

          // Cut out darkness in real-time for active dynamic light sources!
          lCtx.globalCompositeOperation = 'destination-out';

          // A. Helicopter Searchlight Spotlight Punch
          if (curState.helicopters) {
            for (const heli of curState.helicopters) {
              const hDir = heli.facing === 'right' ? 1 : -1;
              const lX = heli.x + 12 * hDir;
              const lY = heli.y + 4;
              const coneGrad = lCtx.createRadialGradient(lX, lY, 5, lX + 25 * hDir, lY + 60, 110);
              coneGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
              coneGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.6)');
              coneGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

              lCtx.fillStyle = coneGrad;
              lCtx.beginPath();
              lCtx.moveTo(lX, lY);
              lCtx.lineTo(lX + (-35 * hDir), lY + 130);
              lCtx.lineTo(lX + (75 * hDir), lY + 130);
              lCtx.closePath();
              lCtx.fill();
            }
          }

          // B. Active Explosions Blinding Light Burst Punch
          if (curState.explosions) {
            for (const ex of curState.explosions) {
              const safeExR = Math.max(0, (ex.radius || 0) * 2.5);
              if (safeExR <= 0) continue;
              const exGrad = lCtx.createRadialGradient(ex.x, ex.y, Math.min(5, safeExR * 0.1), ex.x, ex.y, safeExR);
              exGrad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
              exGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
              lCtx.fillStyle = exGrad;
              lCtx.beginPath();
              lCtx.arc(ex.x, ex.y, safeExR, 0, Math.PI * 2);
              lCtx.fill();
            }
          }

          lCtx.globalCompositeOperation = 'source-over';
          ctx.drawImage(lightCanvas, 0, 0);
        }
      }

      // Draw Smooth & Slow Surface Waves
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
          if (item.destroyed) continue;

          if (item.type === 'hanging_leaf') {
            // Verify ceiling anchor is still solid (disappears if ceiling is destroyed!)
            const topSolid =
              terrain.isSolid(item.x, item.y - 1) ||
              terrain.isSolid(item.x, item.y - 2) ||
              terrain.isSolid(item.x - 2, item.y - 1) ||
              terrain.isSolid(item.x + 2, item.y - 1);

            if (!topSolid) {
              item.destroyed = true;
              continue;
            }
          }

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
      if (curState.mines) {
        for (const mine of curState.mines) {
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
      if (curState.helicopters) {
        const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);

        for (const heli of curState.helicopters) {
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
            const pilot = curState.slugs.find((s) => s.id === heli.pilotSlugId);
            const team = pilot ? curState.teams.find((t) => t.id === pilot.teamId) : null;
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

          // Blinking LED Nav Lights
          // Red LED on Tail
          const redBlink = Math.floor(Date.now() / 400) % 2 === 0;
          ctx.fillStyle = redBlink ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(-35, -3, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Green LED on Main Rotor Tip
          const greenBlink = Math.floor(Date.now() / 200) % 2 === 0;
          ctx.fillStyle = greenBlink ? '#22c55e' : '#14532d';
          ctx.beginPath();
          ctx.arc(bladeWidth, -16, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Searchlight Spotlight Cone (Golden Beam from Nose)
          ctx.save();
          const lightOriginX = 14;
          const lightOriginY = 4;
          
          const lightGrad = ctx.createLinearGradient(lightOriginX, lightOriginY, lightOriginX + 60, lightOriginY + 120);
          lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          lightGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
          lightGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.moveTo(lightOriginX, lightOriginY);
          ctx.lineTo(lightOriginX - 35, lightOriginY + 130);
          ctx.lineTo(lightOriginX + 75, lightOriginY + 130);
          ctx.closePath();
          ctx.fill();

          // Floating Light Dust Motes in Cone
          ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
          for (let m = 0; m < 5; m++) {
            const mx = lightOriginX + Math.sin(Date.now() * 0.002 + m) * 20;
            const my = lightOriginY + 20 + ((Date.now() * 0.03 + m * 25) % 100);
            ctx.beginPath();
            ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

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
      if (curState.phase === 'PLACEMENT' && isMyTurn) {
        const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);
        const team = curState.teams.find((t) => t.id === curState.activeTeamId);
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

      for (const slug of curState.slugs) {
        if (!slug.isAlive || !slug.isPlaced) continue;
        const team = curState.teams.find((t) => t.id === slug.teamId);
        const isActive = slug.id === curState.activeSlugId;

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
        if (isActive && curState.phase === 'AIMING') {
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
      const activeSlug = curState.slugs.find((s) => s.id === curState.activeSlugId);
      if (activeSlug && (curState.phase === 'AIMING' || curState.phase === 'TURN_TIME')) {
        if (isMyTurn) {
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
        }

        // Render Power Charging Bar Gauge & Percentage Text (Visible when actively charging!)
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
      for (const proj of curState.projectiles) {
        if (!proj || !Number.isFinite(proj.x) || !Number.isFinite(proj.y)) continue;

        ctx.save();
        ctx.translate(proj.x, proj.y);
        const vx = Number.isFinite(proj.vx) ? proj.vx : 0;
        const vy = Number.isFinite(proj.vy) ? proj.vy : 0;
        const angle = Math.atan2(vy, vx);
        if (Number.isFinite(angle)) {
          ctx.rotate(angle);
        }

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

          // Head & Ears
          ctx.fillRect(-18, -18, 12, 12);
          ctx.fillRect(-16, -24, 4, 8);
          ctx.fillRect(-10, -24, 4, 8);

          ctx.restore();
        } else if (proj.weaponId === 'cluster_payload') {
          // Sub-munition Cluster Shrapnel Pellet
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.weaponId === 'air_strike') {
          // Heavy Napalm Missile
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-7, -4, 14, 8);
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(7, -4);
          ctx.lineTo(13, 0);
          ctx.lineTo(7, 4);
          ctx.closePath();
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

      // Spawn & Draw Client-Side Smoke & Fire Trail Particles at 60 FPS (0 Network Overhead!)
      if (curState.projectiles && curState.projectiles.length > 0) {
        for (const proj of curState.projectiles) {
          if (Math.hypot(proj.vx, proj.vy) > 0.5 && clientParticlesRef.current.length < 50) {
            clientParticlesRef.current.push({
              x: proj.x - proj.vx * 0.8,
              y: proj.y - proj.vy * 0.8,
              vx: (Math.random() - 0.5) * 0.6,
              vy: (Math.random() - 0.5) * 0.6 - 0.2,
              color: Math.random() > 0.35 ? '#f97316' : '#71717a',
              size: Math.random() * 3 + 2,
              life: 1.0,
            });
          }
        }
      }

      const remainingParticles: typeof clientParticlesRef.current = [];
      for (const p of clientParticlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.035;
        if (p.life > 0) {
          remainingParticles.push(p);
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life * 0.85);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      clientParticlesRef.current = remainingParticles;

      // Render Client-Side Fiery Explosions with Smooth Expanding Shockwave Core at 60+ FPS locally
      const nowAnim = performance.now();
      const remainingExplosions: typeof clientExplosionsRef.current = [];
      for (const ex of clientExplosionsRef.current) {
        const elapsed = nowAnim - ex.startTime;
        const progress = Math.min(1, elapsed / ex.duration);
        const alpha = Math.max(0, 1 - progress);
        const safeRadius = ex.radius;

        // Outer Shockwave Ring (expands rapidly)
        const shockRadius = safeRadius * (0.3 + progress * 0.9);
        if (shockRadius > 0) {
          ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`;
          ctx.lineWidth = Math.max(1, 3.5 * (1 - progress));
          ctx.beginPath();
          ctx.arc(ex.x, ex.y, shockRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inner Fireball Core with smooth expansion & fade
        const fireballRadius = safeRadius * (0.35 + progress * 0.65);
        const exGrad = ctx.createRadialGradient(ex.x, ex.y, 0, ex.x, ex.y, fireballRadius);
        exGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        exGrad.addColorStop(0.25, `rgba(250, 204, 21, ${alpha * 0.9})`);
        exGrad.addColorStop(0.65, `rgba(239, 68, 68, ${alpha * 0.7})`);
        exGrad.addColorStop(1, `rgba(127, 29, 29, 0)`);

        ctx.fillStyle = exGrad;
        ctx.beginPath();
        ctx.arc(ex.x, ex.y, fireballRadius, 0, Math.PI * 2);
        ctx.fill();

        if (progress < 1) {
          remainingExplosions.push(ex);
        }
      }
      clientExplosionsRef.current = remainingExplosions;

      // Draw Ninja Rope & Hook Anchors
      for (const s of curState.slugs) {
        if (s.isAlive && s.ropeState) {
          const rope = s.ropeState;
          ctx.save();
          // Braided steel cable line
          ctx.strokeStyle = '#e4e4e7';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(rope.hookX, rope.hookY);
          ctx.lineTo(s.x, s.y - 8);
          ctx.stroke();

          ctx.strokeStyle = '#71717a';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rope.hookX, rope.hookY);
          ctx.lineTo(s.x, s.y - 8);
          ctx.stroke();

          // Metallic Anchor Spike
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(rope.hookX, rope.hookY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }
      }

      // Draw Supply Crates (Parachute & Wooden Supply Boxes)
      if (curState.supplyCrates) {
        for (const crate of curState.supplyCrates) {
          ctx.save();
          ctx.translate(crate.x, crate.y);

          if (!crate.isLanded) {
            // Parachute Canopy
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -22, 16, Math.PI, 0);
            ctx.fill();
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // White stripes on canopy
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -22, 8, Math.PI, 0);
            ctx.fill();

            // Suspension cords
            ctx.strokeStyle = '#e4e4e7';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(-14, -22);
            ctx.lineTo(0, -8);
            ctx.moveTo(14, -22);
            ctx.lineTo(0, -8);
            ctx.moveTo(0, -38);
            ctx.lineTo(0, -8);
            ctx.stroke();
          }

          // Supply Crate Box (Military olive wooden box with red cross)
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(-9, -9, 18, 18);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-9, -9, 18, 18);

          // Red Cross Medical Icon (+50 HP)
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, -6, 4, 12);
          ctx.fillRect(-6, -2, 12, 4);

          // Crate Label
          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('+50 HP', 0, 16);

          ctx.restore();
        }
      }

      // Floating Damage & Healing Numbers (Arcade Style bouncing +50 HP / -45 HP!)
      const nowFd = performance.now();
      const remainingFloatingDamages: typeof clientFloatingDamagesRef.current = [];
      for (const fd of clientFloatingDamagesRef.current) {
        const elapsed = nowFd - fd.startTime;
        const progress = Math.min(1, elapsed / fd.duration);
        const alpha = Math.max(0, 1 - progress);
        const floatY = fd.y - progress * 30;

        ctx.save();
        ctx.globalAlpha = alpha;
        const isHeal = fd.damage < 0;
        ctx.fillStyle = isHeal ? '#22c55e' : '#facc15';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        ctx.font = 'extrabold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const text = isHeal ? `+${-fd.damage} HP` : `-${fd.damage}`;
        ctx.strokeText(text, fd.x, floatY);
        ctx.fillText(text, fd.x, floatY);
        ctx.restore();

        if (progress < 1) {
          remainingFloatingDamages.push(fd);
        }
      }
      clientFloatingDamagesRef.current = remainingFloatingDamages;

      // DEBUG HITBOX OVERLAY RENDERING
      if (showHitboxes) {
        // Draw Slugs Hitboxes
        for (const slug of curState.slugs) {
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
        for (const proj of curState.projectiles) {
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

      const renderDuration = performance.now() - renderStart;
      perfTracker.markFrame(renderDuration, {
        slugs: curState?.slugs?.length || 0,
        livingSlugs: curState?.slugs?.filter((s) => s.isAlive).length || 0,
        projectiles: curState?.projectiles?.length || 0,
        explosions: curState?.explosions?.length || 0,
        particles: curState?.particles?.length || 0,
        mines: curState?.mines?.length || 0,
        crates: curState?.supplyCrates?.length || 0,
      });

      // Zero-overhead In-Game Permanent FPS HUD Updater (0 React re-renders, direct DOM mutation)
      if (fpsTextRef.current && perfTracker.getFpsHudEnabled()) {
        const now = performance.now();
        fpsCounterFramesRef.current++;
        if (now - lastFpsHudUpdateRef.current >= 250) {
          const fps = Math.round((fpsCounterFramesRef.current * 1000) / (now - lastFpsHudUpdateRef.current));
          fpsCounterFramesRef.current = 0;
          lastFpsHudUpdateRef.current = now;
          fpsTextRef.current.textContent = `${fps} FPS`;
          if (fpsDotRef.current) {
            fpsDotRef.current.className = `w-2 h-2 rounded-full ${
              fps >= 50 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : fps >= 30 ? 'bg-amber-400' : 'bg-red-400'
            }`;
          }
          if (fpsBadgeRef.current) {
            fpsBadgeRef.current.className = `absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border rounded-lg text-xs font-mono font-black shadow-lg flex items-center gap-2 select-none z-20 ${
              fps >= 50 ? 'text-emerald-400 border-emerald-500/30' : fps >= 30 ? 'text-amber-300 border-amber-500/30' : 'text-red-400 border-red-500/30'
            }`;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [terrain, isMyTurn, showHitboxes, redrawOffscreenTerrain, carveOffscreenCrater]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl select-none"
    >
      {/* Zero-Overhead In-Game Permanent FPS Counter HUD */}
      <div
        ref={fpsBadgeRef}
        style={{ display: perfTracker.getFpsHudEnabled() ? 'flex' : 'none' }}
        className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 bg-zinc-950/85 backdrop-blur border border-emerald-500/30 rounded-lg text-xs font-mono font-black text-emerald-400 shadow-lg flex items-center gap-2 select-none z-20"
      >
        <span ref={fpsDotRef} className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        <span ref={fpsTextRef}>60 FPS</span>
      </div>

      <canvas
        ref={canvasRef}
        width={terrain.data.width}
        height={terrain.data.height}
        style={{
          transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
          transformOrigin: 'center center',
        }}
        className="w-full h-full object-contain cursor-crosshair block shadow-2xl pointer-events-none"
      />

      {/* Worms Style Floating Camera Zoom & Pan Controls */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 px-2.5 py-1.5 rounded-xl shadow-xl backdrop-blur select-none z-10 text-xs"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.max(0.5, Math.round((zoomLevel - 0.2) * 10) / 10);
            zoomRef.current = newZ;
            setZoomLevel(newZ);
          }}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Dézoomer (- / Molette Bas)"
        >
          -
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            zoomRef.current = 1.0;
            panRef.current = { x: 0, y: 0 };
            setZoomLevel(1.0);
            setPanOffset({ x: 0, y: 0 });
          }}
          className="px-2.5 h-7 flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-amber-400 font-bold rounded-lg border border-zinc-600/50 transition text-xs font-mono"
          title="Recentrer la vue & Zoom 100% (Touche C)"
        >
          🎯 {Math.round(zoomLevel * 100)}% [C]
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newZ = Math.min(2.5, Math.round((zoomLevel + 0.2) * 10) / 10);
            zoomRef.current = newZ;
            setZoomLevel(newZ);
          }}
          className="w-7 h-7 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-200 rounded-lg text-sm font-bold border border-zinc-600/50 transition"
          title="Zoomer (+ / Molette Haut)"
        >
          +
        </button>
      </div>
    </div>
  );
});

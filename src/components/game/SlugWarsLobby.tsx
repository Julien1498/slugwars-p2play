import React, { useRef, useEffect } from 'react';
import { GameConfig, Team, MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../core/types';
import { generateProceduralTerrain } from '../../core/terrainGenerator';
import { WEAPON_SETS } from '../../core/weapons/weaponSets';
import { RoomCodeBadge } from 'p2play-core';
import { Dices, Play, RefreshCw, Sparkles, Swords, Rocket, Users, Layers } from 'lucide-react';

interface SlugWarsLobbyProps {
  isHost: boolean;
  myPeerId: string;
  hostPeerId: string;
  config: GameConfig;
  teams: Team[];
  isEmbedded?: boolean;
  onExit?: () => void;
  onChangeConfig: (partial: Partial<GameConfig>) => void;
  onStartGame: () => void;
}

const MAP_THEMES: { id: MapTheme; label: string; icon: string; desc: string }[] = [
  { id: 'ISLAND', label: 'Île Tropicale', icon: '🏝️', desc: 'Collines ouvertes & lagons' },
  { id: 'CAVERN', label: 'Grotte Caverne', icon: '🦇', desc: 'Plafond rocheux & tunnels' },
  { id: 'FORTRESS', label: 'Deux Forteresses', icon: '🏰', desc: 'Canyons & châteaux' },
  { id: 'FLOATING_CHAOS', label: 'Archipel Flottant', icon: '🏝️', desc: 'Îlots suspendus & ciel azur' },
];

// --- SAFE CANVAS DRAWING UTILITIES ---
const drawRoundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 4
) => {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + w - radius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + radius);
  c.lineTo(x + w, y + h - radius);
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  c.lineTo(x + radius, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
};

const drawSafeEllipse = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number = 0,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2
) => {
  const safeRx = Math.max(0.1, Math.abs(rx));
  const safeRy = Math.max(0.1, Math.abs(ry));
  c.beginPath();
  c.ellipse(x, y, safeRx, safeRy, rot, startAngle, endAngle);
};

// --- MINI RADAR TERRAIN PREVIEW ---
const MapThumbnailPreview: React.FC<{ theme: MapTheme; size: MapSize; seed: number }> = ({ theme, size, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCfg = MAP_SIZE_CONFIGS[size || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  // Real Terrain Aspect Ratio
  const targetRatio = (sizeCfg.width || 1400) / (sizeCfg.height || 800);
  const canvasWidth = 480;
  const canvasHeight = Math.round(canvasWidth / targetRatio);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = canvas.width;
    const previewH = canvas.height;

    const terrain = generateProceduralTerrain(seed, theme, sizeCfg.width, sizeCfg.height);
    const { grid, width, height, waterLevel } = terrain;

    // Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, previewH);
    if (theme === 'ISLAND' || theme === 'FLOATING_CHAOS') {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.7, '#93c5fd');
      skyGrad.addColorStop(1, '#60a5fa');
    } else if (theme === 'CAVERN') {
      skyGrad.addColorStop(0, '#0f172a');
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#312e81');
    } else if (theme === 'FORTRESS') {
      skyGrad.addColorStop(0, '#ea580c');
      skyGrad.addColorStop(0.5, '#9a3412');
      skyGrad.addColorStop(1, '#431407');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, previewW, previewH);

    // Terrain Surface & Rock
    const imgData = ctx.createImageData(previewW, previewH);
    const data = imgData.data;

    const grassR = theme === 'ISLAND' ? 34 : theme === 'CAVERN' ? 71 : theme === 'FORTRESS' ? 132 : 168;
    const grassG = theme === 'ISLAND' ? 197 : theme === 'CAVERN' ? 85 : theme === 'FORTRESS' ? 204 : 85;
    const grassB = theme === 'ISLAND' ? 94 : theme === 'CAVERN' ? 105 : theme === 'FORTRESS' ? 22 : 247;

    const rockR = theme === 'ISLAND' ? 120 : theme === 'CAVERN' ? 30 : theme === 'FORTRESS' ? 82 : 46;
    const rockG = theme === 'ISLAND' ? 53 : theme === 'CAVERN' ? 27 : theme === 'FORTRESS' ? 82 : 16;
    const rockB = theme === 'ISLAND' ? 15 : theme === 'CAVERN' ? 75 : theme === 'FORTRESS' ? 91 : 101;

    for (let py = 0; py < previewH; py++) {
      const srcY = Math.floor((py / previewH) * height);
      for (let px = 0; px < previewW; px++) {
        const srcX = Math.floor((px / previewW) * width);
        const isSolid = grid[srcY * width + srcX] === 1;

        if (isSolid) {
          const idx = (py * previewW + px) * 4;
          const isAboveSolid = srcY > 0 && grid[(srcY - 1) * width + srcX] === 1;
          if (!isAboveSolid) {
            data[idx] = grassR;
            data[idx + 1] = grassG;
            data[idx + 2] = grassB;
            data[idx + 3] = 255;
          } else {
            data[idx] = rockR;
            data[idx + 1] = rockG;
            data[idx + 2] = rockB;
            data[idx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Water Surface
    const waterCanvasY = (waterLevel / height) * previewH;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
    ctx.fillRect(0, waterCanvasY, previewW, previewH - waterCanvasY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, waterCanvasY);
    ctx.lineTo(previewW, waterCanvasY);
    ctx.stroke();

    // Subtle Tactical Grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 35; gx < previewW; gx += 35) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, previewH);
      ctx.stroke();
    }
    for (let gy = 25; gy < previewH; gy += 25) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(previewW, gy);
      ctx.stroke();
    }
  }, [theme, sizeCfg.width, sizeCfg.height, seed, canvasWidth, canvasHeight]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-zinc-950 shadow-inner group">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-[140px] block object-contain bg-zinc-950"
      />
      
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-white/15 text-[9px] font-mono text-zinc-200 shadow flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SEED #{seed}</span>
      </div>

      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-violet-500/40 text-[9px] font-bold text-violet-300 shadow flex items-center gap-1.5">
        <span>{sizeCfg.icon}</span>
        <span>{sizeCfg.label} ({sizeCfg.width}×{sizeCfg.height})</span>
      </div>
    </div>
  );
};

export const SlugWarsLobby: React.FC<SlugWarsLobbyProps> = ({
  isHost,
  myPeerId,
  hostPeerId,
  config,
  teams,
  isEmbedded,
  onExit,
  onChangeConfig,
  onStartGame,
}) => {
  const backdropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentSizeCfg = MAP_SIZE_CONFIGS[config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  // --- DYNAMIC TACTICAL WAR ROOM & FORTIFIED OUTPOST BACKDROP CANVAS (RESTORED MILITARY POSTS) ---
  useEffect(() => {
    const canvas = backdropCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Stars & Particles
    const stars = Array.from({ length: 55 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.65),
      size: Math.random() * 2 + 0.6,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    // Floating Nebula Clouds
    const nebulaClouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: 30 + Math.random() * (height * 0.35),
      speed: 0.1 + Math.random() * 0.2,
      size: 55 + Math.random() * 65,
      opacity: 0.12 + Math.random() * 0.15,
    }));

    // Mortar Flares
    interface Flare {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      trail: { x: number; y: number; alpha: number }[];
    }
    const flares: Flare[] = [];

    let t = 0;

    // --- HELPER: DRAW DETAILED TACTICAL SLUG ---
    const drawTacticalSlug = (
      c: CanvasRenderingContext2D,
      scale: number,
      gear: 'NIGHT_VISION' | 'RADIO_COMM',
      facingRight: boolean = true
    ) => {
      c.save();
      c.scale(facingRight ? scale : -scale, scale);

      // Body drop shadow
      c.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawSafeEllipse(c, 0, 16, 22, 6);
      c.fill();

      // Main Slug Body
      const bodyGrad = c.createRadialGradient(-3, -3, 3, 0, 5, 24);
      bodyGrad.addColorStop(0, '#fbcfe8');
      bodyGrad.addColorStop(0.45, '#ec4899');
      bodyGrad.addColorStop(1, '#831843');

      c.fillStyle = bodyGrad;
      c.strokeStyle = '#18181b';
      c.lineWidth = 2.4;
      c.beginPath();
      c.moveTo(-20, 14);
      c.quadraticCurveTo(-24, 2, -12, -8);
      c.quadraticCurveTo(-2, -20, 14, -12);
      c.quadraticCurveTo(24, 2, 20, 14);
      c.quadraticCurveTo(0, 19, -20, 14);
      c.closePath();
      c.fill();
      c.stroke();

      // Eyestalks
      c.strokeStyle = '#ec4899';
      c.lineWidth = 3.5;
      c.beginPath();
      c.moveTo(2, -8);
      c.lineTo(3, -15);
      c.moveTo(11, -6);
      c.lineTo(13, -13);
      c.stroke();

      // Eyes
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#18181b';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(3, -15, 7, 0, Math.PI * 2);
      c.arc(13, -13, 6, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Pupils looking around
      const pupilShift = Math.sin(t * 1.8) * 1.8;
      c.fillStyle = '#09090b';
      c.beginPath();
      c.arc(4 + pupilShift, -15, 2.8, 0, Math.PI * 2);
      c.arc(14 + pupilShift, -13, 2.4, 0, Math.PI * 2);
      c.fill();

      // Light Glints
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(3 + pupilShift, -16.5, 1.2, 0, Math.PI * 2);
      c.arc(13 + pupilShift, -14.5, 1, 0, Math.PI * 2);
      c.fill();

      if (gear === 'NIGHT_VISION') {
        // High-tech Dual Night Vision Goggles
        c.fillStyle = '#1e293b';
        c.strokeStyle = '#18181b';
        c.lineWidth = 2;
        drawRoundRect(c, -3, -19, 11, 9, 3);
        c.fill();
        c.stroke();
        drawRoundRect(c, 8, -17, 10, 8, 3);
        c.fill();
        c.stroke();

        // Luminous Neon Emerald Laser Lenses
        c.fillStyle = '#10b981';
        c.beginPath();
        c.arc(2.5, -14.5, 3, 0, Math.PI * 2);
        c.arc(13, -13, 2.6, 0, Math.PI * 2);
        c.fill();
        // Glowing laser dots
        c.fillStyle = '#6ee7b7';
        c.beginPath();
        c.arc(2.5, -14.5, 1.2, 0, Math.PI * 2);
        c.arc(13, -13, 1, 0, Math.PI * 2);
        c.fill();
      } else if (gear === 'RADIO_COMM') {
        // Radio Headset & Long Tactical Antenna
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.4;
        c.beginPath();
        c.arc(8, -14, 12, -Math.PI * 0.7, -Math.PI * 0.1);
        c.stroke();

        // Antenna Mast
        c.strokeStyle = '#e4e4e7';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-10, 4);
        c.lineTo(-24, -28);
        c.stroke();

        // Blinking Red Transmitter Beacon
        c.fillStyle = Math.sin(t * 7) > 0 ? '#ef4444' : '#991b1b';
        c.beginPath();
        c.arc(-24, -28, 3.8, 0, Math.PI * 2);
        c.fill();
        if (Math.sin(t * 7) > 0) {
          c.strokeStyle = 'rgba(239, 68, 68, 0.4)';
          c.lineWidth = 1.5;
          c.beginPath();
          c.arc(-24, -28, 8, 0, Math.PI * 2);
          c.stroke();
        }
      }

      c.restore();
    };

    // --- HELPER: DRAW FORTIFIED BASTION / OUTPOST LEDGE ---
    const drawFortifiedBastion = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      title: string,
      accentColor: string
    ) => {
      c.save();
      c.translate(x, y);

      // Heavy Concrete Bunker Base
      c.fillStyle = '#1e1e24';
      c.strokeStyle = '#09090b';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-w / 2, 0);
      c.lineTo(-w / 2 - 12, h);
      c.lineTo(w / 2 + 12, h);
      c.lineTo(w / 2, 0);
      c.closePath();
      c.fill();
      c.stroke();

      // Steel Riveted Plates Detail
      c.strokeStyle = '#3f3f46';
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(-w / 2 + 15, 12);
      c.lineTo(w / 2 - 15, 12);
      c.moveTo(-w / 2 + 10, h - 15);
      c.lineTo(w / 2 - 10, h - 15);
      c.stroke();

      // Glowing Slit Observation Window
      c.fillStyle = accentColor;
      c.shadowColor = accentColor;
      c.shadowBlur = 8;
      drawRoundRect(c, -w * 0.25, 18, w * 0.5, 6, 2);
      c.fill();
      c.shadowBlur = 0;

      // Platform Top Deck (Grass / Metal Grid)
      c.fillStyle = '#15803d';
      drawRoundRect(c, -w / 2 - 6, -6, w + 12, 12, 5);
      c.fill();
      c.fillStyle = '#22c55e';
      drawRoundRect(c, -w / 2 - 4, -6, w + 8, 6, 3);
      c.fill();

      // Safety Railing with Warning Stripes
      c.strokeStyle = '#eab308';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-w / 2 + 8, -6);
      c.lineTo(-w / 2 + 8, -18);
      c.moveTo(w / 2 - 8, -6);
      c.lineTo(w / 2 - 8, -18);
      c.moveTo(-w / 2 + 4, -16);
      c.lineTo(w / 2 - 4, -16);
      c.stroke();

      // Tactical Station Label Badge
      c.fillStyle = 'rgba(0, 0, 0, 0.85)';
      drawRoundRect(c, -38, h - 10, 76, 15, 4);
      c.fill();
      c.fillStyle = '#a1a1aa';
      c.font = 'bold 9px monospace';
      c.textAlign = 'center';
      c.fillText(title, 0, h + 1);

      c.restore();
    };

    const renderBackdrop = () => {
      animId = requestAnimationFrame(renderBackdrop);
      t += 0.025;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Nocturnal Sci-Fi War Room Sky Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#06060c');
        sky.addColorStop(0.35, '#120924');
        sky.addColorStop(0.7, '#240e46');
        sky.addColorStop(1, '#09090f');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars
        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(192, 132, 252, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Floating Nebula Clouds
        for (const cloud of nebulaClouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Distant Mountain Silhouette Ridges across entire width (Extended bounds to eliminate right-side slit/seam)
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

        // Green Dotted Grass Blade Dashes on foreground hills (Matching connection screen aesthetic!)
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = -10; x <= width + 20; x += 14) {
          const by = height * 0.85 + Math.sin(x * 0.004 + 2.1) * 35;
          ctx.moveTo(x, by);
          ctx.lineTo(x + 2, by - 4.5);
        }
        ctx.stroke();

        // 5. LEFT FLANKING FORTIFIED BASTION & SENTRY SLUG (Prominently visible flanking the cards)
        const leftBastionX = Math.max(90, Math.min(width * 0.12, 220));
        const leftBastionY = Math.max(260, height * 0.52);

        // Fortified Bunker Structure
        drawFortifiedBastion(ctx, leftBastionX, leftBastionY + 20, 150, 95, 'POSTE OBSERV.', '#10b981');

        // Sentry Slug with Night Vision on the Bunker
        ctx.save();
        ctx.translate(leftBastionX - 15, leftBastionY);
        drawTacticalSlug(ctx, 1.25, 'NIGHT_VISION', true);
        ctx.restore();

        // Searchlight Mounted on Left Watchtower
        const searchlightX = leftBastionX + 35;
        const searchlightY = leftBastionY - 14;
        const sweepAngle = -Math.PI * 0.35 + Math.sin(t * 0.9) * 0.55;

        // Searchlight Housing
        ctx.save();
        ctx.translate(searchlightX, searchlightY);
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Volumetric Beam
        ctx.rotate(sweepAngle);
        const beamGrad = ctx.createRadialGradient(0, 0, 5, 0, -height * 0.85, height * 0.65);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
        beamGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.22)');
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-80, -height * 0.85);
        ctx.lineTo(80, -height * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 6. RIGHT FLANKING COMMUNICATIONS OUTPOST & RADIO OPERATOR SLUG
        const rightBastionX = Math.max(width - 220, width * 0.88);
        const rightBastionY = Math.max(260, height * 0.52);

        // Fortified Bunker Structure
        drawFortifiedBastion(ctx, rightBastionX, rightBastionY + 20, 150, 95, 'TRANSMISSIONS', '#38bdf8');

        // Radio Operator Slug
        ctx.save();
        ctx.translate(rightBastionX + 15, rightBastionY);
        drawTacticalSlug(ctx, 1.25, 'RADIO_COMM', false);
        ctx.restore();

        // Spinning Tactical Radar Dish on Right Outpost
        const radarX = rightBastionX - 35;
        const radarY = rightBastionY - 14;
        const radarAngle = t * 3;

        ctx.save();
        ctx.translate(radarX, radarY);
        // Radar Tripod
        ctx.strokeStyle = '#71717a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-6, 12);
        ctx.lineTo(0, 0);
        ctx.lineTo(6, 12);
        ctx.stroke();
        // Rotating Dish Ellipse
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawSafeEllipse(ctx, 0, -4, 14 * Math.abs(Math.cos(radarAngle)), 14);
        ctx.fill();
        ctx.stroke();
        // Center Spike
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 7. TOP SKY: TACTICAL RECON SURVEILLANCE DRONE 🛸
        const droneX = Math.max(100, Math.min(width * 0.18, 280)) + Math.sin(t * 1.2) * 20;
        const droneY = Math.max(80, height * 0.15) + Math.cos(t * 1.5) * 10;

        ctx.save();
        ctx.translate(droneX, droneY);
        // Drone Center Body
        ctx.fillStyle = '#27272a';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, -14, -8, 28, 16, 5);
        ctx.fill();
        ctx.stroke();
        // Flashing Cyan Camera Eye
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        // 4 Drone Rotor Arms & Spinning Blades
        const rotorSpin = t * 25;
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        // Left Rotor
        ctx.beginPath();
        ctx.moveTo(-14, 0);
        ctx.lineTo(-26, -4);
        ctx.stroke();
        drawSafeEllipse(ctx, -26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
        ctx.stroke();
        // Right Rotor
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(26, -4);
        ctx.stroke();
        drawSafeEllipse(ctx, 26, -4, 12 * Math.abs(Math.cos(rotorSpin)), 2.5);
        ctx.stroke();

        // Scanning Vertical Laser Beam towards ground
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(Math.sin(t * 3) * 30, 160);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // 8. Artillery Tracer Flares
        if (Math.random() < 0.018 && flares.length < 3) {
          flares.push({
            x: Math.random() < 0.5 ? -20 : width + 20,
            y: height * 0.4 + Math.random() * (height * 0.2),
            vx: (Math.random() * 4 + 3) * (Math.random() < 0.5 ? 1 : -1),
            vy: -(Math.random() * 5 + 4),
            life: 1,
            color: Math.random() < 0.5 ? '#f59e0b' : '#ec4899',
            trail: [],
          });
        }

        for (let i = flares.length - 1; i >= 0; i--) {
          const f = flares[i];
          f.trail.push({ x: f.x, y: f.y, alpha: 0.8 });
          if (f.trail.length > 12) f.trail.shift();

          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.12;
          f.life -= 0.014;

          for (let j = 0; j < f.trail.length; j++) {
            const tr = f.trail[j];
            ctx.fillStyle = `${f.color}${Math.floor((j / f.trail.length) * 180).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, (j / f.trail.length) * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
          ctx.fill();

          if (f.life <= 0 || f.y > height) {
            flares.splice(i, 1);
          }
        }
      } catch (err) {
        console.error('Lobby backdrop render error:', err);
      }
    };

    renderBackdrop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-screen max-h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col justify-center items-center p-3 md:p-4 relative overflow-hidden selection:bg-violet-500 selection:text-white">
      {/* Background Fixed HD Vector War Room Canvas */}
      <canvas ref={backdropCanvasRef} className="fixed inset-0 pointer-events-none w-full h-full z-0" />

      {/* Ambient Lighting Orbs */}
      <div className="fixed top-10 left-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 max-w-5xl w-full space-y-3 my-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 px-4 py-2.5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]">🐌</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400">
                  SLUG WARS
                </h1>
                <span className="px-2 py-0.5 bg-violet-950/80 border border-violet-500/50 text-violet-300 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  QG Tactique
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Salon de préparation & d'armement</p>
            </div>
          </div>

          {/* Room Code Badge & Optional Hub Exit Button */}
          <div className="flex items-center gap-2.5">
            <RoomCodeBadge code={hostPeerId || myPeerId} label="Code Salon" accentClassName="text-violet-400" />
            {isEmbedded && onExit && (
              <button
                onClick={onExit}
                className="px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-xl text-xs font-bold text-red-300 transition"
              >
                Quitter
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Battle Preparation Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Left Column: Map Radar, Weapons & Modifiers (7 Cols) */}
          <div className="lg:col-span-7 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-4 rounded-2xl shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Zone d'Opérations & Radar
              </h2>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                {currentSizeCfg.width}×{currentSizeCfg.height} px
              </span>
            </div>

            {/* Map Preview */}
            <div className="space-y-2">
              <MapThumbnailPreview theme={config.mapTheme} size={config.mapSize || 'NORMAL'} seed={config.mapSeed} />

              {/* Theme Chips */}
              <div className="grid grid-cols-2 gap-1.5">
                {MAP_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ mapTheme: theme.id })}
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                      config.mapTheme === theme.id
                        ? 'bg-violet-950/90 border-violet-500 text-white shadow-md shadow-violet-950/40'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-lg">{theme.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">{theme.label}</div>
                      <div className="text-[10px] text-zinc-500 truncate leading-tight mt-0.5">{theme.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Dimensions & Seed Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  {(Object.entries(MAP_SIZE_CONFIGS) as [MapSize, typeof MAP_SIZE_CONFIGS[MapSize]][]).map(([sizeKey, sizeVal]) => (
                    <button
                      key={sizeKey}
                      disabled={!isHost}
                      onClick={() => onChangeConfig({ mapSize: sizeKey })}
                      className={`py-1.5 px-2 rounded-xl border text-center transition ${
                        (config.mapSize || 'NORMAL') === sizeKey
                          ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{sizeVal.icon} {sizeVal.label}</div>
                    </button>
                  ))}
                </div>

                {isHost && (
                  <button
                    onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
                    className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] border border-zinc-700 rounded-xl text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 transition whitespace-nowrap"
                    title="Générer une nouvelle seed"
                  >
                    <Dices className="w-3.5 h-3.5 text-violet-400" />
                    <span>Seed #{config.mapSeed}</span>
                  </button>
                )}
              </div>
            </div>

            {/* W.M.D Arsenal Selector */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Rocket className="w-3 h-3 text-violet-400" /> Arsenal W.M.D
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(WEAPON_SETS).map((wSet) => (
                  <button
                    key={wSet.id}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
                    className={`p-2 rounded-xl border text-left transition ${
                      config.weaponSetId === wSet.id
                        ? 'bg-violet-950/90 border-violet-500 text-white shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold text-[11px] truncate">{wSet.name}</div>
                    <div className="text-[9px] text-zinc-400 line-clamp-1 leading-snug mt-0.5">{wSet.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Match Parameters & Rules Chips */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-800">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Swords className="w-3 h-3 text-violet-400" /> Règles d'Engagement
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
                {/* Slugs per Team */}
                {isHost ? (
                  <button
                    onClick={() => {
                      const counts = [1, 2, 3, 4, 6, 8];
                      const next = counts[(counts.indexOf(config.slugsPerTeam ?? 3) + 1) % counts.length];
                      onChangeConfig({ slugsPerTeam: next });
                    }}
                    className="p-2 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-xl text-left transition"
                  >
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
                    <div className="text-xs font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
                    <div className="text-xs font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
                  </div>
                )}

                {/* HP per Slug */}
                {isHost ? (
                  <button
                    onClick={() => {
                      const hps = [50, 100, 150, 200];
                      const next = hps[(hps.indexOf(config.slugHp ?? 100) + 1) % hps.length];
                      onChangeConfig({ slugHp: next });
                    }}
                    className="p-2 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition"
                  >
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
                    <div className="text-xs font-black text-emerald-400">❤️ {config.slugHp} HP</div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
                    <div className="text-xs font-black text-emerald-400">❤️ {config.slugHp} HP</div>
                  </div>
                )}

                {/* Wind Toggle */}
                {isHost ? (
                  <button
                    onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
                    className={`p-2 rounded-xl border text-left transition ${
                      config.windEnabled
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase">Vent Météo</div>
                    <div className="text-xs font-black">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Vent Météo</div>
                    <div className="text-xs font-black text-emerald-400">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                  </div>
                )}

                {/* Vehicle Toggle */}
                {isHost ? (
                  <button
                    onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
                    className={`p-2 rounded-xl border text-left transition ${
                      config.vehiclesEnabled
                        ? 'bg-violet-950/70 border-violet-500/60 text-violet-200'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase">Véhicules</div>
                    <div className="text-xs font-black">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Véhicules</div>
                    <div className="text-xs font-black text-violet-300">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                  </div>
                )}

                {/* Day / Night Cycle Toggle */}
                {isHost ? (
                  <button
                    onClick={() => onChangeConfig({ dayNightCycle: (config.dayNightCycle || 'DAY') === 'DAY' ? 'NIGHT' : 'DAY' })}
                    className={`p-2 rounded-xl border text-left transition ${
                      (config.dayNightCycle || 'DAY') === 'DAY'
                        ? 'bg-amber-950/70 border-amber-500/60 text-amber-200 shadow-sm'
                        : 'bg-indigo-950/70 border-indigo-500/60 text-indigo-200 shadow-sm'
                    }`}
                  >
                    <div className="text-[9px] font-bold uppercase">Atmosphère</div>
                    <div className="text-xs font-black">{(config.dayNightCycle || 'DAY') === 'DAY' ? '☀️ Jour' : '🌙 Nuit'}</div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Atmosphère</div>
                    <div className="text-xs font-black text-amber-300">{(config.dayNightCycle || 'DAY') === 'DAY' ? '☀️ Jour' : '🌙 Nuit'}</div>
                  </div>
                )}

                {/* Rising Water Toggle */}
                {isHost ? (
                  <button
                    onClick={() => {
                      const speeds: Array<'OFF' | 'SLOW' | 'NORMAL' | 'FAST'> = ['OFF', 'SLOW', 'NORMAL', 'FAST'];
                      const cur = config.waterRiseSpeed || 'OFF';
                      const next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
                      onChangeConfig({ waterRiseSpeed: next });
                    }}
                    className={`p-2 rounded-xl border text-left transition ${
                      (config.waterRiseSpeed || 'OFF') !== 'OFF'
                        ? 'bg-sky-950/80 border-sky-500/70 text-sky-200 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    }`}
                    title="Monter le niveau de l'eau à chaque tour"
                  >
                    <div className="text-[9px] font-bold uppercase">Montée des Eaux</div>
                    <div className="text-xs font-black">
                      {config.waterRiseSpeed === 'SLOW'
                        ? '💧 Lente (+6px)'
                        : config.waterRiseSpeed === 'NORMAL'
                        ? '🌊 Normale (+14px)'
                        : config.waterRiseSpeed === 'FAST'
                        ? '⚡ Rapide (+26px)'
                        : '❌ Sans'}
                    </div>
                  </button>
                ) : (
                  <div className="p-2 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[9px] text-zinc-400 font-bold uppercase">Montée des Eaux</div>
                    <div className="text-xs font-black text-sky-300">
                      {config.waterRiseSpeed === 'SLOW'
                        ? '💧 Lente (+6px)'
                        : config.waterRiseSpeed === 'NORMAL'
                        ? '🌊 Normale (+14px)'
                        : config.waterRiseSpeed === 'FAST'
                        ? '⚡ Rapide (+26px)'
                        : '❌ Sans'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Squads List & Battle Launch (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-4 rounded-2xl shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" /> Escouades Engagées ({teams.length}/6)
              </h2>
              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-full">
                Prêts au combat
              </span>
            </div>

            {/* Squad Dossier Cards List */}
            <div className="space-y-2 flex-1">
              {teams.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-2.5 bg-zinc-950/80 border border-zinc-800 hover:border-violet-500/40 rounded-xl flex items-center justify-between transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-inner border border-white/20"
                        style={{ backgroundColor: `${t.color}33` }}
                      >
                        {t.avatar}
                      </div>
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-950 shadow"
                        style={{ backgroundColor: t.color }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-xs text-zinc-100 flex items-center gap-1.5 truncate">
                        <span className="truncate">{t.name}</span>
                        {t.isHost && (
                          <span className="px-1.5 py-0.2 bg-violet-950 text-violet-300 border border-violet-600/50 text-[8px] rounded font-black uppercase flex-shrink-0">
                            Commandant
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        Équipe #{idx + 1} • <span className="text-violet-300 font-semibold">{config.slugsPerTeam} limaces ({config.slugHp} HP)</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className="w-2.5 h-6 rounded-full border border-white/20 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                </div>
              ))}

              {/* Waiting Slot Placeholder */}
              {teams.length < 6 && (
                <div className="p-3 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-ping" />
                  <span>En attente d'autres joueurs...</span>
                </div>
              )}
            </div>

            {/* Launch Game Action Bar */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5 mt-auto">
              {isHost ? (
                <button
                  onClick={onStartGame}
                  disabled={teams.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 text-white font-black text-sm md:text-base rounded-xl shadow-xl shadow-violet-950/60 flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-50 animate-pulse hover:animate-none"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>LANCER L'ASSAUT 🚀</span>
                </button>
              ) : (
                <div className="p-3 bg-zinc-950/80 border border-violet-500/30 rounded-xl text-center text-xs text-zinc-300 flex items-center justify-center gap-2 shadow-inner">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span className="font-semibold text-xs">En attente du lancement par le Commandant...</span>
                </div>
              )}
              
              <div className="text-center text-[10px] text-zinc-500 font-medium">
                Terrain destructible • Tour par tour • P2P
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

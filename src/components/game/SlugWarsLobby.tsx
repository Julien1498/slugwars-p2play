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
  { id: 'FLOATING_CHAOS', label: 'Archipel Cosmique', icon: '🌌', desc: 'Îlots suspendus' },
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
    if (theme === 'ISLAND') {
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
    } else {
      skyGrad.addColorStop(0, '#09090b');
      skyGrad.addColorStop(0.5, '#2e1065');
      skyGrad.addColorStop(1, '#581c87');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, previewW, previewH);

    // Terrain Surface & Rock Drawing
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
    for (let gx = 40; gx < previewW; gx += 40) {
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
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-zinc-950 shadow-inner group">
      <canvas ref={canvasRef} width={420} height={95} className="w-full h-[95px] block" />
      
      <div className="absolute top-1.5 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded border border-white/15 text-[9px] font-mono text-zinc-200 shadow flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SEED #{seed}</span>
      </div>

      <div className="absolute bottom-1.5 right-2 px-2 py-0.5 bg-black/80 backdrop-blur-md rounded border border-violet-500/40 text-[9px] font-bold text-violet-300 shadow flex items-center gap-1">
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

  // --- DYNAMIC HIGH-FIDELITY SLUGWARS BACKGROUND CANVAS ---
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

    const clouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * width,
      y: 30 + Math.random() * (height * 0.35),
      speed: 0.15 + Math.random() * 0.25,
      size: 45 + Math.random() * 60,
      opacity: 0.12 + Math.random() * 0.18,
    }));

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.55),
      size: Math.random() * 2 + 0.8,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    // Flying Super Sheep
    const sheep = {
      x: -100,
      y: 90,
      speed: 2.2,
    };

    // Smoke particles for dynamite fuse
    const smokePuffs: { x: number; y: number; vx: number; vy: number; life: number; size: number }[] = [];

    let t = 0;

    // --- HELPER: DRAW DETAILED VECTOR SLUG BODY ---
    const drawSlug = (
      c: CanvasRenderingContext2D,
      scale: number,
      skinColor: string = '#ec4899',
      bellyColor: string = '#f472b6',
      eyeOffset: { x: number; y: number } = { x: 0, y: 0 },
      isBlinking: boolean = false
    ) => {
      c.save();
      c.scale(scale, scale);

      // Body drop shadow
      c.fillStyle = 'rgba(0, 0, 0, 0.45)';
      drawSafeEllipse(c, 0, 18, 28, 7);
      c.fill();

      // Main Fleshy Slug Body Gradient
      const bodyGrad = c.createRadialGradient(-4, -4, 4, 0, 6, 28);
      bodyGrad.addColorStop(0, '#fbcfe8');
      bodyGrad.addColorStop(0.45, skinColor);
      bodyGrad.addColorStop(1, '#831843');

      c.fillStyle = bodyGrad;
      c.strokeStyle = '#18181b';
      c.lineWidth = 2.6;
      c.beginPath();
      c.moveTo(-24, 16);
      c.quadraticCurveTo(-28, 4, -14, -10);
      c.quadraticCurveTo(-2, -24, 16, -14);
      c.quadraticCurveTo(28, 2, 24, 16);
      c.quadraticCurveTo(0, 22, -24, 16);
      c.closePath();
      c.fill();
      c.stroke();

      // Belly soft highlight
      c.fillStyle = bellyColor;
      drawSafeEllipse(c, 0, 10, 15, 6, -0.1);
      c.fill();

      // Body Segment creases
      c.strokeStyle = 'rgba(131, 24, 67, 0.6)';
      c.lineWidth = 1.8;
      c.beginPath();
      c.arc(-6, 8, 8, -Math.PI * 0.4, Math.PI * 0.2);
      c.moveTo(6, 6);
      c.arc(6, 6, 8, -Math.PI * 0.3, Math.PI * 0.2);
      c.stroke();

      // Eyestalks
      c.strokeStyle = skinColor;
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(2, -10);
      c.lineTo(4, -18);
      c.moveTo(12, -8);
      c.lineTo(15, -16);
      c.stroke();

      // Big Expressive Cartoon Eyes
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#18181b';
      c.lineWidth = 2.2;

      // Left Eye
      c.beginPath();
      c.arc(4, -18, 8.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      // Right Eye
      c.beginPath();
      c.arc(16, -16, 7.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      if (!isBlinking) {
        // Pupils
        c.fillStyle = '#09090b';
        c.beginPath();
        c.arc(5 + eyeOffset.x, -18 + eyeOffset.y, 3.4, 0, Math.PI * 2);
        c.arc(16 + eyeOffset.x, -16 + eyeOffset.y, 3, 0, Math.PI * 2);
        c.fill();

        // Eye Light Glints
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(4 + eyeOffset.x, -20 + eyeOffset.y, 1.4, 0, Math.PI * 2);
        c.arc(15 + eyeOffset.x, -18 + eyeOffset.y, 1.2, 0, Math.PI * 2);
        c.fill();
      } else {
        // Blinking slits
        c.strokeStyle = '#18181b';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-2, -18);
        c.lineTo(10, -18);
        c.moveTo(11, -16);
        c.lineTo(21, -16);
        c.stroke();
      }

      // Smirk / Smile
      c.strokeStyle = '#831843';
      c.lineWidth = 2.2;
      c.beginPath();
      c.arc(10, -1, 6, 0.2, Math.PI * 0.7);
      c.stroke();

      c.restore();
    };

    // --- HELPER: DRAW FLOATING ROCK CRAG / LEDGE ---
    const drawRockyLedge = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number
    ) => {
      c.save();
      c.translate(x, y);

      // Rock Body
      c.fillStyle = '#27272a';
      c.strokeStyle = '#18181b';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-w / 2, 0);
      c.quadraticCurveTo(-w / 2 - 10, h * 0.5, -w * 0.2, h);
      c.quadraticCurveTo(0, h + 15, w * 0.2, h);
      c.quadraticCurveTo(w / 2 + 10, h * 0.5, w / 2, 0);
      c.closePath();
      c.fill();
      c.stroke();

      // Top Lush Grass Layer
      c.fillStyle = '#15803d';
      drawRoundRect(c, -w / 2 - 4, -4, w + 8, 12, 6);
      c.fill();
      c.fillStyle = '#22c55e';
      drawRoundRect(c, -w / 2 - 2, -4, w + 4, 6, 3);
      c.fill();

      // Grass fringe details
      c.strokeStyle = '#4ade80';
      c.lineWidth = 2.5;
      c.beginPath();
      for (let gx = -w / 2 + 8; gx <= w / 2 - 8; gx += 12) {
        c.moveTo(gx, 4);
        c.lineTo(gx + 2, 9);
      }
      c.stroke();

      c.restore();
    };

    const render = () => {
      animId = requestAnimationFrame(render);
      t += 0.03;

      try {
        ctx.clearRect(0, 0, width, height);

        // 1. Sky Gradient
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, '#09090b');
        sky.addColorStop(0.35, '#1e1035');
        sky.addColorStop(0.75, '#2e1065');
        sky.addColorStop(1, '#09090b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);

        // 2. Stars
        for (const star of stars) {
          star.alpha = 0.3 + 0.7 * Math.abs(Math.sin(t * star.blinkRate * 10));
          ctx.fillStyle = `rgba(216, 180, 254, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3. Clouds
        for (const cloud of clouds) {
          cloud.x += cloud.speed;
          if (cloud.x > width + 150) cloud.x = -150;
          ctx.fillStyle = `rgba(168, 85, 247, ${cloud.opacity})`;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.9, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        // 4. Distant Bottom Hills
        ctx.fillStyle = 'rgba(20, 20, 28, 0.95)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 30) {
          const hillY = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.lineTo(x, hillY);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Grass Edge Accents on bottom hills
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 16) {
          const y = height - 120 + Math.sin(x * 0.003 + 1.2) * 45;
          ctx.moveTo(x, y);
          ctx.lineTo(x + 2, y - 4);
        }
        ctx.stroke();

        // 5. Flying Super Sheep with Fluttering Red Cape 🐑💨
        sheep.x += sheep.speed;
        if (sheep.x > width + 120) sheep.x = -100;
        const sheepY = sheep.y + Math.sin(t * 3) * 10;

        ctx.save();
        ctx.translate(sheep.x, sheepY);

        // Fluttering Red Cape
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#b91c1c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-18, 0);
        ctx.lineTo(-44 + Math.sin(t * 8) * 6, -10 + Math.cos(t * 7) * 4);
        ctx.lineTo(-40 + Math.sin(t * 8) * 6, 8 + Math.sin(t * 7) * 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Fluffy White Sheep Body
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-8, 0, 12, 0, Math.PI * 2);
        ctx.arc(4, -2, 11, 0, Math.PI * 2);
        ctx.arc(14, 0, 10, 0, Math.PI * 2);
        ctx.arc(4, 8, 9, 0, Math.PI * 2);
        ctx.arc(-6, 6, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sheep Face
        ctx.fillStyle = '#1e293b';
        drawSafeEllipse(ctx, 18, 2, 7, 5, 0.2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(17, 0, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(18, 0, 1, 0, Math.PI * 2);
        ctx.fill();

        // Speed Wind Streaks
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-48, 0);
        ctx.lineTo(-65, 0);
        ctx.moveTo(-42, -10);
        ctx.lineTo(-58, -10);
        ctx.stroke();
        ctx.restore();

        // 6. TOP LEFT: AIRBORNE PARATROOPER SLUG 🪂
        const paraX = Math.max(90, Math.min(width * 0.12, 220));
        const paraY = Math.max(100, height * 0.18) + Math.sin(t * 1.5) * 12;
        const paraAngle = Math.sin(t * 1.5) * 0.12;

        ctx.save();
        ctx.translate(paraX, paraY);
        ctx.rotate(paraAngle);

        // Parachute Dome
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(0, -50, 40, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(0, -50, 22, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Suspension Ropes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-38, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(-18, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(18, -50);
        ctx.lineTo(0, -8);
        ctx.moveTo(38, -50);
        ctx.lineTo(0, -8);
        ctx.stroke();

        // Hanging Paratrooper Slug
        drawSlug(ctx, 0.8, '#ec4899', '#f472b6', { x: 1, y: 1 }, false);
        ctx.restore();

        // 7. TOP RIGHT: HOVERING COMBAT HELICOPTER SLUG 🚁
        const chopX = Math.max(width - 220, width * 0.88);
        const chopY = Math.max(90, height * 0.18) + Math.sin(t * 2) * 10;
        const rotorAngle = t * 14;

        ctx.save();
        ctx.translate(chopX, chopY);

        // Spinning Rotor Blades
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 3.5;
        drawSafeEllipse(ctx, 0, -26, 44 * Math.abs(Math.cos(rotorAngle)), 4);
        ctx.stroke();

        // Chopper Body
        ctx.fillStyle = '#3f3f46';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawRoundRect(ctx, -26, -16, 52, 28, 12);
        ctx.fill();
        ctx.stroke();

        // Glass Dome Cockpit
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(12, -2, 13, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        ctx.stroke();

        // Tail Boom & Rotor
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-26, -2);
        ctx.lineTo(-52, -12);
        ctx.stroke();
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, -52, -12, 4, 14 * Math.abs(Math.sin(rotorAngle * 2)));
        ctx.stroke();

        // Pilot Slug
        ctx.save();
        ctx.translate(8, 3);
        drawSlug(ctx, 0.5, '#ec4899', '#f472b6', { x: 1, y: 0 }, false);
        ctx.fillStyle = '#09090b';
        ctx.fillRect(2, -11, 10, 5);
        ctx.restore();

        ctx.restore();

        // 8. LEFT FLANKING PLATFORM & VETERAN BAZOOKA SLUG 🪖🚀 (Prominent at Mid-Height)
        const leftLedgeX = Math.max(90, Math.min(width * 0.12, 240));
        const leftLedgeY = Math.max(260, height * 0.52);

        // Draw Rocky Ledge Platform
        drawRockyLedge(ctx, leftLedgeX, leftLedgeY + 22, 150, 75);

        // Draw Veteran Bazooka Slug on Ledge
        ctx.save();
        ctx.translate(leftLedgeX, leftLedgeY);

        const isLeftBlink = Math.sin(t * 1.7) > 0.95;
        drawSlug(ctx, 1.3, '#ec4899', '#f472b6', { x: 2, y: -1 }, isLeftBlink);

        // Green Camo Helmet
        ctx.fillStyle = '#3f6212';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, 8, -24, 20, 11, 0.1, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        // Gold Helmet Star
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(8, -28, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Heavy Metal Bazooka
        ctx.save();
        ctx.translate(16, -10);
        const bazAngle = -0.5 + Math.sin(t * 1.5) * 0.12;
        ctx.rotate(bazAngle);
        ctx.fillStyle = '#4b5563';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawRoundRect(ctx, -10, -9, 54, 15, 4);
        ctx.fill();
        ctx.stroke();
        // Yellow Hazard Warning Stripes
        ctx.fillStyle = '#eab308';
        ctx.fillRect(20, -8, 5, 13);
        ctx.fillRect(30, -8, 5, 13);
        // Laser Sight Beam pointing towards center
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 5]);
        ctx.beginPath();
        ctx.moveTo(44, -1);
        ctx.lineTo(260, -1);
        ctx.stroke();
        ctx.setLineDash([]);
        // Laser Red Dot
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(260, -1, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();

        // 9. RIGHT FLANKING PLATFORM & DYNAMITE SLUG 🏴‍☠️🧨 (Prominent at Mid-Height)
        const rightLedgeX = Math.max(width - 240, width * 0.88);
        const rightLedgeY = Math.max(260, height * 0.52);

        // Draw Rocky Ledge Platform
        drawRockyLedge(ctx, rightLedgeX, rightLedgeY + 22, 150, 75);

        // Draw Dynamite Slug on Ledge
        ctx.save();
        ctx.translate(rightLedgeX, rightLedgeY);
        ctx.scale(-1, 1); // Face towards center card

        const isRightBlink = Math.sin(t * 2.1) > 0.95;
        drawSlug(ctx, 1.3, '#ec4899', '#f472b6', { x: 2, y: -1 }, isRightBlink);

        // Red Pirate Headband
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.4;
        drawSafeEllipse(ctx, 10, -22, 18, 6, 0.1);
        ctx.fill();
        ctx.stroke();
        // Headband knot tails fluttering
        ctx.beginPath();
        ctx.moveTo(-6, -22);
        ctx.lineTo(-28 + Math.sin(t * 6) * 5, -28 + Math.cos(t * 5) * 4);
        ctx.lineTo(-24 + Math.sin(t * 6) * 5, -18 + Math.sin(t * 5) * 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3-Stick Dynamite Pack
        ctx.save();
        ctx.translate(22, -6);
        ctx.fillStyle = '#ef4444';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2;
        drawRoundRect(ctx, -5, -14, 12, 26, 3);
        ctx.fill();
        ctx.stroke();
        drawRoundRect(ctx, 5, -16, 12, 26, 3);
        ctx.fill();
        ctx.stroke();
        // Yellow TNT Strap
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-5, -4, 22, 7);

        // Burning Fuse
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(10, -16);
        ctx.quadraticCurveTo(18, -26, 25, -24);
        ctx.stroke();

        // Sparkling Flame Tip
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(25, -24, 3.5 + Math.sin(t * 18) * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(25, -24, 7 + Math.sin(t * 18) * 2, 0, Math.PI * 2);
        ctx.fill();

        // Smoke particles from fuse
        if (Math.random() < 0.35) {
          smokePuffs.push({
            x: rightLedgeX - 25,
            y: rightLedgeY - 30,
            vx: -(Math.random() * 0.5 + 0.2),
            vy: -(Math.random() * 0.9 + 0.6),
            life: 1,
            size: 4 + Math.random() * 3,
          });
        }
        ctx.restore();

        ctx.restore();

        // 10. Update & Render Smoke Puffs
        for (let i = smokePuffs.length - 1; i >= 0; i--) {
          const p = smokePuffs[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.025;
          p.size += 0.25;
          if (p.life <= 0) {
            smokePuffs.splice(i, 1);
          } else {
            ctx.fillStyle = `rgba(212, 212, 216, ${p.life * 0.5})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } catch (err) {
        console.error('Lobby backdrop render error:', err);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="h-screen max-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-3 md:p-4 relative overflow-hidden selection:bg-violet-500 selection:text-white">
      {/* Background Fixed HD Vector Canvas */}
      <canvas ref={backdropCanvasRef} className="fixed inset-0 pointer-events-none w-full h-full z-0" />

      {/* Ambient Lighting Orbs */}
      <div className="fixed top-10 left-1/4 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 right-1/4 w-80 h-80 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex items-center justify-between gap-3 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 px-4 py-2 rounded-xl shadow-xl flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">🐌</span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400">
                SLUG WARS
              </h1>
              <span className="px-2 py-0.2 bg-violet-950/80 border border-violet-500/50 text-violet-300 text-[9px] font-extrabold uppercase rounded-full">
                QG Tactique
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">Salon de préparation & d'armement</p>
          </div>
        </div>

        {/* Room Code Badge (Built-in copy) & Optional Hub Exit Button */}
        <div className="flex items-center gap-2">
          <RoomCodeBadge code={hostPeerId || myPeerId} label="Code Salon" accentClassName="text-violet-400" />
          {isEmbedded && onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-lg text-xs font-bold text-red-300 transition"
            >
              Quitter
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Battle Preparation Container (Fits 100% within viewport height) */}
      <div className="relative z-10 max-w-5xl w-full mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 my-2">
        
        {/* Left Column: Map Radar, Weapons & Modifiers (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-3.5 rounded-xl shadow-xl overflow-hidden space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
            <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" /> Zone d'Opérations & Radar
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-1.5 py-0.5 rounded border border-zinc-800">
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
                  className={`p-1.5 rounded-lg border text-left transition flex items-center gap-2 ${
                    config.mapTheme === theme.id
                      ? 'bg-violet-950/90 border-violet-500 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-base">{theme.icon}</span>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold truncate leading-tight">{theme.label}</div>
                    <div className="text-[9px] text-zinc-500 truncate leading-tight">{theme.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Dimensions & Seed Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 grid grid-cols-3 gap-1">
                {(Object.entries(MAP_SIZE_CONFIGS) as [MapSize, typeof MAP_SIZE_CONFIGS[MapSize]][]).map(([sizeKey, sizeVal]) => (
                  <button
                    key={sizeKey}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ mapSize: sizeKey })}
                    className={`py-1 px-1.5 rounded-lg border text-center transition ${
                      (config.mapSize || 'NORMAL') === sizeKey
                        ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-sm'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-[10px] font-bold">{sizeVal.icon} {sizeVal.label}</div>
                  </button>
                ))}
              </div>

              {isHost && (
                <button
                  onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
                  className="py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-[0.99] border border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-200 flex items-center gap-1.5 transition whitespace-nowrap"
                  title="Générer une nouvelle seed"
                >
                  <Dices className="w-3.5 h-3.5 text-violet-400" />
                  <span>Seed #{config.mapSeed}</span>
                </button>
              )}
            </div>
          </div>

          {/* W.M.D Arsenal Selector */}
          <div className="space-y-1 pt-1.5 border-t border-zinc-800">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Rocket className="w-3 h-3 text-violet-400" /> Arsenal W.M.D
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {Object.values(WEAPON_SETS).map((wSet) => (
                <button
                  key={wSet.id}
                  disabled={!isHost}
                  onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
                  className={`p-1.5 rounded-lg border text-left transition ${
                    config.weaponSetId === wSet.id
                      ? 'bg-violet-950/90 border-violet-500 text-white shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <div className="font-bold text-[10px] truncate">{wSet.name}</div>
                  <div className="text-[8px] text-zinc-400 line-clamp-1 leading-tight">{wSet.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Match Parameters & Rules Chips (Compact 1-row) */}
          <div className="space-y-1 pt-1.5 border-t border-zinc-800">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Swords className="w-3 h-3 text-violet-400" /> Règles d'Engagement
            </label>
            
            <div className="grid grid-cols-4 gap-1.5">
              {/* Slugs per Team */}
              {isHost ? (
                <button
                  onClick={() => {
                    const counts = [1, 2, 3, 4, 6, 8];
                    const next = counts[(counts.indexOf(config.slugsPerTeam ?? 3) + 1) % counts.length];
                    onChangeConfig({ slugsPerTeam: next });
                  }}
                  className="p-1.5 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-lg text-left transition"
                >
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
                  <div className="text-[11px] font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
                </button>
              ) : (
                <div className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-left">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Limaces</div>
                  <div className="text-[11px] font-black text-violet-300">🐌 {config.slugsPerTeam}</div>
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
                  className="p-1.5 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-lg text-left transition"
                >
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
                  <div className="text-[11px] font-black text-emerald-400">❤️ {config.slugHp} HP</div>
                </button>
              ) : (
                <div className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-left">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Points de Vie</div>
                  <div className="text-[11px] font-black text-emerald-400">❤️ {config.slugHp} HP</div>
                </div>
              )}

              {/* Wind Toggle */}
              {isHost ? (
                <button
                  onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
                  className={`p-1.5 rounded-lg border text-left transition ${
                    config.windEnabled
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">Vent Météo</div>
                  <div className="text-[11px] font-black">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                </button>
              ) : (
                <div className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-left">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Vent Météo</div>
                  <div className="text-[11px] font-black text-emerald-400">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                </div>
              )}

              {/* Vehicle Toggle */}
              {isHost ? (
                <button
                  onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
                  className={`p-1.5 rounded-lg border text-left transition ${
                    config.vehiclesEnabled
                      ? 'bg-violet-950/70 border-violet-500/60 text-violet-200'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="text-[9px] font-bold uppercase">Véhicules</div>
                  <div className="text-[11px] font-black">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                </button>
              ) : (
                <div className="p-1.5 bg-zinc-950/60 border border-zinc-800 rounded-lg text-left">
                  <div className="text-[9px] text-zinc-400 font-bold uppercase">Véhicules</div>
                  <div className="text-[11px] font-black text-violet-300">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Squads List & Battle Launch (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-3.5 rounded-xl shadow-xl overflow-hidden space-y-2">
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <h2 className="text-xs font-black text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-violet-400" /> Escouades ({teams.length}/6)
              </h2>
              <span className="text-[9px] font-bold px-2 py-0.2 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-full">
                Prêts au combat
              </span>
            </div>

            {/* Squad Dossier Cards List (scrollable if > 4 teams) */}
            <div className="space-y-1.5 overflow-y-auto pr-1 flex-1">
              {teams.map((t, idx) => (
                <div
                  key={t.id}
                  className="p-2 bg-zinc-950/80 border border-zinc-800 hover:border-violet-500/40 rounded-lg flex items-center justify-between transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shadow-inner border border-white/20"
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
                          <span className="px-1 py-0.2 bg-violet-950 text-violet-300 border border-violet-600/50 text-[8px] rounded font-black uppercase flex-shrink-0">
                            Hôte
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.2">
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
                <div className="p-2 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-lg text-center text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 animate-ping" />
                  <span>En attente d'autres joueurs...</span>
                </div>
              )}
            </div>
          </div>

          {/* Launch Game Action Bar */}
          <div className="pt-2 border-t border-zinc-800 space-y-1 flex-shrink-0">
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
                <span className="font-semibold">En attente du lancement par le Commandant...</span>
              </div>
            )}
            
            <div className="text-center text-[9px] text-zinc-500 font-medium">
              Terrain destructible • Tour par tour • P2P
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Subtle Status Bar */}
      <div className="relative z-10 text-center text-[10px] text-zinc-500 font-medium flex-shrink-0">
        Slug Wars P2Play • Synchronisation instantanée WebRTC
      </div>
    </div>
  );
};

import React, { useRef, useEffect } from 'react';
import { GameConfig, Team, MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../core/types';
import { generateProceduralTerrain } from '../../core/terrainGenerator';
import { WEAPON_SETS } from '../../core/weapons/weaponSets';
import { RoomCodeBadge } from 'p2play-core';
import { Dices, Play, RefreshCw, Shield, Sparkles, Swords, Wind, Sun, Moon, Rocket, Users, Heart, Layers, Radar } from 'lucide-react';

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
  { id: 'FORTRESS', label: 'Deux Forteresses', icon: '🏰', desc: 'Canyons & châteaux de pierre' },
  { id: 'FLOATING_CHAOS', label: 'Archipel Cosmique', icon: '🌌', desc: 'Îlots suspendus dans le vide' },
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

    // Generate miniature terrain using selected dimensions
    const terrain = generateProceduralTerrain(seed, theme, sizeCfg.width, sizeCfg.height);
    const { grid, width, height, waterLevel } = terrain;

    // 1. Draw Thematic Sky Background
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

    // 2. Downsampled Terrain Surface & Underground Drawing
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

    // 3. Water Surface at Bottom
    const waterCanvasY = (waterLevel / height) * previewH;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
    ctx.fillRect(0, waterCanvasY, previewW, previewH - waterCanvasY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, waterCanvasY);
    ctx.lineTo(previewW, waterCanvasY);
    ctx.stroke();

    // 4. Subtle Tactical Grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let gx = 40; gx < previewW; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, previewH);
      ctx.stroke();
    }
    for (let gy = 30; gy < previewH; gy += 30) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(previewW, gy);
      ctx.stroke();
    }
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-violet-500/30 bg-zinc-950 shadow-inner group">
      <canvas ref={canvasRef} width={420} height={150} className="w-full h-[150px] block" />
      
      {/* Tactical HUD Markers */}
      <div className="absolute top-2 left-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/15 text-[10px] font-mono text-zinc-200 shadow flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SEED #{seed}</span>
      </div>

      <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-violet-500/40 text-[10px] font-bold text-violet-300 shadow flex items-center gap-1.5">
        <span>{sizeCfg.icon}</span>
        <span>{sizeCfg.label} ({sizeCfg.width}×{sizeCfg.height} px)</span>
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

  // --- DYNAMIC TACTICAL WAR ROOM BACKDROP CANVAS ---
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
    const stars = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.7),
      size: Math.random() * 2 + 0.6,
      blinkRate: 0.02 + Math.random() * 0.04,
      alpha: Math.random(),
    }));

    // Artillery Mortar Flares & Sparks
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

    // Searchlight Beam angle
    let t = 0;

    // Helper: Draw Little Sentry Slug
    const drawMiniSentrySlug = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      hat: 'HELMET' | 'BINOCULARS' | 'ANTENNA'
    ) => {
      c.save();
      c.translate(x, y);
      c.scale(scale, scale);

      // Body Drop Shadow
      c.fillStyle = 'rgba(0, 0, 0, 0.4)';
      drawSafeEllipse(c, 0, 14, 18, 5);
      c.fill();

      // Slug Body
      const bodyGrad = c.createRadialGradient(-3, -3, 2, 0, 4, 18);
      bodyGrad.addColorStop(0, '#fbcfe8');
      bodyGrad.addColorStop(0.5, '#ec4899');
      bodyGrad.addColorStop(1, '#831843');
      c.fillStyle = bodyGrad;
      c.strokeStyle = '#18181b';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-16, 12);
      c.quadraticCurveTo(-18, 2, -10, -6);
      c.quadraticCurveTo(-2, -16, 10, -10);
      c.quadraticCurveTo(18, 2, 16, 12);
      c.quadraticCurveTo(0, 16, -16, 12);
      c.closePath();
      c.fill();
      c.stroke();

      // Eyes
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.arc(2, -12, 5, 0, Math.PI * 2);
      c.arc(10, -10, 4.5, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      // Pupils looking around
      const pupilX = Math.sin(t * 2) * 1.5;
      c.fillStyle = '#09090b';
      c.beginPath();
      c.arc(3 + pupilX, -12, 2, 0, Math.PI * 2);
      c.arc(11 + pupilX, -10, 1.8, 0, Math.PI * 2);
      c.fill();

      if (hat === 'HELMET') {
        // Military Camo Helmet
        c.fillStyle = '#3f6212';
        c.strokeStyle = '#18181b';
        c.lineWidth = 2;
        c.beginPath();
        drawSafeEllipse(c, 5, -16, 13, 7, 0.1, Math.PI, 0);
        c.fill();
        c.stroke();
      } else if (hat === 'BINOCULARS') {
        // Night Vision Goggles
        c.fillStyle = '#10b981';
        c.strokeStyle = '#18181b';
        c.lineWidth = 2;
        drawRoundRect(c, -1, -15, 8, 7, 2);
        c.fill();
        c.stroke();
        drawRoundRect(c, 7, -13, 8, 7, 2);
        c.fill();
        c.stroke();
        // Green Glow Lenses
        c.fillStyle = 'rgba(52, 211, 153, 0.8)';
        c.beginPath();
        c.arc(3, -11.5, 2, 0, Math.PI * 2);
        c.arc(11, -9.5, 2, 0, Math.PI * 2);
        c.fill();
      } else if (hat === 'ANTENNA') {
        // Radio Backpack & Antenna
        c.strokeStyle = '#a1a1aa';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(-10, 4);
        c.lineTo(-18, -20);
        c.stroke();
        // Red Blinking Beacon
        c.fillStyle = Math.sin(t * 6) > 0 ? '#ef4444' : '#7f1d1d';
        c.beginPath();
        c.arc(-18, -20, 3, 0, Math.PI * 2);
        c.fill();
      }

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
        sky.addColorStop(0.4, '#130924');
        sky.addColorStop(0.75, '#240e46');
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

        // 3. Searchlight Scanning Beams from Distant Watchtowers
        const leftTowerX = width * 0.12;
        const towerY = height * 0.78;
        const sweepAngle = -Math.PI * 0.35 + Math.sin(t * 0.8) * 0.55;

        ctx.save();
        ctx.translate(leftTowerX, towerY);
        ctx.rotate(sweepAngle);

        const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, -height * 0.8, height * 0.6);
        beamGrad.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
        beamGrad.addColorStop(0.3, 'rgba(192, 132, 252, 0.18)');
        beamGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-75, -height * 0.85);
        ctx.lineTo(75, -height * 0.85);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Right Searchlight Beam
        const rightTowerX = width * 0.88;
        const rightSweepAngle = Math.PI * 0.35 + Math.sin(t * 0.7 + 1.5) * 0.55;

        ctx.save();
        ctx.translate(rightTowerX, towerY);
        ctx.rotate(rightSweepAngle);

        const rightBeamGrad = ctx.createRadialGradient(0, 0, 10, 0, -height * 0.8, height * 0.6);
        rightBeamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        rightBeamGrad.addColorStop(0.3, 'rgba(125, 211, 252, 0.15)');
        rightBeamGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

        ctx.fillStyle = rightBeamGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-70, -height * 0.8);
        ctx.lineTo(70, -height * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 4. Distant Mountain Silhouette Ridges
        ctx.fillStyle = 'rgba(15, 12, 28, 0.9)';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 40) {
          const my = height - 160 + Math.sin(x * 0.002 + 0.5) * 60;
          ctx.lineTo(x, my);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Foreground Fortified Bunker Hill
        ctx.fillStyle = '#0f0f17';
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x += 30) {
          const by = height - 90 + Math.sin(x * 0.003 + 2.1) * 35;
          ctx.lineTo(x, by);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Green Grass Edge Tracing on Bunker
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 18) {
          const by = height - 90 + Math.sin(x * 0.003 + 2.1) * 35;
          ctx.moveTo(x, by);
          ctx.lineTo(x + 2, by - 4);
        }
        ctx.stroke();

        // 5. Tactical Mini Recon Slugs on Ridge Flanks
        const leftSlugX = Math.max(60, width * 0.08);
        const leftSlugY = height - 95;
        drawMiniSentrySlug(ctx, leftSlugX, leftSlugY, 1.1, 'BINOCULARS');

        const rightSlugX = Math.max(width - 90, width * 0.92);
        const rightSlugY = height - 85;
        drawMiniSentrySlug(ctx, rightSlugX, rightSlugY, 1.1, 'ANTENNA');

        // Center-left Helmet Sentry
        if (width > 900) {
          const midSlugX = width * 0.22;
          const midSlugY = height - 70;
          drawMiniSentrySlug(ctx, midSlugX, midSlugY, 0.9, 'HELMET');
        }

        // 6. Occasional Artillery Tracer Flares
        if (Math.random() < 0.015 && flares.length < 3) {
          flares.push({
            x: Math.random() < 0.5 ? -20 : width + 20,
            y: height * 0.5 + Math.random() * (height * 0.2),
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
          f.vy += 0.12; // Gravity
          f.life -= 0.014;

          // Render Trail
          for (let j = 0; j < f.trail.length; j++) {
            const tr = f.trail[j];
            ctx.fillStyle = `${f.color}${Math.floor((j / f.trail.length) * 180).toString(16).padStart(2, '0')}`;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, (j / f.trail.length) * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Flare Head
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-start p-4 md:p-6 relative overflow-x-hidden selection:bg-violet-500 selection:text-white">
      {/* Background Animated Tactical War Room Canvas */}
      <canvas ref={backdropCanvasRef} className="absolute inset-0 pointer-events-none w-full h-full" />

      {/* Ambient Lighting Orbs */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-fuchsia-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl w-full space-y-6">
        {/* Tactical Header Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-4 md:p-5 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <span className="text-4xl drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">🐌</span>
              <span className="absolute -bottom-1 -right-1 text-xs">🎯</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400">
                  SLUG WARS
                </h1>
                <span className="px-2 py-0.5 bg-violet-950/80 border border-violet-500/50 text-violet-300 text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                  QG Tactique
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">Préparation & déploiement des escouades</p>
            </div>
          </div>

          {/* Room Code Badge (includes built-in copy link) & Exit Button */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <RoomCodeBadge code={hostPeerId || myPeerId} label="Code Salon" accentClassName="text-violet-400" />
            {isEmbedded && onExit && (
              <button
                onClick={onExit}
                className="px-3.5 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-800/50 rounded-xl text-xs font-bold text-red-300 transition shadow-sm"
              >
                Quitter vers Hub
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Battle Preparation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Map Radar, Weapons & Match Modifiers (7 Cols) */}
          <div className="lg:col-span-7 space-y-5 bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-5 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" /> Zone d'Opérations & Radar
              </h2>
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                {currentSizeCfg.width}×{currentSizeCfg.height} px
              </span>
            </div>

            {/* Interactive Real-Time Map Radar Preview */}
            <div className="space-y-3">
              <MapThumbnailPreview theme={config.mapTheme} size={config.mapSize || 'NORMAL'} seed={config.mapSeed} />

              {/* Map Theme Chips */}
              <div className="grid grid-cols-2 gap-2">
                {MAP_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ mapTheme: theme.id })}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 ${
                      config.mapTheme === theme.id
                        ? 'bg-violet-950/90 border-violet-500 text-white shadow-md shadow-violet-950/50'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-xl">{theme.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{theme.label}</div>
                      <div className="text-[10px] text-zinc-400 truncate">{theme.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Map Size Buttons: Petite / Normale / Grande */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-400" /> Dimensions du Terrain
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(MAP_SIZE_CONFIGS) as [MapSize, typeof MAP_SIZE_CONFIGS[MapSize]][]).map(([sizeKey, sizeVal]) => (
                    <button
                      key={sizeKey}
                      disabled={!isHost}
                      onClick={() => onChangeConfig({ mapSize: sizeKey })}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-1 ${
                        (config.mapSize || 'NORMAL') === sizeKey
                          ? 'bg-violet-950/90 border-violet-500 text-violet-200 shadow-md shadow-violet-950/40'
                          : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span>{sizeVal.icon}</span>
                        <span>{sizeVal.label}</span>
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">{sizeVal.width}×{sizeVal.height}</div>
                    </button>
                  ))}
                </div>
              </div>

              {isHost && (
                <button
                  onClick={() => onChangeConfig({ mapSeed: Math.floor(Math.random() * 1000000) })}
                  className="w-full py-2 bg-zinc-800/80 hover:bg-zinc-700 active:scale-[0.99] border border-zinc-700 rounded-xl text-xs font-bold text-zinc-200 flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Dices className="w-4 h-4 text-violet-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Générer une nouvelle carte (Seed #{config.mapSeed})</span>
                </button>
              )}
            </div>

            {/* W.M.D Arsenal Selector */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5 text-violet-400" /> Arsenal W.M.D & Règles d'Armement
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.values(WEAPON_SETS).map((wSet) => (
                  <button
                    key={wSet.id}
                    disabled={!isHost}
                    onClick={() => onChangeConfig({ weaponSetId: wSet.id })}
                    className={`p-3 rounded-xl border text-left transition ${
                      config.weaponSetId === wSet.id
                        ? 'bg-violet-950/90 border-violet-500 text-white shadow-md shadow-violet-950/40'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center justify-between">
                      <span>{wSet.name}</span>
                      {config.weaponSetId === wSet.id && (
                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{wSet.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Match Parameters & Rules Chips */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Swords className="w-3.5 h-3.5 text-violet-400" /> Paramètres d'Engagement
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Slugs per Team */}
                {isHost ? (
                  <button
                    onClick={() => {
                      const counts = [1, 2, 3, 4, 6, 8];
                      const next = counts[(counts.indexOf(config.slugsPerTeam ?? 3) + 1) % counts.length];
                      onChangeConfig({ slugsPerTeam: next });
                    }}
                    className="p-2.5 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 rounded-xl text-left transition"
                  >
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">Limaces / Équipe</div>
                    <div className="text-xs font-black text-violet-300 mt-0.5 flex items-center justify-between">
                      <span>🐌 {config.slugsPerTeam}</span>
                      <span className="text-[9px] text-zinc-500">Cycle ↻</span>
                    </div>
                  </button>
                ) : (
                  <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">Limaces / Équipe</div>
                    <div className="text-xs font-black text-violet-300 mt-0.5">🐌 {config.slugsPerTeam}</div>
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
                    className="p-2.5 bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 rounded-xl text-left transition"
                  >
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">PV Limace</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5 flex items-center justify-between">
                      <span>❤️ {config.slugHp} HP</span>
                      <span className="text-[9px] text-zinc-500">Cycle ↻</span>
                    </div>
                  </button>
                ) : (
                  <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">PV Limace</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">❤️ {config.slugHp} HP</div>
                  </div>
                )}

                {/* Wind Toggle */}
                {isHost ? (
                  <button
                    onClick={() => onChangeConfig({ windEnabled: !config.windEnabled })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      config.windEnabled
                        ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-200'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">Vent Météo</div>
                    <div className="text-xs font-black mt-0.5">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                  </button>
                ) : (
                  <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">Vent Météo</div>
                    <div className="text-xs font-black text-emerald-400 mt-0.5">{config.windEnabled ? '💨 Actif' : '❌ Sans'}</div>
                  </div>
                )}

                {/* Vehicle Toggle */}
                {isHost ? (
                  <button
                    onClick={() => onChangeConfig({ vehiclesEnabled: !config.vehiclesEnabled })}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      config.vehiclesEnabled
                        ? 'bg-violet-950/70 border-violet-500/60 text-violet-200'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">Véhicules</div>
                    <div className="text-xs font-black mt-0.5">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                  </button>
                ) : (
                  <div className="p-2.5 bg-zinc-950/60 border border-zinc-800 rounded-xl text-left">
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">Véhicules</div>
                    <div className="text-xs font-black text-violet-300 mt-0.5">{config.vehiclesEnabled ? '🚁 Hélico' : '❌ Sans'}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Squads List & Battle Launch (5 Cols) */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between bg-zinc-900/90 backdrop-blur-xl border border-violet-500/30 p-5 rounded-2xl shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h2 className="text-sm font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-violet-400" /> Escouades Engagées ({teams.length}/6)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 rounded-full">
                  Prêts au combat
                </span>
              </div>

              {/* Squad Dossier Cards */}
              <div className="space-y-2.5">
                {teams.map((t, idx) => (
                  <div
                    key={t.id}
                    className="p-3.5 bg-zinc-950/80 border border-zinc-800 hover:border-violet-500/40 rounded-xl flex items-center justify-between transition shadow-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner border border-white/20"
                          style={{ backgroundColor: `${t.color}33` }}
                        >
                          {t.avatar}
                        </div>
                        <div
                          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-zinc-950 shadow"
                          style={{ backgroundColor: t.color }}
                        />
                      </div>

                      <div>
                        <div className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {t.isHost && (
                            <span className="px-1.5 py-0.2 bg-violet-950 text-violet-300 border border-violet-600/50 text-[9px] rounded font-black uppercase tracking-wider">
                              Commandant (Hôte)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>Équipe #{idx + 1}</span>
                          <span>•</span>
                          <span className="text-violet-300 font-semibold">{config.slugsPerTeam} limaces ({config.slugHp} HP)</span>
                        </div>
                      </div>
                    </div>

                    {/* Team Color Pill */}
                    <div
                      className="w-3 h-8 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: t.color }}
                    />
                  </div>
                ))}

                {/* Empty Squad Waiting Placeholder */}
                {teams.length < 6 && (
                  <div className="p-3 bg-zinc-950/30 border border-dashed border-zinc-800 rounded-xl text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-zinc-700 animate-ping" />
                    <span>En attente d'autres joueurs (partagez le code du salon)...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Launch Game Action Bar */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              {isHost ? (
                <button
                  onClick={onStartGame}
                  disabled={teams.length === 0}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 hover:from-violet-500 hover:via-fuchsia-500 hover:to-violet-500 text-white font-black text-base md:text-lg rounded-2xl shadow-xl shadow-violet-950/60 flex items-center justify-center gap-3 transition active:scale-[0.98] disabled:opacity-50 animate-pulse hover:animate-none"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>LANCER L'ASSAUT 🚀</span>
                </button>
              ) : (
                <div className="p-4 bg-zinc-950/80 border border-violet-500/30 rounded-2xl text-center text-sm text-zinc-300 flex items-center justify-center gap-2.5 shadow-inner">
                  <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                  <span className="font-semibold">En attente du lancement par le Commandant...</span>
                </div>
              )}
              
              <div className="text-center text-[11px] text-zinc-500 font-medium">
                Terrain 100% destructible • Tirs au tour par tour • Synchronisation P2P
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

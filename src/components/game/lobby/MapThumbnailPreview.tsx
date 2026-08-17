import React, { useRef, useEffect } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateProceduralTerrain } from '../../../core/terrainGenerator';

interface MapThumbnailPreviewProps {
  theme: MapTheme;
  size: MapSize;
  seed: number;
}

export const MapThumbnailPreview: React.FC<MapThumbnailPreviewProps> = ({ theme, size, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCfg = MAP_SIZE_CONFIGS[size || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

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

    // Tactical Grid overlay
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

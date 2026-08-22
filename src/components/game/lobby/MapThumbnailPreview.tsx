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

    // Sky RGB Gradients (top and bottom)
    let skyTopRGB = [2, 132, 199];      // #0284c7 Crisp bright blue
    let skyBottomRGB = [240, 249, 255]; // #f0f9ff Luminous atmospheric white-blue

    if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
      skyTopRGB = [217, 119, 6];       // #d97706 Warm radiant amber
      skyBottomRGB = [254, 240, 138];   // #fef08a Glowing golden cavern light
    } else if (theme === 'NATURAL_ARCHES') {
      skyTopRGB = [249, 115, 22];      // #f97316 Warm canyon orange
      skyBottomRGB = [254, 249, 195];   // #fef9c3 Radiant sunset gold
    } else if (theme === 'FORTRESS') {
      skyTopRGB = [2, 132, 199];       // #0284c7 Clear blue
      skyBottomRGB = [224, 242, 254];   // #e0f2fe Soft sky blue
    }

    // Terrain Surface & Rock + Opaque Sky Buffer
    const imgData = ctx.createImageData(previewW, previewH);
    const data = imgData.data;

    // Thematic Geological Strata Colors
    let surfaceRGB = [34, 197, 94];
    let topsoilRGB = [84, 49, 24];
    let rockRGB = [38, 22, 10];
    let bedrockRGB = [20, 9, 4];

    if (theme === 'ARCHIPELAGO') {
      surfaceRGB = [74, 222, 128];
      topsoilRGB = [120, 87, 45];
      rockRGB = [48, 32, 15];
      bedrockRGB = [24, 16, 7];
    } else if (theme === 'CAVERN') {
      surfaceRGB = [140, 116, 100];
      topsoilRGB = [54, 36, 42];
      rockRGB = [32, 19, 23];
      bedrockRGB = [14, 8, 10];
    } else if (theme === 'ORGANIC_CAVES') {
      surfaceRGB = [217, 119, 6];
      topsoilRGB = [120, 53, 15];
      rockRGB = [44, 20, 6];
      bedrockRGB = [16, 7, 2];
    } else if (theme === 'NATURAL_ARCHES') {
      surfaceRGB = [245, 155, 8];
      topsoilRGB = [194, 65, 12];
      rockRGB = [69, 34, 20];
      bedrockRGB = [23, 10, 6];
    } else if (theme === 'SPIRES') {
      surfaceRGB = [34, 197, 94];
      topsoilRGB = [100, 116, 139];
      rockRGB = [51, 65, 85];
      bedrockRGB = [15, 23, 42];
    } else if (theme === 'FORTRESS') {
      surfaceRGB = [163, 230, 53];
      topsoilRGB = [184, 163, 148];
      rockRGB = [64, 49, 38];
      bedrockRGB = [21, 16, 12];
    } else if (theme === 'FLOATING_CHAOS') {
      surfaceRGB = [34, 197, 94];
      topsoilRGB = [95, 58, 30];
      rockRGB = [38, 22, 12];
      bedrockRGB = [18, 10, 6];
    }

    for (let py = 0; py < previewH; py++) {
      const srcY = Math.floor((py / previewH) * height);
      const skyT = py / previewH;
      const skyR = Math.round(skyTopRGB[0] + (skyBottomRGB[0] - skyTopRGB[0]) * skyT);
      const skyG = Math.round(skyTopRGB[1] + (skyBottomRGB[1] - skyTopRGB[1]) * skyT);
      const skyB = Math.round(skyTopRGB[2] + (skyBottomRGB[2] - skyTopRGB[2]) * skyT);

      for (let px = 0; px < previewW; px++) {
        const srcX = Math.floor((px / previewW) * width);
        const isSolid = grid[srcY * width + srcX] === 1;
        const idx = (py * previewW + px) * 4;

        if (isSolid) {
          // Determine depth from top surface
          let depth = 0;
          for (let dy = 1; dy <= 12; dy++) {
            if (srcY - dy < 0 || grid[(srcY - dy) * width + srcX] === 0) {
              break;
            }
            depth++;
          }

          let color = surfaceRGB;
          if (depth === 0) {
            color = surfaceRGB;
          } else if (depth <= 2) {
            color = topsoilRGB;
          } else if (depth <= 7) {
            color = rockRGB;
          } else {
            color = bedrockRGB;
          }

          data[idx] = color[0];
          data[idx + 1] = color[1];
          data[idx + 2] = color[2];
          data[idx + 3] = 255;
        } else {
          // 100% Opaque High-Contrast Sky Pixel
          data[idx] = skyR;
          data[idx + 1] = skyG;
          data[idx + 2] = skyB;
          data[idx + 3] = 255;
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

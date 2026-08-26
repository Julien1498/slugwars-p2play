import React, { useRef, useEffect } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateProceduralTerrain } from '../../../core/terrainGenerator';
import { THEME_PALETTES } from '../../../rendering/renderTerrain';

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

    // Thematic Geological Strata Colors from renderTerrain
    const palette = THEME_PALETTES[theme || 'ISLAND'] || THEME_PALETTES.ISLAND;
    const hexToRgb = (c: number): [number, number, number] => [
      c & 0xff,
      (c >> 8) & 0xff,
      (c >> 16) & 0xff,
    ];
    const surfaceRGB = hexToRgb(palette.surfaceBody);
    const topsoilRGB = hexToRgb(palette.soilLight);
    const strataARGB = hexToRgb(palette.strataA);
    const strataBRGB = hexToRgb(palette.strataB);
    const denseRockRGB = hexToRgb(palette.denseRock);
    const bedrockRGB = hexToRgb(palette.bedrock);

    // 1. Build Solid Grid in Preview Resolution
    const solidMap = new Uint8Array(previewW * previewH);
    for (let py = 0; py < previewH; py++) {
      const srcY = Math.floor((py / previewH) * height);
      const rowOffset = py * previewW;
      for (let px = 0; px < previewW; px++) {
        const srcX = Math.floor((px / previewW) * width);
        if (grid[srcY * width + srcX] === 1) {
          solidMap[rowOffset + px] = 1;
        }
      }
    }

    // 2. 2-Pass Distance Transform in Preview Resolution
    const pDist = new Float32Array(previewW * previewH);
    pDist.fill(999);
    for (let y = 0; y < previewH; y++) {
      const rOff = y * previewW;
      const prevOff = (y - 1) * previewW;
      for (let x = 0; x < previewW; x++) {
        const idx = rOff + x;
        if (solidMap[idx] === 0) {
          pDist[idx] = 0;
        } else {
          let d = 999;
          if (x > 0) d = Math.min(d, pDist[idx - 1] + 1);
          if (y > 0) {
            d = Math.min(d, pDist[prevOff + x] + 1);
            if (x > 0) d = Math.min(d, pDist[prevOff + x - 1] + 1.414);
            if (x < previewW - 1) d = Math.min(d, pDist[prevOff + x + 1] + 1.414);
          }
          pDist[idx] = d;
        }
      }
    }
    for (let y = previewH - 1; y >= 0; y--) {
      const rOff = y * previewW;
      const nextOff = (y + 1) * previewW;
      for (let x = previewW - 1; x >= 0; x--) {
        const idx = rOff + x;
        if (solidMap[idx] === 0) continue;
        let d = pDist[idx];
        if (x < previewW - 1) d = Math.min(d, pDist[idx + 1] + 1);
        if (y < previewH - 1) {
          d = Math.min(d, pDist[nextOff + x] + 1);
          if (x > 0) d = Math.min(d, pDist[nextOff + x - 1] + 1.414);
          if (x < previewW - 1) d = Math.min(d, pDist[nextOff + x + 1] + 1.414);
        }
        pDist[idx] = d;
      }
    }

    // 3. Render High-Fidelity Geological Layers
    for (let py = 0; py < previewH; py++) {
      const skyT = py / previewH;
      const skyR = Math.round(skyTopRGB[0] + (skyBottomRGB[0] - skyTopRGB[0]) * skyT);
      const skyG = Math.round(skyTopRGB[1] + (skyBottomRGB[1] - skyTopRGB[1]) * skyT);
      const skyB = Math.round(skyTopRGB[2] + (skyBottomRGB[2] - skyTopRGB[2]) * skyT);

      for (let px = 0; px < previewW; px++) {
        const pIdx = py * previewW + px;
        const idx = pIdx * 4;

        if (solidMap[pIdx] === 1) {
          const d = pDist[pIdx];
          let color = surfaceRGB;

          if (d <= 1.2) {
            color = surfaceRGB;
          } else if (d <= 2.2) {
            color = hexToRgb(palette.surfaceShadow);
          } else if (d <= 3.2) {
            color = hexToRgb(palette.surfaceDeep);
          } else if (d <= 6.5) {
            color = topsoilRGB;
          } else if (d <= 15.0) {
            const isBand = (py >> 1) & 1;
            color = isBand ? strataARGB : strataBRGB;
          } else if (d <= 28.0) {
            color = denseRockRGB;
          } else {
            color = bedrockRGB;
          }

          data[idx] = color[0];
          data[idx + 1] = color[1];
          data[idx + 2] = color[2];
          data[idx + 3] = 255;
        } else {
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

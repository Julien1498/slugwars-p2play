import React, { useRef, useEffect } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateProceduralTerrain } from '../../../core/terrainGenerator';
import { getThemeConfig } from '../../../core/terrain/themeRegistry';

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

    const themeConfig = getThemeConfig(theme);
    const hexStringToRgb = (hex: string): [number, number, number] => {
      const clean = hex.replace('#', '');
      const parsed = parseInt(clean, 16);
      if (clean.length === 3) {
        const r = parseInt(clean[0] + clean[0], 16);
        const g = parseInt(clean[1] + clean[1], 16);
        const b = parseInt(clean[2] + clean[2], 16);
        return [r, g, b];
      }
      return [(parsed >> 16) & 0xff, (parsed >> 8) & 0xff, parsed & 0xff];
    };

    // Sky RGB Gradients directly from themeRegistry
    const daySky = themeConfig.rendering.sky.day;
    const skyTopRGB = hexStringToRgb(daySky[0]);
    const skyBottomRGB = hexStringToRgb(daySky[daySky.length - 1]);

    // Terrain Surface & Rock + Opaque Sky Buffer
    const imgData = ctx.createImageData(previewW, previewH);
    const data = imgData.data;

    // Thematic Geological Strata Colors from themeRegistry
    const palette = themeConfig.rendering.palette;
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

    const lerpRGB = (c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] => {
      const tc = t < 0 ? 0 : t > 1 ? 1 : t;
      const invT = 1 - tc;
      return [
        Math.round(c1[0] * invT + c2[0] * tc),
        Math.round(c1[1] * invT + c2[1] * tc),
        Math.round(c1[2] * invT + c2[2] * tc),
      ];
    };

    const shadowRGB = hexToRgb(palette.surfaceShadow);
    const deepRGB = hexToRgb(palette.surfaceDeep);

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
          const wave = Math.sin(py * 0.4 + Math.sin(px * 0.08) * 1.5);
          const strataT = 0.5 + 0.5 * wave;
          const strataRGB = lerpRGB(strataARGB, strataBRGB, strataT);

          let color = surfaceRGB;

          if (d <= 1.0) {
            color = surfaceRGB;
          } else if (d <= 2.2) {
            color = lerpRGB(surfaceRGB, shadowRGB, (d - 1.0) / 1.2);
          } else if (d <= 3.5) {
            color = lerpRGB(shadowRGB, deepRGB, (d - 2.2) / 1.3);
          } else if (d <= 5.0) {
            color = lerpRGB(deepRGB, topsoilRGB, (d - 3.5) / 1.5);
          } else if (d <= 8.0) {
            color = topsoilRGB;
          } else if (d <= 12.0) {
            color = lerpRGB(topsoilRGB, strataRGB, (d - 8.0) / 4.0);
          } else if (d <= 20.0) {
            color = strataRGB;
          } else if (d <= 26.0) {
            color = lerpRGB(strataRGB, denseRockRGB, (d - 20.0) / 6.0);
          } else if (d <= 36.0) {
            color = denseRockRGB;
          } else if (d <= 45.0) {
            color = lerpRGB(denseRockRGB, bedrockRGB, (d - 36.0) / 9.0);
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

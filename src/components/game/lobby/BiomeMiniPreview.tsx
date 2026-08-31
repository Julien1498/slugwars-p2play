import React, { useRef, useEffect, memo } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateProceduralTerrain } from '../../../core/terrainGenerator';
import { getThemeConfig } from '../../../core/terrain/themeRegistry';

interface BiomeMiniPreviewProps {
  theme: MapTheme;
  size: MapSize;
  seed: number;
}

export const BiomeMiniPreview: React.FC<BiomeMiniPreviewProps> = memo(({ theme, size, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCfg = MAP_SIZE_CONFIGS[size || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  const width = 172;
  const height = 88;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const terrainData = generateProceduralTerrain(seed, theme, sizeCfg.width, sizeCfg.height);
    const realGrid = terrainData.grid;
    const realW = terrainData.width;
    const realH = terrainData.height;
    const waterLevel = Math.round((terrainData.waterLevel / realH) * height);

    const grid = new Uint8Array(width * height);
    for (let py = 0; py < height; py++) {
      const gy = Math.min(realH - 1, Math.floor((py / height) * realH));
      const gRowOffset = gy * realW;
      const pRowOffset = py * width;
      for (let px = 0; px < width; px++) {
        const gx = Math.min(realW - 1, Math.floor((px / width) * realW));
        if (realGrid[gRowOffset + gx] > 0) {
          grid[pRowOffset + px] = 1;
        }
      }
    }
    const themeConfig = getThemeConfig(theme);

    const hexStringToRgb = (hex: string): [number, number, number] => {
      const clean = hex.replace('#', '');
      const parsed = parseInt(clean, 16);
      if (clean.length === 3) {
        return [
          parseInt(clean[0] + clean[0], 16),
          parseInt(clean[1] + clean[1], 16),
          parseInt(clean[2] + clean[2], 16),
        ];
      }
      return [(parsed >> 16) & 0xff, (parsed >> 8) & 0xff, parsed & 0xff];
    };

    const daySky = themeConfig.rendering.sky.day;
    const skyTopRGB = hexStringToRgb(daySky[0]);
    const skyBottomRGB = hexStringToRgb(daySky[daySky.length - 1]);

    const palette = themeConfig.rendering.palette;
    const hexToRgb = (c: number): [number, number, number] => [c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff];
    const surfaceRGB = hexToRgb(palette.surfaceBody);
    const shadowRGB = hexToRgb(palette.surfaceShadow);
    const topsoilRGB = hexToRgb(palette.soilLight);
    const strataARGB = hexToRgb(palette.strataA);
    const strataBRGB = hexToRgb(palette.strataB);
    const denseRockRGB = hexToRgb(palette.denseRock);
    const bedrockRGB = hexToRgb(palette.bedrock);

    // 2-Pass Distance Transform in Mini Resolution
    const pDist = new Float32Array(width * height);
    pDist.fill(999);
    for (let y = 0; y < height; y++) {
      const rOff = y * width;
      const prevOff = (y - 1) * width;
      for (let x = 0; x < width; x++) {
        const idx = rOff + x;
        if (grid[idx] === 0) {
          pDist[idx] = 0;
        } else {
          let d = 999;
          if (x > 0) d = Math.min(d, pDist[idx - 1] + 1);
          if (y > 0) {
            d = Math.min(d, pDist[prevOff + x] + 1);
            if (x > 0) d = Math.min(d, pDist[prevOff + x - 1] + 1.414);
            if (x < width - 1) d = Math.min(d, pDist[prevOff + x + 1] + 1.414);
          }
          pDist[idx] = d;
        }
      }
    }
    for (let y = height - 1; y >= 0; y--) {
      const rOff = y * width;
      const nextOff = (y + 1) * width;
      for (let x = width - 1; x >= 0; x--) {
        const idx = rOff + x;
        if (grid[idx] === 0) continue;
        let d = pDist[idx];
        if (x < width - 1) d = Math.min(d, pDist[idx + 1] + 1);
        if (y < height - 1) {
          d = Math.min(d, pDist[nextOff + x] + 1);
          if (x > 0) d = Math.min(d, pDist[nextOff + x - 1] + 1.414);
          if (x < width - 1) d = Math.min(d, pDist[nextOff + x + 1] + 1.414);
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

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let py = 0; py < height; py++) {
      const skyT = py / height;
      const skyR = Math.round(skyTopRGB[0] + (skyBottomRGB[0] - skyTopRGB[0]) * skyT);
      const skyG = Math.round(skyTopRGB[1] + (skyBottomRGB[1] - skyTopRGB[1]) * skyT);
      const skyB = Math.round(skyTopRGB[2] + (skyBottomRGB[2] - skyTopRGB[2]) * skyT);
      const rowOffset = py * width;

      for (let px = 0; px < width; px++) {
        const pIdx = rowOffset + px;
        const idx = pIdx * 4;

        if (grid[pIdx] === 1) {
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
            color = lerpRGB(shadowRGB, topsoilRGB, (d - 2.2) / 1.3);
          } else if (d <= 7.0) {
            color = topsoilRGB;
          } else if (d <= 12.0) {
            color = lerpRGB(topsoilRGB, strataRGB, (d - 7.0) / 5.0);
          } else if (d <= 18.0) {
            color = strataRGB;
          } else if (d <= 24.0) {
            color = lerpRGB(strataRGB, denseRockRGB, (d - 18.0) / 6.0);
          } else if (d <= 32.0) {
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

    // Water level with crisp highlight
    ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
    ctx.fillRect(0, waterLevel, width, height - waterLevel);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, waterLevel);
    ctx.lineTo(width, waterLevel);
    ctx.stroke();
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block object-cover rounded-lg pointer-events-none"
    />
  );
});

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

  const width = 112;
  const height = 60;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fast generation at reduced resolution for instant preview (<0.1ms)
    const terrain = generateProceduralTerrain(seed, theme, width, height);
    const { grid, waterLevel } = terrain;
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
    const deepRGB = hexToRgb(palette.surfaceDeep);

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
          // Subtle top surface highlight
          const isSurface = py > 0 && grid[pIdx - width] === 0;
          const color = isSurface ? surfaceRGB : deepRGB;
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

    // Water level
    const waterCanvasY = (waterLevel / height) * height;
    ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
    ctx.fillRect(0, waterCanvasY, width, height - waterCanvasY);
  }, [theme, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full block object-cover rounded-lg pointer-events-none"
    />
  );
});

import React, { useRef, useEffect, memo } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateScaledTerrainGrid } from '../../../core/terrainGenerator';
import { rasterizePreviewToCanvas } from './previewRasterizer';

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
    let animId: number;
    animId = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const terrainData = generateScaledTerrainGrid(seed, theme, width, height, sizeCfg.width, sizeCfg.height);

      rasterizePreviewToCanvas(
        ctx,
        terrainData.grid,
        terrainData.width,
        terrainData.height,
        theme,
        width,
        height,
        terrainData.waterLevel
      );
    });

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full object-cover filter contrast-[1.05]"
    />
  );
});

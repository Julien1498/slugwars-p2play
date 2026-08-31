import React, { useRef, useEffect } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateScaledTerrainGrid } from '../../../core/terrainGenerator';
import { rasterizePreviewToCanvas } from './previewRasterizer';

interface MapThumbnailPreviewProps {
  theme: MapTheme;
  size: MapSize;
  seed: number;
}

export const MapThumbnailPreview: React.FC<MapThumbnailPreviewProps> = ({ theme, size, seed }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeCfg = MAP_SIZE_CONFIGS[size || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;

  const canvasWidth = 480;
  const canvasHeight = 240;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previewW = canvas.width;
    const previewH = canvas.height;

    const terrainData = generateScaledTerrainGrid(seed, theme, previewW, previewH, sizeCfg.width, sizeCfg.height);

    rasterizePreviewToCanvas(
      ctx,
      terrainData.grid,
      terrainData.width,
      terrainData.height,
      theme,
      previewW,
      previewH,
      terrainData.waterLevel
    );
  }, [theme, sizeCfg.width, sizeCfg.height, seed]);

  return (
    <div className="relative w-full h-[180px] md:h-[220px] rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700/60 shadow-inner flex items-center justify-center group">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-full object-contain filter contrast-[1.05]"
      />

      <div className="absolute top-2 left-2 pointer-events-none bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] text-zinc-300 font-mono flex items-center gap-1.5 shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>RADAR HD • {sizeCfg.width}x{sizeCfg.height}</span>
      </div>
    </div>
  );
};

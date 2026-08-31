import React, { useRef, useEffect } from 'react';
import { MapTheme, MapSize, MAP_SIZE_CONFIGS } from '../../../core/types';
import { generateTerrainGridOnly } from '../../../core/terrainGenerator';
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

    const terrainData = generateTerrainGridOnly(seed, theme, previewW, previewH, sizeCfg.width, sizeCfg.height);

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
    <div className="relative rounded-xl overflow-hidden border border-violet-500/30 bg-zinc-950 shadow-inner group w-full aspect-[2/1]">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="w-full h-full block bg-zinc-950"
      />

      <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-white/15 text-[9px] font-mono text-zinc-200 shadow flex items-center gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>SEED #{seed}</span>
      </div>

      <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/85 backdrop-blur-md rounded border border-violet-500/40 text-[9px] font-bold text-violet-300 shadow flex items-center gap-1.5 z-10">
        <span>{sizeCfg.icon}</span>
        <span>{sizeCfg.label} ({sizeCfg.width}×{sizeCfg.height})</span>
      </div>
    </div>
  );
};

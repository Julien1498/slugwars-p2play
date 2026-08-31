import { MapTheme } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';
import { carvePreviewFeatures } from './terrainPreviewCarver';

export interface TerrainPreviewResult {
  grid: Uint8Array;
  width: number;
  height: number;
  waterLevel: number;
}

/**
 * Mathematically scale-invariant procedural terrain generator for lightning-fast UI previews.
 * Evaluates the exact same PRNG sequence & continuous topological equations directly in preview resolution,
 * bypassing entity placement (mines, safe spawns, decor raycasts) for ~300x speedup.
 */
export function generateTerrainPreviewGrid(
  seed: number,
  theme: MapTheme,
  previewWidth: number,
  previewHeight: number,
  nominalWidth: number = 2000,
  nominalHeight: number = 1000
): TerrainPreviewResult {
  const prng = new SeededRandom(seed);
  const grid = new Uint8Array(previewWidth * previewHeight);
  const config = getThemeConfig(theme);

  const scaleX = previewWidth / nominalWidth;
  const scaleY = previewHeight / nominalHeight;
  const waterLevel = Math.round((nominalHeight - 80) * scaleY);

  const baseFreq = prng.range(0.002, 0.004);
  const p1 = prng.range(0, Math.PI * 2);
  const p2 = prng.range(0, Math.PI * 2);
  const p3 = prng.range(0, Math.PI * 2);

  const { heightmapType, overhangs } = config.topology;

  // 1. Precalculate 1D Terrain Heightmap in Preview Resolution
  const baseGroundYPreview = new Float32Array(previewWidth);

  for (let px = 0; px < previewWidth; px++) {
    const x = px / scaleX; // Virtual world coordinate
    let groundY = nominalHeight * 0.52;

    if (heightmapType === 'HILLS') {
      const distFromCenter = Math.abs(x - nominalWidth / 2) / (nominalWidth / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = nominalHeight * 0.42 + noise + edgeDrop;
    } else if (heightmapType === 'FORTRESS') {
      const centerDist = Math.abs(x - nominalWidth / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260;
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50;
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = nominalHeight * 0.4 + noise + castleHeight;
    } else if (heightmapType === 'CAVERN') {
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = nominalHeight * 0.6 + noise * 0.9;
    } else if (heightmapType === 'ARCHIPELAGO') {
      const noise = prng.harmonicNoise(x, baseFreq * 1.3, p1, p2, p3) * 0.75;
      const islandMask = Math.pow(Math.sin((x / nominalWidth) * Math.PI * 3 + p2 * 0.5), 2);
      const trench = (1 - islandMask) * 440;
      const edgeDrop = Math.pow(Math.abs(x - nominalWidth / 2) / (nominalWidth / 2), 3.2) * 500;
      groundY = nominalHeight * 0.42 + noise + trench + edgeDrop;
    } else if (heightmapType === 'ARCHES') {
      const noise = prng.harmonicNoise(x, baseFreq * 0.9, p1, p2, p3);
      const edgeDrop = Math.pow(Math.abs(x - nominalWidth / 2) / (nominalWidth / 2), 2.5) * 400;
      groundY = nominalHeight * 0.38 + noise + edgeDrop;
    } else if (heightmapType === 'SPIRES') {
      const noise = prng.harmonicNoise(x, baseFreq * 2.2, p1, p2, p3) * 0.6;
      const spireHarmonic = Math.pow(Math.sin((x / nominalWidth) * Math.PI * 5 + p1), 6) * -260;
      const edgeDrop = Math.pow(Math.abs(x - nominalWidth / 2) / (nominalWidth / 2), 2.2) * 350;
      groundY = nominalHeight * 0.56 + noise + spireHarmonic + edgeDrop;
    } else if (heightmapType === 'FULL_SLAB') {
      groundY = 16;
    } else {
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = nominalHeight * 0.48 + noise + channel;
    }

    baseGroundYPreview[px] = groundY * scaleY;
  }

  // 2. Fill Base Solid Grid
  if (heightmapType === 'FULL_SLAB') {
    const startY = Math.floor(16 * scaleY);
    grid.fill(1, startY * previewWidth, previewHeight * previewWidth);
  } else {
    for (let px = 0; px < previewWidth; px++) {
      if (heightmapType === 'CAVERN') {
        const x = px / scaleX;
        const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
        const roofY = (nominalHeight * 0.2 + roofNoise) * scaleY;
        const maxRoofY = Math.min(previewHeight, Math.max(0, Math.floor(roofY)));
        for (let py = 0; py < maxRoofY; py++) {
          grid[py * previewWidth + px] = 1;
        }
      }

      const startY = Math.max(0, Math.min(previewHeight - 1, Math.floor(baseGroundYPreview[px])));
      for (let py = startY; py < previewHeight; py++) {
        grid[py * previewWidth + px] = 1;
      }
    }
  }

  // 3. Cliff Overhangs & Rocky Corniches (Synchronized PRNG sequence)
  if (overhangs > 0) {
    for (let i = 0; i < overhangs; i++) {
      const ox = prng.range(160, nominalWidth - 160);
      const surfaceY = (nominalHeight * 0.52);
      const notchWidth = prng.range(50, 90) * scaleX;
      const notchHeight = prng.range(32, 60) * scaleY;
      const roofThickness = prng.range(14, 22) * scaleY;
      const dir = prng.next() > 0.5 ? 1 : -1;

      const pxCenter = Math.floor(ox * scaleX);
      const pySurface = Math.floor(baseGroundYPreview[Math.min(previewWidth - 1, Math.max(0, pxCenter))] || surfaceY * scaleY);
      const notchStartY = Math.floor(pySurface + roofThickness);
      const notchEndY = Math.min(waterLevel - 2, Math.ceil(notchStartY + notchHeight));

      for (let py = notchStartY; py <= notchEndY; py++) {
        const dy = (py - notchStartY) / (notchHeight || 1);
        const currentDepth = Math.round(notchWidth * Math.sin(dy * Math.PI));
        const rowOffset = py * previewWidth;
        for (let d = 0; d < currentDepth; d++) {
          const cx = pxCenter + d * dir;
          if (cx >= 0 && cx < previewWidth) {
            grid[rowOffset + cx] = 0;
          }
        }
      }
    }

    const ledgeCount = overhangs >= 6 ? 5 : 3;
    for (let i = 0; i < ledgeCount; i++) {
      const lx = prng.range(180, nominalWidth - 180) * scaleX;
      const ly = prng.range(nominalHeight * 0.35, (nominalHeight - 80) - 90) * scaleY;
      const ledgeLength = prng.range(55, 95) * scaleX;
      const ledgeThickness = prng.range(12, 18) * scaleY;
      const dir = prng.next() > 0.5 ? 1 : -1;

      const plx = Math.floor(lx);
      const ply = Math.floor(ly);
      for (let t = 0; t < ledgeThickness; t++) {
        const rowOffset = (ply + t) * previewWidth;
        for (let l = 0; l < ledgeLength; l++) {
          const cx = plx + l * dir;
          if (cx >= 0 && cx < previewWidth && (ply + t) < waterLevel) {
            grid[rowOffset + cx] = 1;
          }
        }
      }
    }
  }

  // 4. Subterranean Carving & Floating Islands
  carvePreviewFeatures({
    grid,
    prng,
    config,
    previewWidth,
    previewHeight,
    nominalWidth,
    nominalHeight,
    scaleX,
    scaleY,
    waterLevel,
  });

  return { grid, width: previewWidth, height: previewHeight, waterLevel };
}

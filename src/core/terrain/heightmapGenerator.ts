import { MapTheme } from '../types';
import { SeededRandom } from './SeededRandom';
import { getThemeConfig } from './themeRegistry';

export function generate1DHeightmap(
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  height: number,
  baseFreq: number,
  p1: number,
  p2: number,
  p3: number,
  worldW: number = width,
  worldH: number = height
): Float32Array {
  const baseGroundY = new Float32Array(width);
  const config = getThemeConfig(theme);
  const heightmapType = config.topology.heightmapType;
  const scaleY = height / worldH;

  for (let x = 0; x < width; x++) {
    const wx = (x / width) * worldW;
    let groundY = worldH * 0.52;

    if (heightmapType === 'HILLS') {
      const distFromCenter = Math.abs(wx - worldW / 2) / (worldW / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(wx, baseFreq, p1, p2, p3);
      groundY = worldH * 0.42 + noise + edgeDrop;
    } else if (heightmapType === 'FORTRESS') {
      const centerDist = Math.abs(wx - worldW / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260;
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50;
      }
      const noise = prng.harmonicNoise(wx, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = worldH * 0.4 + noise + castleHeight;
    } else if (heightmapType === 'CAVERN') {
      const noise = prng.harmonicNoise(wx, baseFreq, p1, p2, p3);
      let ground = worldH * 0.6 + noise * 0.9;
      const distFromEdge = Math.min(wx, worldW - wx);
      if (distFromEdge < 180) {
        const flankT = Math.pow(1.0 - distFromEdge / 180, 1.6);
        ground -= flankT * (worldH * 0.18);
      }
      groundY = ground;
    } else if (heightmapType === 'ARCHIPELAGO') {
      const noise = prng.harmonicNoise(wx, baseFreq * 1.3, p1, p2, p3) * 0.75;
      const islandMask = Math.pow(Math.sin((wx / worldW) * Math.PI * 3 + p2 * 0.5), 2);
      const trench = (1 - islandMask) * 440;
      const edgeDrop = Math.pow(Math.abs(wx - worldW / 2) / (worldW / 2), 3.2) * 500;
      groundY = worldH * 0.42 + noise + trench + edgeDrop;
    } else if (heightmapType === 'ARCHES') {
      const noise = prng.harmonicNoise(wx, baseFreq * 0.9, p1, p2, p3);
      const edgeDrop = Math.pow(Math.abs(wx - worldW / 2) / (worldW / 2), 2.5) * 400;
      groundY = worldH * 0.38 + noise + edgeDrop;
    } else if (heightmapType === 'SPIRES') {
      const noise = prng.harmonicNoise(wx, baseFreq * 2.2, p1, p2, p3) * 0.6;
      const spireHarmonic = Math.pow(Math.sin((wx / worldW) * Math.PI * 5 + p1), 6) * -260;
      const edgeDrop = Math.pow(Math.abs(wx - worldW / 2) / (worldW / 2), 2.2) * 350;
      groundY = worldH * 0.56 + noise + spireHarmonic + edgeDrop;
    } else if (heightmapType === 'FULL_SLAB') {
      groundY = 16;
    } else {
      const noise = prng.harmonicNoise(wx, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(wx * 0.007 + p2) * 200;
      groundY = worldH * 0.48 + noise + channel;
    }

    baseGroundY[x] = groundY * scaleY;
  }
  return baseGroundY;
}

export function fillInitialTerrainGrid(
  grid: Uint8Array,
  baseGroundY: Float32Array,
  prng: SeededRandom,
  theme: MapTheme,
  width: number,
  height: number,
  baseFreq: number,
  p1: number,
  p2: number,
  p3: number,
  waterLevel: number,
  worldW: number = width,
  worldH: number = height
) {
  const config = getThemeConfig(theme);
  const { heightmapType, overhangs } = config.topology;
  const scaleX = width / worldW;
  const scaleY = height / worldH;

  if (heightmapType === 'FULL_SLAB') {
    grid.fill(1, Math.round(16 * scaleY) * width, height * width);
  } else {
    for (let x = 0; x < width; x++) {
      const wx = (x / width) * worldW;
      if (heightmapType === 'CAVERN') {
        const roofNoise = prng.harmonicNoise(wx, baseFreq * 1.2, p3, p1, p2) * 0.8;
        let rawRoof = worldH * 0.2 + roofNoise;
        const distFromEdge = Math.min(wx, worldW - wx);
        if (distFromEdge < 180) {
          const flankT = Math.pow(1.0 - distFromEdge / 180, 1.6);
          rawRoof = rawRoof * (1.0 - flankT) + (worldH * 0.52) * flankT;
        }
        const roofY = rawRoof * scaleY;
        const maxRoofY = Math.min(height, Math.max(0, Math.floor(roofY)));
        for (let y = 0; y < maxRoofY; y++) {
          grid[y * width + x] = 1;
        }
      }

      const startY = Math.max(0, Math.min(height - 1, Math.floor(baseGroundY[x])));
      for (let y = startY; y < height; y++) {
        grid[y * width + x] = 1;
      }
    }
  }

  if (overhangs > 0) {
    for (let i = 0; i < overhangs; i++) {
      const rawOx = prng.range(160, worldW - 160);
      const ox = Math.floor(rawOx * scaleX);
      const surfaceY = Math.floor(baseGroundY[ox] || 0);
      if (surfaceY > 60 * scaleY && surfaceY < waterLevel - 90 * scaleY) {
        const notchWidth = Math.floor(prng.range(50, 90) * scaleX);
        const notchHeight = Math.floor(prng.range(32, 60) * scaleY);
        const roofThickness = Math.floor(prng.range(14, 22) * scaleY);
        const dir = prng.next() > 0.5 ? 1 : -1;
        const notchStartY = surfaceY + roofThickness;
        const notchEndY = Math.min(waterLevel - Math.round(30 * scaleY), notchStartY + notchHeight);

        for (let y = notchStartY; y <= notchEndY; y++) {
          const dy = (y - notchStartY) / (notchHeight || 1);
          const currentDepth = Math.round(notchWidth * Math.sin(dy * Math.PI));
          const rowOffset = y * width;
          for (let d = 0; d < currentDepth; d++) {
            const cx = ox + d * dir;
            if (cx >= 0 && cx < width) grid[rowOffset + cx] = 0;
          }
        }
      }
    }

    const ledgeCount = overhangs >= 6 ? 5 : 3;
    for (let i = 0; i < ledgeCount; i++) {
      const rawLx = prng.range(180, worldW - 180);
      const rawLy = prng.range(worldH * 0.35, (worldH - 80) - 90);
      const lx = Math.floor(rawLx * scaleX);
      const ly = Math.floor(rawLy * scaleY);
      const ledgeLength = Math.floor(prng.range(55, 95) * scaleX);
      const ledgeThickness = Math.max(1, Math.floor(prng.range(12, 18) * scaleY));
      const dir = prng.next() > 0.5 ? 1 : -1;

      if (grid[ly * width + lx] === 1) {
        for (let t = 0; t < ledgeThickness; t++) {
          const rowOffset = (ly + t) * width;
          for (let l = 0; l < ledgeLength; l++) {
            const cx = lx + l * dir;
            if (cx >= 0 && cx < width && (ly + t) < waterLevel - 20 * scaleY) {
              if (l < ledgeLength - t * 2) grid[rowOffset + cx] = 1;
            }
          }
        }
      }
    }
  }
}

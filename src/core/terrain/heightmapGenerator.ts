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
  p3: number
): Float32Array {
  // 1. Precalculate 1D Terrain Heightmap in a single ultra-fast pass (<0.5ms)
  const baseGroundY = new Float32Array(width);
  const config = getThemeConfig(theme);
  const heightmapType = config.topology.heightmapType;

  for (let x = 0; x < width; x++) {
    let groundY = height * 0.52;

    if (heightmapType === 'HILLS') {
      const distFromCenter = Math.abs(x - width / 2) / (width / 2);
      const edgeDrop = Math.pow(distFromCenter, 2.8) * 550;
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.42 + noise + edgeDrop;
    } else if (heightmapType === 'FORTRESS') {
      const centerDist = Math.abs(x - width / 2);
      let castleHeight = 0;
      if (centerDist < 120) {
        castleHeight = 260;
      } else if (centerDist > 120 && centerDist < 200) {
        castleHeight = -50;
      }
      const noise = prng.harmonicNoise(x, baseFreq * 0.8, p1, p2, p3) * 0.8;
      groundY = height * 0.4 + noise + castleHeight;
    } else if (heightmapType === 'CAVERN') {
      const noise = prng.harmonicNoise(x, baseFreq, p1, p2, p3);
      groundY = height * 0.6 + noise * 0.9;
    } else if (heightmapType === 'ARCHIPELAGO') {
      // 3 clearly separated oceanic islands with deep sea channels
      const noise = prng.harmonicNoise(x, baseFreq * 1.3, p1, p2, p3) * 0.75;
      const islandMask = Math.pow(Math.sin((x / width) * Math.PI * 3 + p2 * 0.5), 2);
      const trench = (1 - islandMask) * 440;
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 3.2) * 500;
      groundY = height * 0.42 + noise + trench + edgeDrop;
    } else if (heightmapType === 'ARCHES') {
      // Mountain ridges prepared for massive natural rock bridge arches
      const noise = prng.harmonicNoise(x, baseFreq * 0.9, p1, p2, p3);
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 2.5) * 400;
      groundY = height * 0.38 + noise + edgeDrop;
    } else if (heightmapType === 'SPIRES') {
      // Dramatic narrow vertical stone needles and spires with deep gorges
      const noise = prng.harmonicNoise(x, baseFreq * 2.2, p1, p2, p3) * 0.6;
      const spireHarmonic = Math.pow(Math.sin((x / width) * Math.PI * 5 + p1), 6) * -260;
      const edgeDrop = Math.pow(Math.abs(x - width / 2) / (width / 2), 2.2) * 350;
      groundY = height * 0.56 + noise + spireHarmonic + edgeDrop;
    } else if (heightmapType === 'FULL_SLAB') {
      // Solid massive subterranean rock slab
      groundY = 16;
    } else if (heightmapType === 'CHAOS') {
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    } else {
      const noise = prng.harmonicNoise(x, baseFreq * 1.4, p1, p2, p3);
      const channel = Math.sin(x * 0.007 + p2) * 200;
      groundY = height * 0.48 + noise + channel;
    }

    baseGroundY[x] = groundY;
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
  waterLevel: number
) {
  const config = getThemeConfig(theme);
  const { heightmapType, overhangs } = config.topology;

  // 1.5 Fill Terrain Grid from Heightmap (Ultra-fast direct memory write)
  if (heightmapType === 'FULL_SLAB') {
    grid.fill(1, 16 * width, height * width);
  } else {
    for (let x = 0; x < width; x++) {
      // Cavern Roof Ceiling
      if (heightmapType === 'CAVERN') {
        const roofNoise = prng.harmonicNoise(x, baseFreq * 1.2, p3, p1, p2) * 0.8;
        const roofY = height * 0.2 + roofNoise;
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

  // 1.8 Dramatic Cliff Overhangs & Rocky Corniches (Surplombs rocheux & corniches en saillie)
  if (overhangs > 0) {
    const overhangCount = overhangs;
    for (let i = 0; i < overhangCount; i++) {
      const ox = Math.floor(prng.range(160, width - 160));
      const surfaceY = Math.floor(baseGroundY[ox]);
      if (surfaceY > 60 && surfaceY < waterLevel - 90) {
        // Carve an undercut hollow slice under the surface, creating an overhanging cliff roof!
        const notchWidth = Math.floor(prng.range(50, 90));
        const notchHeight = Math.floor(prng.range(32, 60));
        const roofThickness = Math.floor(prng.range(14, 22));
        const dir = prng.next() > 0.5 ? 1 : -1;

        const notchStartY = surfaceY + roofThickness;
        const notchEndY = Math.min(waterLevel - 30, notchStartY + notchHeight);

        for (let y = notchStartY; y <= notchEndY; y++) {
          const dy = (y - notchStartY) / (notchHeight || 1);
          const currentDepth = Math.round(notchWidth * Math.sin(dy * Math.PI));
          const rowOffset = y * width;
          for (let d = 0; d < currentDepth; d++) {
            const cx = ox + d * dir;
            if (cx >= 0 && cx < width) {
              grid[rowOffset + cx] = 0; // Open air carved under the overhang!
            }
          }
        }
      }
    }

    // Protruding Rocky Corniche Ledges (Corniches rocheuses horizontales suspendues)
    const ledgeCount = overhangs >= 6 ? 5 : 3;
    for (let i = 0; i < ledgeCount; i++) {
      const lx = Math.floor(prng.range(180, width - 180));
      const ly = Math.floor(prng.range(height * 0.35, waterLevel - 90));
      const ledgeLength = Math.floor(prng.range(55, 95));
      const ledgeThickness = Math.floor(prng.range(12, 18));
      const dir = prng.next() > 0.5 ? 1 : -1;

      // Only stamp if anchored against solid rock wall
      if (grid[ly * width + lx] === 1) {
        for (let t = 0; t < ledgeThickness; t++) {
          const rowOffset = (ly + t) * width;
          for (let l = 0; l < ledgeLength; l++) {
            const cx = lx + l * dir;
            if (cx >= 0 && cx < width && (ly + t) < waterLevel - 20) {
              if (l < ledgeLength - t * 2) {
                grid[rowOffset + cx] = 1;
              }
            }
          }
        }
      }
    }
  }
}

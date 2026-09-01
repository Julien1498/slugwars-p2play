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
      const centerDist = Math.abs(wx - worldW * 0.5);
      const canyonHalfW = worldW * 0.19 + Math.sin(p1) * (worldW * 0.035);

      // 1. Massive Central Abyss Chasm (Deep plunge into water/death zone)
      let canyonDrop = 0;
      if (centerDist < canyonHalfW) {
        const dropT = Math.pow(1.0 - centerDist / canyonHalfW, 1.15);
        canyonDrop = dropT * (worldH * 0.72);
        // Treacherous tiny rock spike in the abyss
        if (Math.sin(p3) > 0.35 && centerDist < 25) {
          const stoneT = 1.0 - centerDist / 25;
          canyonDrop -= stoneT * (worldH * 0.22);
        }
      }

      // 2. High Bastion Tower on Canyon Rim & Battlements
      let towerRise = 0;
      let crenel = 0;
      const rimWidth = worldW * 0.11;
      if (centerDist >= canyonHalfW && centerDist < canyonHalfW + rimWidth) {
        const towerT = Math.sin(((centerDist - canyonHalfW) / rimWidth) * Math.PI);
        towerRise = towerT * (worldH * 0.20 + Math.cos(p2) * 25);
      } else if (centerDist >= canyonHalfW + rimWidth) {
        const crenelWave = Math.sin((wx / 32) * Math.PI);
        crenel = crenelWave > 0.25 ? -18 : 0;
      }

      // 3. Outer Sea Edge Drop
      const edgeDist = Math.min(wx, worldW - wx);
      let edgeDrop = 0;
      if (edgeDist < 120) {
        edgeDrop = Math.pow(1.0 - edgeDist / 120, 2.0) * (worldH * 0.45);
      }

      const noise = prng.harmonicNoise(wx, baseFreq * 1.0, p1, p2, p3) * 0.55;
      groundY = worldH * 0.36 + noise + canyonDrop - towerRise + crenel + edgeDrop;
    } else if (heightmapType === 'CAVERN') {
      const noise = prng.harmonicNoise(wx, baseFreq * 1.5, p1, p2, p3) * 1.2;
      const macroWave = Math.sin((wx / worldW) * Math.PI * 2.5 + p2) * (worldH * 0.12);
      const microChamber = Math.cos((wx / worldW) * Math.PI * 5 + p1) * (worldH * 0.05);
      let ground = worldH * 0.58 + noise + macroWave + microChamber;

      const leftFlankW = 140 + Math.sin(p1) * 60;
      const rightFlankW = 140 + Math.cos(p2) * 60;
      if (wx < leftFlankW) {
        const flankT = Math.pow(1.0 - wx / leftFlankW, 1.5);
        ground -= flankT * (worldH * 0.22);
      } else if (wx > worldW - rightFlankW) {
        const flankT = Math.pow(1.0 - (worldW - wx) / rightFlankW, 1.5);
        ground -= flankT * (worldH * 0.22);
      }
      groundY = ground;
    } else if (heightmapType === 'ARCHIPELAGO') {
      const u = wx / worldW;
      const noise = prng.harmonicNoise(wx, baseFreq * 1.5, p1, p2, p3) * (worldH * 0.05);

      // 2 or 3 wide, walkable tropical islands based on seed
      const useThreeIslands = Math.sin(p3) > -0.2;
      let islandElevation = 0;

      if (useThreeIslands) {
        const c1 = 0.20 + Math.sin(p1) * 0.025;
        const w1 = 0.17 + Math.cos(p2) * 0.02;
        const c2 = 0.50 + Math.cos(p1) * 0.025;
        const w2 = 0.18 + Math.sin(p2) * 0.02;
        const c3 = 0.80 + Math.sin(p2) * 0.025;
        const w3 = 0.17 + Math.cos(p1) * 0.02;

        for (const [c, w] of [[c1, w1], [c2, w2], [c3, w3]]) {
          const dist = Math.abs(u - c) / w;
          if (dist < 1.0) {
            const dome = Math.cos(dist * Math.PI * 0.5);
            // pow 0.55 gives a wide, walkable rolling plateau on top with gentle beach slopes
            islandElevation = Math.max(islandElevation, Math.pow(dome, 0.55));
          }
        }
      } else {
        const c1 = 0.29 + Math.sin(p1) * 0.03;
        const w1 = 0.24 + Math.cos(p2) * 0.02;
        const c2 = 0.71 + Math.cos(p1) * 0.03;
        const w2 = 0.24 + Math.sin(p2) * 0.02;

        for (const [c, w] of [[c1, w1], [c2, w2]]) {
          const dist = Math.abs(u - c) / w;
          if (dist < 1.0) {
            const dome = Math.cos(dist * Math.PI * 0.5);
            islandElevation = Math.max(islandElevation, Math.pow(dome, 0.55));
          }
        }
      }

      if (islandElevation > 0) {
        // Island peak rises moderately above water, offering comfortable walkable terrain
        const islandPeakRise = worldH * 0.36 + noise;
        groundY = (worldH - 45) - islandElevation * islandPeakRise;
      } else {
        // Deep open ocean water between islands
        groundY = worldH - 35;
      }
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
    } else if (heightmapType === 'FLOATING_ISLANDS') {
      groundY = worldH;
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
  } else if (heightmapType === 'FLOATING_ISLANDS') {
    // Base grid is open sky air; floating islands are stamped in terrainCarver
  } else {
    for (let x = 0; x < width; x++) {
      const wx = (x / width) * worldW;
      if (heightmapType === 'CAVERN') {
        const roofNoise = prng.harmonicNoise(wx, baseFreq * 1.3, p3, p1, p2) * 1.0;
        const roofMacro = Math.sin((wx / worldW) * Math.PI * 3 + p3) * (worldH * 0.08);
        let rawRoof = worldH * 0.22 + roofNoise + roofMacro;

        const leftFlankW = 140 + Math.sin(p1) * 60;
        const rightFlankW = 140 + Math.cos(p2) * 60;
        if (wx < leftFlankW) {
          const flankT = Math.pow(1.0 - wx / leftFlankW, 1.5);
          rawRoof = rawRoof * (1.0 - flankT) + (worldH * 0.52) * flankT;
        } else if (wx > worldW - rightFlankW) {
          const flankT = Math.pow(1.0 - (worldW - wx) / rightFlankW, 1.5);
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

import { DestructibleTerrain } from '../core/terrain';
import { MapTheme } from '../core/types';
import { getPixelHash } from './renderProps';

export interface TerrainBuffers {
  offscreenCanvas: HTMLCanvasElement;
  terrainHitboxCanvas: HTMLCanvasElement;
  distMap: Float32Array;
}

export interface TerrainPalette {
  highlight: number;
  surfaceBody: number;
  surfaceShadow: number;
  surfaceDeep: number;
  soilLight: number;
  strataA: number;
  strataB: number;
  denseRock: number;
  bedrock: number;
  seam: number;
}

export const THEME_PALETTES: Record<MapTheme, TerrainPalette> = {
  ISLAND: {
    highlight: 0xff35e6a3,    // #a3e635 Lime top edge
    surfaceBody: 0xff48a816,  // #16a848 Rich grass green
    surfaceShadow: 0xff2a680e,// #0e682a Dark forest green shadow
    surfaceDeep: 0xff1c3a0c,  // #0c3a1c Deep mossy undercoat
    soilLight: 0xff12223a,    // #3a2212 Rich warm soil
    strataA: 0xff0d182b,      // #2b180d Deep clay sandstone
    strataB: 0xff091120,      // #201109 Deep banded sedimentary stone
    denseRock: 0xff060c16,    // #160c06 Dense subterranean rock
    bedrock: 0xff03060a,      // #0a0603 Abyssal bedrock
    seam: 0xff010204,         // #040201 Deep dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff16a34a,  // #4aa316 Vibrant lagoon green
    surfaceShadow: 0xff127838,// #387812 Rich tropical shadow
    surfaceDeep: 0xff0e4624,  // #24460e Coastal foliage shadow
    soilLight: 0xff1c3852,    // #52381c Coastal coral loam
    strataA: 0xff14293e,      // #3e2914 Sandstone reef stratum
    strataB: 0xff0f1e2e,      // #2e1e0f Deep oceanic strata
    denseRock: 0xff0a141e,    // #1e140a Volcanic trench rock
    bedrock: 0xff050b10,      // #100b05 Abyssal reef bedrock
    seam: 0xff020407,         // #070402 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff067ac2,  // #c27a06 Rich golden ochre sandstone
    surfaceShadow: 0xff093294,// #943209 Terracotta red shadow
    surfaceDeep: 0xff0c2058,  // #58200c Deep ironstone
    soilLight: 0xff101e3e,    // #3e1e10 Deep desert clay
    strataA: 0xff0d1730,      // #30170d Layered canyon sandstone
    strataB: 0xff0a1124,      // #24110a Dark canyon stratum
    denseRock: 0xff070c18,    // #180c07 Heavy iron rock
    bedrock: 0xff04070e,      // #0e0704 Canyon bedrock
    seam: 0xff020306,         // #060302 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff1ca84f,  // #4fa81c Mountain meadow green
    surfaceShadow: 0xff10662e,// #2e6610 Rich pine forest green shadow
    surfaceDeep: 0xff0c3e1e,  // #1e3e0c Deep foliage undercoat
    soilLight: 0xff3d4756,    // #56473d Granite mountain stone
    strataA: 0xff2a323d,      // #3d322a Stratified mountain slate
    strataB: 0xff1d232c,      // #2c231d Dark granite layer
    denseRock: 0xff12161c,    // #1c1612 Deep mountain bedrock
    bedrock: 0xff080b0f,      // #0f0b08 Abyssal mountain core
    seam: 0xff040507,         // #070504 Subtle granite fissure
  },
  CAVERN: {
    highlight: 0xffa8b6c8,    // #c8b6a8 Pale subterranean crust
    surfaceBody: 0xff475569,  // #695547 Cool cavern slate
    surfaceShadow: 0xff334155,// #554133 Dark slate
    surfaceDeep: 0xff242d3b,  // #3b2d24 Damp rock
    soilLight: 0xff1a1622,    // #22161a Amethyst loam
    strataA: 0xff13101b,      // #1b1013 Purple-tinted strata
    strataB: 0xff0e0b14,      // #140b0e Dark cavern stratum
    denseRock: 0xff09070d,    // #0d0709 Heavy subterranean rock
    bedrock: 0xff050408,      // #080405 Charcoal bedrock
    seam: 0xff020204,         // #040202 Deep cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff055da8,  // #a85d05 Warm amber ochre tunnel floor
    surfaceShadow: 0xff073e86,// #863e07 Warm terracotta shadow
    surfaceDeep: 0xff0a2454,  // #54240a Warm subterranean edge
    soilLight: 0xff05132a,    // #2a1305 Warm earthy subterranean rock
    strataA: 0xff040d1e,      // #1e0d04 Stratified warm rock stratum
    strataB: 0xff030915,      // #150903 Dark warm rock band
    denseRock: 0xff02060e,    // #0e0602 Deep warm stone core
    bedrock: 0xff010307,      // #070301 Solid dark warm bedrock
    seam: 0xff000103,         // #030100 Harmonious dark crevice
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff6f7b8c,  // #8c7b6f Ashlar castle stone
    surfaceShadow: 0xff475569,// #695547 Heavy stone masonry
    surfaceDeep: 0xff313c4c,  // #4c3c31 Deep foundation
    soilLight: 0xff212935,    // #352921 Moat loam
    strataA: 0xff171e28,      // #281e17 Fortress bedrock
    strataB: 0xff10151c,      // #1c1510 Stratified dungeon rock
    denseRock: 0xff0b0e13,    // #130e0b Heavy granite base
    bedrock: 0xff06080b,      // #0b0806 Keep bedrock
    seam: 0xff030406,         // #060403 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xff86efac,    // #acef86 Bright mint/emerald moss rim
    surfaceBody: 0xff199443,  // #439419 Lush floating island grass
    surfaceShadow: 0xff10662e,// #2e6610 Rich forest green shadow
    surfaceDeep: 0xff0c3e1e,  // #1e3e0c Deep foliage undercoat
    soilLight: 0xff142740,    // #402714 Warm earthy brown loam
    strataA: 0xff0e1b2e,      // #2e1b0e Stratified floating sandstone
    strataB: 0xff0a1322,      // #22130a Dark suspended rock
    denseRock: 0xff070c17,    // #170c07 Heavy stone core
    bedrock: 0xff04070d,      // #0d0704 Dark basalt underbelly
    seam: 0xff020306,         // #060302 Rock fissure
  },
};

export function createTerrainBuffers(width: number, height: number): TerrainBuffers {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const terrainHitboxCanvas = document.createElement('canvas');
  terrainHitboxCanvas.width = width;
  terrainHitboxCanvas.height = height;

  const distMap = new Float32Array(width * height);
  distMap.fill(99);

  return {
    offscreenCanvas,
    terrainHitboxCanvas,
    distMap,
  };
}

export function redrawOffscreenTerrain(
  terrain: DestructibleTerrain,
  buffers: TerrainBuffers,
  dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const { width, height, grid, theme } = terrain.data;
  const { offscreenCanvas, terrainHitboxCanvas, distMap } = buffers;

  if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
  }
  const offCtx = offscreenCanvas.getContext('2d');
  if (!offCtx) return;

  const isFullScan = !dirtyBox;
  const minX = dirtyBox ? Math.max(0, dirtyBox.minX) : 0;
  const maxX = dirtyBox ? Math.min(width - 1, dirtyBox.maxX) : width - 1;
  const minY = dirtyBox ? Math.max(0, dirtyBox.minY) : 0;
  const maxY = dirtyBox ? Math.min(height - 1, dirtyBox.maxY) : height - 1;

  if (isFullScan) {
    offCtx.clearRect(0, 0, width, height);
  }

  const dirtyW = maxX - minX + 1;
  const dirtyH = maxY - minY + 1;
  const imgData = offCtx.createImageData(dirtyW, dirtyH);
  const data32 = new Uint32Array(imgData.data.buffer);

  // Retrieve Theme-Specific Geological Stratification Palette
  const palette = THEME_PALETTES[theme || 'ISLAND'] || THEME_PALETTES.ISLAND;

  // 2-Pass Integer/Float Distance Transform
  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const prevRowOffset = (y - 1) * width;
    for (let x = minX; x <= maxX; x++) {
      const idx = rowOffset + x;
      if (grid[idx] === 0) {
        distMap[idx] = 0;
      } else {
        let d = 99;
        if (x > minX) {
          const leftD = distMap[idx - 1] + 1;
          if (leftD < d) d = leftD;
        }
        if (y > minY) {
          const topD = distMap[prevRowOffset + x] + 1;
          if (topD < d) d = topD;
          if (x > minX) {
            const diag1 = distMap[prevRowOffset + x - 1] + 1.414;
            if (diag1 < d) d = diag1;
          }
          if (x < maxX) {
            const diag2 = distMap[prevRowOffset + x + 1] + 1.414;
            if (diag2 < d) d = diag2;
          }
        }
        distMap[idx] = d;
      }
    }
  }

  for (let y = maxY; y >= minY; y--) {
    const rowOffset = y * width;
    const nextRowOffset = (y + 1) * width;
    for (let x = maxX; x >= minX; x--) {
      const idx = rowOffset + x;
      if (grid[idx] === 0) continue;
      let d = distMap[idx];
      if (x < maxX) {
        const rightD = distMap[idx + 1] + 1;
        if (rightD < d) d = rightD;
      }
      if (y < maxY) {
        const bottomD = distMap[nextRowOffset + x] + 1;
        if (bottomD < d) d = bottomD;
        if (x < maxX) {
          const diag1 = distMap[nextRowOffset + x + 1] + 1.414;
          if (diag1 < d) d = diag1;
        }
        if (x > minX) {
          const diag2 = distMap[nextRowOffset + x - 1] + 1.414;
          if (diag2 < d) d = diag2;
        }
      }
      distMap[idx] = d;
    }
  }

  // Render Multi-Layer Geological Strata inside Dirty Bounding Box
  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const dirtyRowOffset = (y - minY) * dirtyW;
    for (let x = minX; x <= maxX; x++) {
      const idx = rowOffset + x;
      const dirtyIdx = dirtyRowOffset + (x - minX);

      if (grid[idx] === 1) {
        const airDist = distMap[idx];

        if (airDist <= 1.5) {
          data32[dirtyIdx] = palette.highlight;
        } else if (airDist <= 3.5) {
          data32[dirtyIdx] = palette.surfaceBody;
        } else if (airDist <= 5.5) {
          data32[dirtyIdx] = palette.surfaceShadow;
        } else if (airDist <= 7.5) {
          data32[dirtyIdx] = palette.surfaceDeep;
        } else {
          const bx = (x >> 2);
          const by = (y >> 2);
          const blockHash = getPixelHash(bx, by);

          const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
          if (isSeam && blockHash % 100 < 30) {
            data32[dirtyIdx] = palette.seam;
          } else if (airDist <= 18) {
            data32[dirtyIdx] = palette.soilLight;
          } else if (airDist <= 42) {
            // Geological Strata Banding (subtle horizontal layer alternating every 4-8px)
            const isBand = (y >> 2) & 1;
            data32[dirtyIdx] = isBand ? palette.strataA : palette.strataB;
          } else if (airDist <= 80) {
            data32[dirtyIdx] = palette.denseRock;
          } else {
            data32[dirtyIdx] = palette.bedrock;
          }
        }
      } else {
        data32[dirtyIdx] = 0x00000000;
      }
    }
  }
  offCtx.putImageData(imgData, minX, minY);

  if (isFullScan) {
    // Pre-render Exact Ground Collision Hitbox Mask
    if (terrainHitboxCanvas.width !== width || terrainHitboxCanvas.height !== height) {
      terrainHitboxCanvas.width = width;
      terrainHitboxCanvas.height = height;
    }
    const tbCtx = terrainHitboxCanvas.getContext('2d');
    if (tbCtx) {
      tbCtx.clearRect(0, 0, width, height);
      const tbImgData = tbCtx.createImageData(width, height);
      const tbData32 = new Uint32Array(tbImgData.data.buffer);

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x;
          if (grid[idx] > 0) {
            const d = distMap[idx];
            if (d <= 2.5) {
              tbData32[idx] = 0xff81b910;
            } else {
              tbData32[idx] = 0x3522c55e;
            }
          }
        }
      }
      tbCtx.putImageData(tbImgData, 0, 0);
    }
  }
}

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
    surfaceShadow: 0xff20520a,// #0a5220 Forest green shadow
    surfaceDeep: 0xff142e08,  // #082e14 Deep moss undercoat
    soilLight: 0xff0b1524,    // #24150b Rich dark subterranean soil
    strataA: 0xff070e1a,      // #1a0e07 Deep clay sandstone stratum
    strataB: 0xff050a12,      // #120a05 Dark banded sedimentary stone
    denseRock: 0xff03060c,    // #0c0603 Dense subterranean rock
    bedrock: 0xff020306,      // #060302 Abyssal bedrock
    seam: 0xff010103,         // #030101 Deep dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff16a34a,  // #4aa316 Vibrant lagoon green
    surfaceShadow: 0xff0e602c,// #2c600e Tropical shadow
    surfaceDeep: 0xff0a361a,  // #1a360a Coastal foliage undercoat
    soilLight: 0xff112234,    // #342211 Dark coastal loam
    strataA: 0xff0c1826,      // #26180c Deep sandstone reef stratum
    strataB: 0xff08111c,      // #1c1108 Dark oceanic strata
    denseRock: 0xff050b11,    // #110b05 Volcanic trench rock
    bedrock: 0xff020508,      // #080502 Abyssal reef bedrock
    seam: 0xff010204,         // #040201 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff067ac2,  // #c27a06 Rich golden ochre sandstone
    surfaceShadow: 0xff07287a,// #7a2807 Terracotta red shadow
    surfaceDeep: 0xff08173e,  // #3e1708 Deep ironstone undercoat
    soilLight: 0xff081226,    // #261208 Dark desert clay
    strataA: 0xff060d1c,      // #1c0d06 Deep canyon sandstone
    strataB: 0xff040914,      // #140904 Dark canyon stratum
    denseRock: 0xff03050c,    // #0c0503 Heavy iron rock
    bedrock: 0xff020307,      // #070302 Canyon bedrock
    seam: 0xff010103,         // #030101 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff1ca84f,  // #4fa81c Mountain meadow green
    surfaceShadow: 0xff0c5224,// #24520c Pine forest green shadow
    surfaceDeep: 0xff083014,  // #143008 Deep pine undercoat
    soilLight: 0xff242b35,    // #352b24 Dark granite mountain stone
    strataA: 0xff191e24,      // #241e19 Stratified mountain slate
    strataB: 0xff0f1318,      // #18130f Dark granite layer
    denseRock: 0xff090b0f,    // #0f0b09 Deep mountain bedrock
    bedrock: 0xff030507,      // #070503 Abyssal mountain core
    seam: 0xff020204,         // #040202 Subtle granite fissure
  },
  CAVERN: {
    highlight: 0xffa8b6c8,    // #c8b6a8 Pale subterranean crust
    surfaceBody: 0xff475569,  // #695547 Cool cavern slate
    surfaceShadow: 0xff283445,// #453428 Slate shadow
    surfaceDeep: 0xff1a222e,  // #2e221a Deep cavern rock
    soilLight: 0xff100d15,    // #150d10 Dark amethyst loam
    strataA: 0xff0b0910,      // #10090b Purple-tinted deep strata
    strataB: 0xff08060b,      // #0b0608 Dark cavern stratum
    denseRock: 0xff040307,    // #070304 Heavy subterranean rock
    bedrock: 0xff030204,      // #040203 Charcoal bedrock
    seam: 0xff010102,         // #020101 Deep cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff055da8,  // #a85d05 Warm amber ochre tunnel floor
    surfaceShadow: 0xff05326d,// #6d3205 Terracotta shadow
    surfaceDeep: 0xff061838,  // #381806 Deep warm undercoat
    soilLight: 0xff030b1a,    // #1a0b03 Dark warm subterranean soil
    strataA: 0xff020712,      // #120702 Deep warm rock stratum
    strataB: 0xff01040c,      // #0c0401 Dark warm rock band
    denseRock: 0xff010307,    // #070301 Deep warm stone core
    bedrock: 0xff000104,      // #040100 Solid dark bedrock
    seam: 0xff000002,         // #020000 Harmonious dark crevice
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff6f7b8c,  // #8c7b6f Ashlar castle stone
    surfaceShadow: 0xff384355,// #554338 Stone masonry shadow
    surfaceDeep: 0xff242c38,  // #382c24 Deep foundation undercoat
    soilLight: 0xff131820,    // #201813 Dark moat loam
    strataA: 0xff0c1016,      // #16100c Deep fortress bedrock
    strataB: 0xff080b0f,      // #0f0b08 Stratified dungeon rock
    denseRock: 0xff05070a,    // #0a0705 Heavy granite base
    bedrock: 0xff030405,      // #050403 Keep bedrock
    seam: 0xff010203,         // #030201 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xff86efac,    // #acef86 Bright mint/emerald moss rim
    surfaceBody: 0xff199443,  // #439419 Lush floating island grass
    surfaceShadow: 0xff0c5022,// #22500c Forest green shadow
    surfaceDeep: 0xff083014,  // #143008 Deep foliage undercoat
    soilLight: 0xff0a1626,    // #26160a Dark earthy brown loam
    strataA: 0xff070f1b,      // #1b0f07 Deep floating sandstone
    strataB: 0xff050a13,      // #130a05 Dark suspended rock
    denseRock: 0xff03060c,    // #0c0603 Heavy stone core
    bedrock: 0xff020306,      // #060302 Dark basalt underbelly
    seam: 0xff010103,         // #030101 Rock fissure
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

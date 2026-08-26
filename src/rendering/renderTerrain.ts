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
    surfaceBody: 0xff5ec522,  // #22c55e Rich grass green
    surfaceShadow: 0xff3d8015,// #15803d Dark forest green
    surfaceDeep: 0xff2d5314,  // #14532d Deep undercoat shadow
    soilLight: 0xff183154,    // #543118 Warm topsoil
    strataA: 0xff081427,      // #271408 Darker clay sandstone band
    strataB: 0xff07101e,      // #1e1007 Darker banded sedimentary stone
    denseRock: 0xff0a1626,    // #26160a Deep dense rock
    bedrock: 0xff040914,      // #140904 Deep subterranean dark rock
    seam: 0xff02050b,         // #0b0502 Deep dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff22c55e,  // #5ec522 Vibrant lagoon green
    surfaceShadow: 0xff16a34a,// #4aa316 Rich tropical shadow
    surfaceDeep: 0xff166534,  // #346516 Deep coastal foliage
    soilLight: 0xff2d5778,    // #78572d Coastal coral sand/loam
    strataA: 0xff102338,      // #382310 Darker sandstone reef band
    strataB: 0xff0d1b2b,      // #2b1b0d Darker oceanic strata
    denseRock: 0xff0f2030,    // #30200f Volcanic trench rock
    bedrock: 0xff071018,      // #181007 Abyssal reef bedrock
    seam: 0xff03080c,         // #0c0803 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff089bf5,  // #f59b08 Rich orange sandstone
    surfaceShadow: 0xff0c41c2,// #c2410c Terracotta red
    surfaceDeep: 0xff122d7c,  // #7c2d12 Deep ironstone
    soilLight: 0xff182d5a,    // #5a2d18 Desert clay
    strataA: 0xff09132b,      // #2b1309 Darker canyon sandstone band
    strataB: 0xff090e1e,      // #1e0e09 Darker canyon stratum
    denseRock: 0xff0c1328,    // #28130c Heavy iron rock
    bedrock: 0xff060a17,      // #170a06 Canyon bedrock
    seam: 0xff03050c,         // #0c0503 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff22c55e,  // #5ec522 Mountain meadow green
    surfaceShadow: 0xff15803d,// #3d8015 Rich pine forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff64748b,    // #8b7464 Classic granite mountain stone
    strataA: 0xff27303d,      // #3d3027 Darker mountain slate band
    strataB: 0xff1b232e,      // #2e231b Darker granite layer
    denseRock: 0xff1e293b,    // #3b291e Deep mountain bedrock
    bedrock: 0xff0f172a,      // #2a170f Abyssal mountain core
    seam: 0xff080d17,         // #170d08 Subtle granite fissure
  },
  CAVERN: {
    highlight: 0xffcbd5e1,    // #e1d5cb Pale subterranean crust
    surfaceBody: 0xff64748b,  // #8b7464 Cool cavern slate
    surfaceShadow: 0xff475569,// #695547 Dark slate
    surfaceDeep: 0xff334155,  // #554133 Damp rock
    soilLight: 0xff2a2436,    // #36242a Amethyst loam
    strataA: 0xff120e1a,      // #1a0e12 Darker purple strata band
    strataB: 0xff0d0a12,      // #120a0d Darker cavern stratum
    denseRock: 0xff110e17,    // #170e11 Heavy subterranean rock
    bedrock: 0xff0a080e,      // #0e080a Charcoal bedrock
    seam: 0xff050407,         // #070405 Deep cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff0677d9,  // #d97706 Warm amber ochre tunnel floor
    surfaceShadow: 0xff0953b4,// #b45309 Warm terracotta shadow
    surfaceDeep: 0xff0f3578,  // #78350f Warm subterranean edge
    soilLight: 0xff081c3d,    // #3d1c08 Warm earthy subterranean rock
    strataA: 0xff020918,      // #180902 Darker warm rock stratum band
    strataB: 0xff020711,      // #110702 Darker warm rock band
    denseRock: 0xff030914,    // #140903 Deep warm stone core
    bedrock: 0xff02050c,      // #0c0502 Solid dark warm bedrock
    seam: 0xff010307,         // #070301 Harmonious subtle dark crevice (Zero eye strain)
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff94a3b8,  // #b8a394 Ashlar castle stone
    surfaceShadow: 0xff64748b,// #8b7464 Heavy stone masonry
    surfaceDeep: 0xff475569,  // #695547 Deep foundation
    soilLight: 0xff334155,    // #554133 Moat loam
    strataA: 0xff131b26,      // #261b13 Darker fortress bedrock band
    strataB: 0xff0f131a,      // #1a130f Darker dungeon rock
    denseRock: 0xff141a22,    // #221a14 Heavy granite base
    bedrock: 0xff0c1015,      // #15100c Keep bedrock
    seam: 0xff06080b,         // #0b0806 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xff86efac,    // #acef86 Bright mint/emerald moss rim
    surfaceBody: 0xff22c55e,  // #5ec522 Lush floating island grass
    surfaceShadow: 0xff15803d,// #3d8015 Rich forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff1e3a5f,    // #5f3a1e Warm earthy brown loam
    strataA: 0xff091629,      // #291609 Darker floating sandstone band
    strataB: 0xff09111f,      // #1f1109 Darker suspended rock
    denseRock: 0xff0c1626,    // #26160c Heavy stone core
    bedrock: 0xff060a12,      // #120a06 Dark basalt underbelly
    seam: 0xff03060a,         // #0a0603 Rock fissure
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

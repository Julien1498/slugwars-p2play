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
    soilLight: 0xff142842,    // #422814 Balanced rich soil
    strataA: 0xff050e1c,      // #1c0e05 Very dark clay sandstone band
    strataB: 0xff030a14,      // #140a03 Deep dark sedimentary band
    denseRock: 0xff02060d,    // #0d0602 Deep subterranean rock
    bedrock: 0xff010306,      // #060301 Abyssal bedrock
    seam: 0xff000103,         // #030100 Dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff22c55e,  // #5ec522 Vibrant lagoon green
    surfaceShadow: 0xff16a34a,// #4aa316 Rich tropical shadow
    surfaceDeep: 0xff166534,  // #346516 Deep coastal foliage
    soilLight: 0xff203e58,    // #583e20 Balanced coastal loam
    strataA: 0xff0a1624,      // #24160a Deep sandstone reef band
    strataB: 0xff060f1a,      // #1a0f06 Dark oceanic strata
    denseRock: 0xff040910,    // #100904 Volcanic trench rock
    bedrock: 0xff020408,      // #080402 Abyssal reef bedrock
    seam: 0xff010204,         // #040201 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff089bf5,  // #f59b08 Rich orange sandstone
    surfaceShadow: 0xff0c41c2,// #c2410c Terracotta red
    surfaceDeep: 0xff122d7c,  // #7c2d12 Deep ironstone
    soilLight: 0xff142448,    // #482414 Balanced desert clay
    strataA: 0xff050c1c,      // #1c0c05 Deep canyon sandstone band
    strataB: 0xff040814,      // #140804 Dark canyon stratum
    denseRock: 0xff02050c,    // #0c0502 Heavy iron rock
    bedrock: 0xff010306,      // #060301 Canyon bedrock
    seam: 0xff000103,         // #030100 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff22c55e,  // #5ec522 Mountain meadow green
    surfaceShadow: 0xff15803d,// #3d8015 Rich pine forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff3c4856,    // #56483c Balanced granite mountain stone
    strataA: 0xff1a1f26,      // #261f1a Dark mountain slate band
    strataB: 0xff12161c,      // #1c1612 Dark mountain stratum
    denseRock: 0xff0b0d10,    // #100d0b Deep mountain bedrock
    bedrock: 0xff050608,      // #080605 Abyssal mountain core
    seam: 0xff020304,         // #040302 Subtle granite fissure
  },
  CAVERN: {
    highlight: 0xffcbd5e1,    // #e1d5cb Pale subterranean crust
    surfaceBody: 0xff64748b,  // #8b7464 Cool cavern slate
    surfaceShadow: 0xff475569,// #695547 Dark slate
    surfaceDeep: 0xff334155,  // #554133 Damp rock
    soilLight: 0xff221824,    // #241822 Balanced amethyst loam
    strataA: 0xff0e0a10,      // #100a0e Deep purple strata band
    strataB: 0xff09060b,      // #0b0609 Dark cavern stratum
    denseRock: 0xff060407,    // #070406 Heavy rock
    bedrock: 0xff030204,      // #040203 Charcoal bedrock
    seam: 0xff010102,         // #020101 Cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff0677d9,  // #d97706 Warm amber ochre tunnel floor
    surfaceShadow: 0xff0953b4,// #b45309 Warm terracotta shadow
    surfaceDeep: 0xff0f3578,  // #78350f Warm subterranean edge
    soilLight: 0xff081630,    // #301608 Balanced amber subterranean earth
    strataA: 0xff020714,      // #140702 Deep warm rock band
    strataB: 0xff01040d,      // #0d0401 Dark warm rock stratum
    denseRock: 0xff010308,    // #080301 Deep warm stone
    bedrock: 0xff000104,      // #040100 Solid dark bedrock
    seam: 0xff000002,         // #020000 Harmonious dark crevice
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff94a3b8,  // #b8a394 Ashlar castle stone
    surfaceShadow: 0xff64748b,// #8b7464 Heavy stone masonry
    surfaceDeep: 0xff475569,  // #695547 Deep foundation
    soilLight: 0xff1e242c,    // #2c241e Balanced moat loam
    strataA: 0xff101318,      // #181310 Deep fortress bedrock band
    strataB: 0xff0a0d10,      // #100d0a Stratified dungeon rock
    denseRock: 0xff06080a,    // #0a0806 Heavy granite base
    bedrock: 0xff030405,      // #050403 Keep bedrock
    seam: 0xff010203,         // #030201 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xff86efac,    // #acef86 Bright mint/emerald moss rim
    surfaceBody: 0xff22c55e,  // #5ec522 Lush floating island grass
    surfaceShadow: 0xff15803d,// #3d8015 Rich forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff162a44,    // #442a16 Balanced earthy brown loam
    strataA: 0xff070f1c,      // #1c0f07 Deep floating sandstone band
    strataB: 0xff050a14,      // #140a05 Dark suspended rock
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

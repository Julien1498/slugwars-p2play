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
    soilLight: 0xff172e4e,    // #4e2e17 Balanced rich soil
    strataA: 0xff0e131e,      // #1e130e Clay sandstone band
    strataB: 0xff0c1019,      // #19100c Sedimentary band
    denseRock: 0xff0a0c12,    // #120c0a Deep subterranean rock
    bedrock: 0xff08070b,      // #0b0708 Abyssal bedrock
    seam: 0xff070507,         // #070507 Dark soil crack
  },
  ARCHIPELAGO: {
    highlight: 0xff4ade80,    // #80de4a Tropical palm lime
    surfaceBody: 0xff22c55e,  // #5ec522 Vibrant lagoon green
    surfaceShadow: 0xff16a34a,// #4aa316 Rich tropical shadow
    surfaceDeep: 0xff166534,  // #346516 Deep coastal foliage
    soilLight: 0xff203c56,    // #563c20 Coastal loam
    strataA: 0xff0e1824,      // #24180e Sandstone reef band
    strataB: 0xff0c131d,      // #1d130c Oceanic strata
    denseRock: 0xff090d14,    // #140d09 Volcanic trench rock
    bedrock: 0xff06070b,      // #0b0706 Abyssal reef bedrock
    seam: 0xff040407,         // #070404 Coral seam
  },
  NATURAL_ARCHES: {
    highlight: 0xff2bf0f5,    // #f5f02b Sunlit golden sand rim
    surfaceBody: 0xff089bf5,  // #f59b08 Rich orange sandstone
    surfaceShadow: 0xff0c41c2,// #c2410c Terracotta red
    surfaceDeep: 0xff122d7c,  // #7c2d12 Deep ironstone
    soilLight: 0xff162854,    // #542816 Desert clay
    strataA: 0xff0a1224,      // #24120a Canyon sandstone band
    strataB: 0xff080e1e,      // #1e0e08 Canyon stratum
    denseRock: 0xff060a15,    // #150a06 Heavy iron rock
    bedrock: 0xff04060c,      // #0c0604 Canyon bedrock
    seam: 0xff020307,         // #070302 Mineral seam
  },
  SPIRES: {
    highlight: 0xff86efac,    // #acef86 Alpine grass rim
    surfaceBody: 0xff22c55e,  // #5ec522 Mountain meadow green
    surfaceShadow: 0xff15803d,// #3d8015 Rich pine forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff605248,    // #485260 Granite mountain stone
    strataA: 0xff26201c,      // #1c2026 Mountain slate band
    strataB: 0xff201a17,      // #171a20 Mountain stratum
    denseRock: 0xff171310,    // #101317 Deep mountain bedrock
    bedrock: 0xff0d0b09,      // #090b0d Abyssal mountain core
    seam: 0xff080706,         // #060708 Granite fissure
  },
  CAVERN: {
    highlight: 0xffcbd5e1,    // #e1d5cb Pale subterranean crust
    surfaceBody: 0xff64748b,  // #8b7464 Cool cavern slate
    surfaceShadow: 0xff475569,// #695547 Dark slate
    surfaceDeep: 0xff334155,  // #554133 Damp rock
    soilLight: 0xff382632,    // #322638 Amethyst loam
    strataA: 0xff20141b,      // #1b1420 Purple strata band
    strataB: 0xff1a1016,      // #16101a Cavern stratum
    denseRock: 0xff130b10,    // #100b13 Heavy subterranean rock
    bedrock: 0xff0c070a,      // #0a070c Charcoal bedrock
    seam: 0xff070406,         // #060407 Cave fissure
  },
  ORGANIC_CAVES: {
    highlight: 0xff24bffb,    // #fbbf24 Golden amber highlight rim
    surfaceBody: 0xff0677d9,  // #d97706 Warm amber ochre tunnel floor
    surfaceShadow: 0xff0953b4,// #b45309 Warm terracotta shadow
    surfaceDeep: 0xff0f3578,  // #78350f Warm subterranean edge
    soilLight: 0xff10244e,    // #4e2410 Amber subterranean earth
    strataA: 0xff061022,      // #221006 Warm rock band
    strataB: 0xff050d1c,      // #1c0d05 Warm rock stratum
    denseRock: 0xff040913,    // #130904 Deep warm stone
    bedrock: 0xff02050b,      // #0b0502 Solid dark bedrock
    seam: 0xff010307,         // #070301 Dark crevice
  },
  FORTRESS: {
    highlight: 0xffa3e635,    // #35e6a3 Rampart moss
    surfaceBody: 0xff94a3b8,  // #b8a394 Ashlar castle stone
    surfaceShadow: 0xff64748b,// #8b7464 Heavy stone masonry
    surfaceDeep: 0xff475569,  // #695547 Deep foundation
    soilLight: 0xff483c34,    // #343c48 Moat loam
    strataA: 0xff241d18,      // #181d24 Fortress bedrock band
    strataB: 0xff1d1714,      // #14171d Dungeon rock
    denseRock: 0xff15110e,    // #0e1115 Heavy granite base
    bedrock: 0xff0c0a08,      // #080a0c Keep bedrock
    seam: 0xff070605,         // #050607 Mortar seam
  },
  FLOATING_CHAOS: {
    highlight: 0xff86efac,    // #acef86 Bright mint/emerald moss rim
    surfaceBody: 0xff22c55e,  // #5ec522 Lush floating island grass
    surfaceShadow: 0xff15803d,// #3d8015 Rich forest green shadow
    surfaceDeep: 0xff14532d,  // #2d5314 Deep foliage undercoat
    soilLight: 0xff183252,    // #523218 Earthy brown loam
    strataA: 0xff0a1420,      // #20140a Floating sandstone band
    strataB: 0xff08101a,      // #1a1008 Suspended rock
    denseRock: 0xff060b12,    // #120b06 Heavy stone core
    bedrock: 0xff04070b,      // #0b0704 Dark basalt underbelly
    seam: 0xff030407,         // #070403 Rock fissure
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

export function lerpColor32(c1: number, c2: number, t: number): number {
  if (t <= 0) return c1;
  if (t >= 1) return c2;
  const invT = 1 - t;

  const r = ((c1 & 0xff) * invT + (c2 & 0xff) * t + 0.5) | 0;
  const g = (((c1 >> 8) & 0xff) * invT + ((c2 >> 8) & 0xff) * t + 0.5) | 0;
  const b = (((c1 >> 16) & 0xff) * invT + ((c2 >> 16) & 0xff) * t + 0.5) | 0;

  return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
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

        if (airDist <= 1.2) {
          data32[dirtyIdx] = palette.highlight;
        } else if (airDist <= 3.2) {
          data32[dirtyIdx] = lerpColor32(palette.highlight, palette.surfaceBody, (airDist - 1.2) / 2.0);
        } else if (airDist <= 5.2) {
          data32[dirtyIdx] = lerpColor32(palette.surfaceBody, palette.surfaceShadow, (airDist - 3.2) / 2.0);
        } else if (airDist <= 7.2) {
          data32[dirtyIdx] = lerpColor32(palette.surfaceShadow, palette.surfaceDeep, (airDist - 5.2) / 2.0);
        } else {
          const bx = (x >> 2);
          const by = (y >> 2);
          const blockHash = getPixelHash(bx, by);

          const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
          if (isSeam && blockHash % 100 < 30) {
            data32[dirtyIdx] = palette.seam;
          } else {
            // Geological Strata Banding with organic undulating wave
            const wave = Math.sin(y * 0.35 + Math.sin(x * 0.05) * 1.5);
            const strataT = 0.5 + 0.5 * wave;
            const strataColor = lerpColor32(palette.strataA, palette.strataB, strataT);

            if (airDist <= 10.0) {
              data32[dirtyIdx] = lerpColor32(palette.surfaceDeep, palette.soilLight, (airDist - 7.2) / 2.8);
            } else if (airDist <= 16.0) {
              data32[dirtyIdx] = palette.soilLight;
            } else if (airDist <= 22.0) {
              data32[dirtyIdx] = lerpColor32(palette.soilLight, strataColor, (airDist - 16.0) / 6.0);
            } else if (airDist <= 38.0) {
              data32[dirtyIdx] = strataColor;
            } else if (airDist <= 48.0) {
              data32[dirtyIdx] = lerpColor32(strataColor, palette.denseRock, (airDist - 38.0) / 10.0);
            } else if (airDist <= 72.0) {
              data32[dirtyIdx] = palette.denseRock;
            } else if (airDist <= 88.0) {
              data32[dirtyIdx] = lerpColor32(palette.denseRock, palette.bedrock, (airDist - 72.0) / 16.0);
            } else {
              data32[dirtyIdx] = palette.bedrock;
            }
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

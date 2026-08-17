import { DestructibleTerrain } from '../core/terrain';
import { getPixelHash } from './renderProps';

export interface TerrainBuffers {
  offscreenCanvas: HTMLCanvasElement;
  occlusionCanvas: HTMLCanvasElement;
  terrainHitboxCanvas: HTMLCanvasElement;
  distMap: Float32Array;
}

export function createTerrainBuffers(width: number, height: number): TerrainBuffers {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  const occlusionCanvas = document.createElement('canvas');
  occlusionCanvas.width = width;
  occlusionCanvas.height = height;

  const terrainHitboxCanvas = document.createElement('canvas');
  terrainHitboxCanvas.width = width;
  terrainHitboxCanvas.height = height;

  const distMap = new Float32Array(width * height);
  distMap.fill(99);

  return {
    offscreenCanvas,
    occlusionCanvas,
    terrainHitboxCanvas,
    distMap,
  };
}

export function redrawOffscreenTerrain(
  terrain: DestructibleTerrain,
  buffers: TerrainBuffers,
  dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number }
) {
  const { width, height, grid } = terrain.data;
  const { offscreenCanvas, occlusionCanvas, terrainHitboxCanvas, distMap } = buffers;

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

  // Fast Little-Endian ABGR 32-bit integer colors
  const grassHighlight = 0xff35e6a3; // #a3e635 Lime top edge
  const grassBody = 0xff5ec522;      // #22c55e Rich grass green
  const grassShadow = 0xff3d8015;    // #15803d Dark forest green
  const grassDeep = 0xff2d5314;      // #14532d Deep undercoat shadow

  const soilLight = 0xff183154;   // #543118 Warm topsoil
  const soilMedium = 0xff11233d;  // #3d2311 Rich earthy brown
  const soilDark = 0xff040914;    // #140904 Deep subterranean dark rock
  const soilSeam = 0xff02050b;    // #0b0502 Deep dark soil crack/seam

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

  // Render Terrain Pixels inside Dirty Bounding Box
  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const dirtyRowOffset = (y - minY) * dirtyW;
    for (let x = minX; x <= maxX; x++) {
      const idx = rowOffset + x;
      const dirtyIdx = dirtyRowOffset + (x - minX);

      if (grid[idx] === 1) {
        const airDist = distMap[idx];

        if (airDist <= 1.5) {
          data32[dirtyIdx] = grassHighlight;
        } else if (airDist <= 3.5) {
          data32[dirtyIdx] = grassBody;
        } else if (airDist <= 5.5) {
          data32[dirtyIdx] = grassShadow;
        } else if (airDist <= 7.0) {
          data32[dirtyIdx] = grassDeep;
        } else {
          const bx = (x / 4) | 0;
          const by = (y / 4) | 0;
          const blockHash = getPixelHash(bx, by);

          const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
          if (isSeam && blockHash % 100 < 35) {
            data32[dirtyIdx] = soilSeam;
          } else if (airDist <= 12) {
            data32[dirtyIdx] = soilLight;
          } else if (airDist <= 24) {
            data32[dirtyIdx] = soilMedium;
          } else {
            data32[dirtyIdx] = soilDark;
          }
        }
      } else {
        data32[dirtyIdx] = 0x00000000;
      }
    }
  }
  offCtx.putImageData(imgData, minX, minY);

  if (isFullScan) {
    // Pre-render Subterranean Soil Occlusion Mask
    if (occlusionCanvas.width !== width || occlusionCanvas.height !== height) {
      occlusionCanvas.width = width;
      occlusionCanvas.height = height;
    }
    const occCtx = occlusionCanvas.getContext('2d');
    if (occCtx) {
      occCtx.clearRect(0, 0, width, height);
      const occImgData = occCtx.createImageData(width, height);
      const occData32 = new Uint32Array(occImgData.data.buffer);

      for (let y = 0; y < height; y++) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x++) {
          const idx = rowOffset + x;
          if (grid[idx] === 1) {
            const d = distMap[idx];
            if (d > 7) {
              const alpha = Math.min(145, Math.floor((d - 7) * 9));
              occData32[idx] = (alpha << 24) | 0x0a0503;
            }
          }
        }
      }
      occCtx.putImageData(occImgData, 0, 0);
    }

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

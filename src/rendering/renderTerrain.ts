import { DestructibleTerrain } from '../core/terrain';
import { MapTheme } from '../core/types';
import { getThemeConfig } from '../core/terrain/themeRegistry';
import { getPixelHash } from './renderProps';
import { drawSolidPropVector } from './props/renderDestructibleProp';

export interface TerrainBuffers {
  offscreenCanvas: HTMLCanvasElement;
  propsOffscreenCanvas: HTMLCanvasElement;
  terrainHitboxCanvas: HTMLCanvasElement;
  distMap: Float32Array;
  contentBounds: { minX: number; maxX: number; minY: number; maxY: number };
  mipmapCanvas?: HTMLCanvasElement;
}

export function createTerrainBuffers(width: number, height: number): TerrainBuffers {
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width; offscreenCanvas.height = height;
  const propsOffscreenCanvas = document.createElement('canvas');
  propsOffscreenCanvas.width = width; propsOffscreenCanvas.height = height;
  const terrainHitboxCanvas = document.createElement('canvas');
  terrainHitboxCanvas.width = width; terrainHitboxCanvas.height = height;
  const distMap = new Float32Array(width * height);
  distMap.fill(99);
  const contentBounds = { minX: 0, maxX: width, minY: 0, maxY: height };
  const mipmapCanvas = document.createElement('canvas');
  mipmapCanvas.width = Math.round(width / 2); mipmapCanvas.height = Math.round(height / 2);
  return { offscreenCanvas, propsOffscreenCanvas, terrainHitboxCanvas, distMap, contentBounds, mipmapCanvas };
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

import { TerrainPalette, THEME_PALETTES } from './terrainPalettes';

export type { TerrainPalette };
export { THEME_PALETTES };

let _sharedDirtyImageData: ImageData | null = null;
let _sharedDirtyData32: Uint32Array | null = null;

function getSharedDirtyImageData(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
): { imgData: ImageData; data32: Uint32Array } {
  if (!_sharedDirtyImageData || _sharedDirtyImageData.width < w || _sharedDirtyImageData.height < h) {
    const allocW = Math.max(512, w);
    const allocH = Math.max(512, h);
    _sharedDirtyImageData = ctx.createImageData(allocW, allocH);
    _sharedDirtyData32 = new Uint32Array(_sharedDirtyImageData.data.buffer);
  }
  return { imgData: _sharedDirtyImageData, data32: _sharedDirtyData32! };
}

export function rebuildPropsOffscreenCanvas(
  buffers: TerrainBuffers,
  solidProps?: import('../core/types').SolidProp[],
  craters?: import('../core/types').CraterRecord[]
) {
  const pCanvas = buffers.propsOffscreenCanvas;
  if (!pCanvas) return;
  const pCtx = pCanvas.getContext('2d');
  if (!pCtx) return;
  pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  if (solidProps) {
    for (let i = 0; i < solidProps.length; i++) {
      const sp = solidProps[i];
      if (!sp.destroyed) drawSolidPropVector(pCtx, sp);
    }
  }
  if (craters && craters.length > 0) {
    pCtx.save();
    pCtx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      pCtx.beginPath();
      pCtx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      pCtx.fill();
    }
    pCtx.restore();
  }
}

export function redrawOffscreenTerrain(
  terrain: DestructibleTerrain,
  buffers: TerrainBuffers,
  dirtyBox?: { minX: number; maxX: number; minY: number; maxY: number },
  craters?: import('../core/types').CraterRecord[]
) {
  const { width, height, grid, theme } = terrain.data;
  const { offscreenCanvas, terrainHitboxCanvas, distMap, propsOffscreenCanvas } = buffers;

  if (offscreenCanvas.width !== width || offscreenCanvas.height !== height) {
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
  }
  if (propsOffscreenCanvas && (propsOffscreenCanvas.width !== width || propsOffscreenCanvas.height !== height)) {
    propsOffscreenCanvas.width = width;
    propsOffscreenCanvas.height = height;
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
    rebuildPropsOffscreenCanvas(buffers, terrain.data.solidProps, craters);

    let bMinX = width;
    let bMaxX = 0;
    let bMinY = height;
    let bMaxY = 0;
    for (let y = 0; y < height; y++) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        if (grid[row + x] > 0) {
          if (x < bMinX) bMinX = x; if (x > bMaxX) bMaxX = x;
          if (y < bMinY) bMinY = y; if (y > bMaxY) bMaxY = y;
        }
      }
    }
    buffers.contentBounds = {
      minX: bMinX <= bMaxX ? Math.max(0, bMinX) : 0,
      maxX: bMinX <= bMaxX ? Math.min(width, bMaxX + 1) : width,
      minY: bMinY <= bMaxY ? Math.max(0, bMinY) : 0,
      maxY: bMinY <= bMaxY ? Math.min(height, bMaxY + 1) : height,
    };
  }

  const dirtyW = maxX - minX + 1;
  const dirtyH = maxY - minY + 1;
  const { imgData, data32 } = getSharedDirtyImageData(offCtx, dirtyW, dirtyH);
  const bufWidth = imgData.width;

  // Retrieve Theme-Specific Geological Stratification Palette
  const palette = getThemeConfig(theme).rendering.palette;

  // 2-Pass Float Distance Transform
  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const prevRowOffset = (y - 1) * width;
    const hasTop = y > minY;
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
        if (hasTop) {
          const topIdx = prevRowOffset + x;
          const topD = distMap[topIdx] + 1;
          if (topD < d) d = topD;
          if (x > minX) {
            const diag1 = distMap[topIdx - 1] + 1.414;
            if (diag1 < d) d = diag1;
          }
          if (x < maxX) {
            const diag2 = distMap[topIdx + 1] + 1.414;
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
    const hasBottom = y < maxY;
    for (let x = maxX; x >= minX; x--) {
      const idx = rowOffset + x;
      if (grid[idx] === 0) continue;
      let d = distMap[idx];
      if (x < maxX) {
        const rightD = distMap[idx + 1] + 1;
        if (rightD < d) d = rightD;
      }
      if (hasBottom) {
        const bottomIdx = nextRowOffset + x;
        const bottomD = distMap[bottomIdx] + 1;
        if (bottomD < d) d = bottomD;
        if (x < maxX) {
          const diag1 = distMap[bottomIdx + 1] + 1.414;
          if (diag1 < d) d = diag1;
        }
        if (x > minX) {
          const diag2 = distMap[bottomIdx - 1] + 1.414;
          if (diag2 < d) d = diag2;
        }
      }
      distMap[idx] = d;
    }
  }

  // Precalculate column-invariant trigonometric terms once per width (<0.01ms)
  const sinXTable = new Float32Array(dirtyW);
  for (let x = minX; x <= maxX; x++) {
    sinXTable[x - minX] = Math.sin(x * 0.05) * 1.5;
  }

  // Render Multi-Layer Geological Strata inside Dirty Bounding Box
  for (let y = minY; y <= maxY; y++) {
    const rowOffset = y * width;
    const dirtyRowOffset = (y - minY) * bufWidth;
    const yFactor = y * 0.35;
    for (let x = minX; x <= maxX; x++) {
      const idx = rowOffset + x;
      const xOffset = x - minX;
      const dirtyIdx = dirtyRowOffset + xOffset;

      if (grid[idx] === 1) {
        const airDist = distMap[idx];

        if (airDist <= 1.2) data32[dirtyIdx] = palette.highlight;
        else if (airDist <= 3.2) data32[dirtyIdx] = lerpColor32(palette.highlight, palette.surfaceBody, (airDist - 1.2) / 2.0);
        else if (airDist <= 5.2) data32[dirtyIdx] = lerpColor32(palette.surfaceBody, palette.surfaceShadow, (airDist - 3.2) / 2.0);
        else if (airDist <= 7.2) data32[dirtyIdx] = lerpColor32(palette.surfaceShadow, palette.surfaceDeep, (airDist - 5.2) / 2.0);
        else {
          const bx = (x >> 2);
          const by = (y >> 2);
          const blockHash = getPixelHash(bx, by);
          const isSeam = (x % 4 === 0 && ((y >> 2) % 2 === 0)) || (y % 4 === 0);
          if (isSeam && blockHash % 100 < 30) {
            data32[dirtyIdx] = palette.seam;
          } else {
            const wave = Math.sin(yFactor + sinXTable[xOffset]);
            const strataT = 0.5 + 0.5 * wave;
            const strataColor = lerpColor32(palette.strataA, palette.strataB, strataT);

            if (airDist <= 10.0) data32[dirtyIdx] = lerpColor32(palette.surfaceDeep, palette.soilLight, (airDist - 7.2) / 2.8);
            else if (airDist <= 16.0) data32[dirtyIdx] = palette.soilLight;
            else if (airDist <= 22.0) data32[dirtyIdx] = lerpColor32(palette.soilLight, strataColor, (airDist - 16.0) / 6.0);
            else if (airDist <= 38.0) data32[dirtyIdx] = strataColor;
            else if (airDist <= 48.0) data32[dirtyIdx] = lerpColor32(strataColor, palette.denseRock, (airDist - 38.0) / 10.0);
            else if (airDist <= 72.0) data32[dirtyIdx] = palette.denseRock;
            else if (airDist <= 88.0) data32[dirtyIdx] = lerpColor32(palette.denseRock, palette.bedrock, (airDist - 72.0) / 16.0);
            else data32[dirtyIdx] = palette.bedrock;
          }
        }
      } else {
        data32[dirtyIdx] = 0x00000000;
      }
    }
  }
  offCtx.putImageData(imgData, minX, minY, 0, 0, dirtyW, dirtyH);

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
        const row = y * width;
        for (let x = 0; x < width; x++) if (grid[row + x] > 0) tbData32[row + x] = distMap[row + x] <= 2.5 ? 0xff81b910 : 0x3522c55e;
      }
      tbCtx.putImageData(tbImgData, 0, 0);
    }
  }

  // Update 0.5x Mipmap for high-efficiency dezoom
  if (buffers.mipmapCanvas) {
    const mW = Math.round(width / 2);
    const mH = Math.round(height / 2);
    if (buffers.mipmapCanvas.width !== mW) buffers.mipmapCanvas.width = mW;
    if (buffers.mipmapCanvas.height !== mH) buffers.mipmapCanvas.height = mH;
    const mCtx = buffers.mipmapCanvas.getContext('2d');
    if (mCtx) {
      mCtx.clearRect(0, 0, mW, mH);
      mCtx.drawImage(offscreenCanvas, 0, 0, mW, mH);
    }
  }
}

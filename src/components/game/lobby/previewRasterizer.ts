import { MapTheme } from '../../../core/types';
import { PREVIEW_RGB_PALETTES, RGB } from './previewPalettes';

const MAX_PREVIEW_PIXELS = 480 * 240;
const _SHARED_GRID = new Uint8Array(MAX_PREVIEW_PIXELS);
const _SHARED_DIST = new Float32Array(MAX_PREVIEW_PIXELS);
const _IMG_DATA_CACHE = new Map<string, ImageData>();

function getSharedImageData(ctx: CanvasRenderingContext2D, width: number, height: number): ImageData {
  const key = `${width}x${height}`;
  let img = _IMG_DATA_CACHE.get(key);
  if (!img) {
    img = ctx.createImageData(width, height);
    _IMG_DATA_CACHE.set(key, img);
  }
  return img;
}

function lerpRGB(c1: RGB, c2: RGB, t: number, out: [number, number, number]): void {
  const tc = t < 0 ? 0 : t > 1 ? 1 : t;
  const invT = 1 - tc;
  out[0] = (c1[0] * invT + c2[0] * tc) | 0;
  out[1] = (c1[1] * invT + c2[1] * tc) | 0;
  out[2] = (c1[2] * invT + c2[2] * tc) | 0;
}

const _TEMP_STRATA: RGB = [0, 0, 0];
const _TEMP_COLOR: RGB = [0, 0, 0];

/**
 * Ultra-High Performance Zero-Allocation preview rasterizer.
 * Employs 32-bit integer direct memory store instructions and static buffer recycling.
 */
export function rasterizePreviewToCanvas(
  ctx: CanvasRenderingContext2D,
  realGrid: Uint8Array,
  realW: number,
  realH: number,
  theme: MapTheme,
  previewW: number,
  previewH: number,
  waterLevelY: number
): void {
  const totalPixels = previewW * previewH;
  const palette = PREVIEW_RGB_PALETTES[theme] || PREVIEW_RGB_PALETTES.ISLAND;
  const { skyTop, skyBottom, surface, shadow, topsoil, strataA, strataB, denseRock, bedrock, packedSurface, packedTopsoil, packedDenseRock, packedBedrock } = palette;

  // 1. Zero-Alloc Downsampling of the real physical simulation grid
  for (let py = 0; py < previewH; py++) {
    const gy = ((py / previewH) * realH) | 0;
    const gRowOffset = gy * realW;
    const pRowOffset = py * previewW;
    for (let px = 0; px < previewW; px++) {
      const gx = ((px / previewW) * realW) | 0;
      _SHARED_GRID[pRowOffset + px] = realGrid[gRowOffset + gx] > 0 ? 1 : 0;
    }
  }

  // 2. 2-Pass Distance Transform in Shared Buffer
  for (let i = 0; i < totalPixels; i++) {
    _SHARED_DIST[i] = _SHARED_GRID[i] === 0 ? 0 : 999;
  }

  for (let y = 0; y < previewH; y++) {
    const rOff = y * previewW;
    const prevOff = (y - 1) * previewW;
    for (let x = 0; x < previewW; x++) {
      const idx = rOff + x;
      if (_SHARED_GRID[idx] === 0) continue;
      let d = 999;
      if (x > 0) d = Math.min(d, _SHARED_DIST[idx - 1] + 1);
      if (y > 0) {
        d = Math.min(d, _SHARED_DIST[prevOff + x] + 1);
        if (x > 0) d = Math.min(d, _SHARED_DIST[prevOff + x - 1] + 1.414);
        if (x < previewW - 1) d = Math.min(d, _SHARED_DIST[prevOff + x + 1] + 1.414);
      }
      _SHARED_DIST[idx] = d;
    }
  }

  for (let y = previewH - 1; y >= 0; y--) {
    const rOff = y * previewW;
    const nextOff = (y + 1) * previewW;
    for (let x = previewW - 1; x >= 0; x--) {
      const idx = rOff + x;
      if (_SHARED_GRID[idx] === 0) continue;
      let d = _SHARED_DIST[idx];
      if (x < previewW - 1) d = Math.min(d, _SHARED_DIST[idx + 1] + 1);
      if (y < previewH - 1) {
        d = Math.min(d, _SHARED_DIST[nextOff + x] + 1);
        if (x > 0) d = Math.min(d, _SHARED_DIST[nextOff + x - 1] + 1.414);
        if (x < previewW - 1) d = Math.min(d, _SHARED_DIST[nextOff + x + 1] + 1.414);
      }
      _SHARED_DIST[idx] = d;
    }
  }

  // 3. Ultra-Fast 32-Bit Direct Memory Store into Cached ImageData Buffer
  const imgData = getSharedImageData(ctx, previewW, previewH);
  const data32 = new Uint32Array(imgData.data.buffer);

  for (let py = 0; py < previewH; py++) {
    const skyT = py / previewH;
    const skyR = (skyTop[0] + (skyBottom[0] - skyTop[0]) * skyT) | 0;
    const skyG = (skyTop[1] + (skyBottom[1] - skyTop[1]) * skyT) | 0;
    const skyB = (skyTop[2] + (skyBottom[2] - skyTop[2]) * skyT) | 0;
    const skyPacked = ((255 << 24) | (skyB << 16) | (skyG << 8) | skyR) >>> 0;
    const rowOffset = py * previewW;

    for (let px = 0; px < previewW; px++) {
      const pIdx = rowOffset + px;

      if (_SHARED_GRID[pIdx] === 1) {
        const d = _SHARED_DIST[pIdx];

        if (d <= 1.0) {
          data32[pIdx] = packedSurface;
        } else if (d <= 2.2) {
          lerpRGB(surface, shadow, (d - 1.0) / 1.2, _TEMP_COLOR);
          data32[pIdx] = ((255 << 24) | (_TEMP_COLOR[2] << 16) | (_TEMP_COLOR[1] << 8) | _TEMP_COLOR[0]) >>> 0;
        } else if (d <= 3.5) {
          lerpRGB(shadow, topsoil, (d - 2.2) / 1.3, _TEMP_COLOR);
          data32[pIdx] = ((255 << 24) | (_TEMP_COLOR[2] << 16) | (_TEMP_COLOR[1] << 8) | _TEMP_COLOR[0]) >>> 0;
        } else if (d <= 8.0) {
          data32[pIdx] = packedTopsoil;
        } else if (d <= 14.0) {
          const wave = Math.sin(py * 0.35 + Math.sin(px * 0.05) * 1.8);
          const strataT = 0.5 + 0.5 * wave;
          lerpRGB(strataA, strataB, strataT, _TEMP_STRATA);
          lerpRGB(topsoil, _TEMP_STRATA, (d - 8.0) / 6.0, _TEMP_COLOR);
          data32[pIdx] = ((255 << 24) | (_TEMP_COLOR[2] << 16) | (_TEMP_COLOR[1] << 8) | _TEMP_COLOR[0]) >>> 0;
        } else if (d <= 22.0) {
          const wave = Math.sin(py * 0.35 + Math.sin(px * 0.05) * 1.8);
          const strataT = 0.5 + 0.5 * wave;
          lerpRGB(strataA, strataB, strataT, _TEMP_STRATA);
          data32[pIdx] = ((255 << 24) | (_TEMP_STRATA[2] << 16) | (_TEMP_STRATA[1] << 8) | _TEMP_STRATA[0]) >>> 0;
        } else if (d <= 30.0) {
          const wave = Math.sin(py * 0.35 + Math.sin(px * 0.05) * 1.8);
          const strataT = 0.5 + 0.5 * wave;
          lerpRGB(strataA, strataB, strataT, _TEMP_STRATA);
          lerpRGB(_TEMP_STRATA, denseRock, (d - 22.0) / 8.0, _TEMP_COLOR);
          data32[pIdx] = ((255 << 24) | (_TEMP_COLOR[2] << 16) | (_TEMP_COLOR[1] << 8) | _TEMP_COLOR[0]) >>> 0;
        } else if (d <= 42.0) {
          data32[pIdx] = packedDenseRock;
        } else {
          data32[pIdx] = packedBedrock;
        }
      } else {
        data32[pIdx] = skyPacked;
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. Crisp High-Resolution Water Level Line
  ctx.fillStyle = 'rgba(14, 165, 233, 0.75)';
  ctx.fillRect(0, waterLevelY, previewW, previewH - waterLevelY);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, waterLevelY);
  ctx.lineTo(previewW, waterLevelY);
  ctx.stroke();
}

import { MapTheme } from '../../../core/types';
import { THEME_CONFIGS } from '../../../core/terrain/themeRegistry';

export type RGB = [number, number, number];

export interface PreviewThematicPalette {
  skyTop: RGB;
  skyBottom: RGB;
  surface: RGB;
  shadow: RGB;
  topsoil: RGB;
  strataA: RGB;
  strataB: RGB;
  denseRock: RGB;
  bedrock: RGB;
  // 32-bit packed ABGR values for ultra-fast single-instruction memory writes
  packedSurface: number;
  packedTopsoil: number;
  packedDenseRock: number;
  packedBedrock: number;
}

function hexStringToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const parsed = parseInt(clean, 16);
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ];
  }
  return [(parsed >> 16) & 0xff, (parsed >> 8) & 0xff, parsed & 0xff];
}

function hexNumberToRgb(c: number): RGB {
  return [c & 0xff, (c >> 8) & 0xff, (c >> 16) & 0xff];
}

function packRgb(rgb: RGB): number {
  return ((255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0]) >>> 0;
}

/**
 * Precalculated O(1) Data-Driven RGB palette table for all map themes.
 * Evaluated once at module load to avoid any runtime string allocations or hex parsing.
 */
export const PREVIEW_RGB_PALETTES: Record<MapTheme, PreviewThematicPalette> = Object.entries(THEME_CONFIGS).reduce(
  (acc, [themeKey, config]) => {
    const daySky = config.rendering.sky.day;
    const p = config.rendering.palette;
    const surface = hexNumberToRgb(p.surfaceBody);
    const topsoil = hexNumberToRgb(p.soilLight);
    const denseRock = hexNumberToRgb(p.denseRock);
    const bedrock = hexNumberToRgb(p.bedrock);

    acc[themeKey as MapTheme] = {
      skyTop: hexStringToRgb(daySky[0]),
      skyBottom: hexStringToRgb(daySky[daySky.length - 1]),
      surface,
      shadow: hexNumberToRgb(p.surfaceShadow),
      topsoil,
      strataA: hexNumberToRgb(p.strataA),
      strataB: hexNumberToRgb(p.strataB),
      denseRock,
      bedrock,
      packedSurface: packRgb(surface),
      packedTopsoil: packRgb(topsoil),
      packedDenseRock: packRgb(denseRock),
      packedBedrock: packRgb(bedrock),
    };
    return acc;
  },
  {} as Record<MapTheme, PreviewThematicPalette>
);

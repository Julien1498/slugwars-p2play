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

/**
 * Precalculated O(1) Data-Driven RGB palette table for all map themes.
 * Evaluated once at module load to avoid any runtime string allocations or hex parsing.
 */
export const PREVIEW_RGB_PALETTES: Record<MapTheme, PreviewThematicPalette> = Object.entries(THEME_CONFIGS).reduce(
  (acc, [themeKey, config]) => {
    const daySky = config.rendering.sky.day;
    const p = config.rendering.palette;
    acc[themeKey as MapTheme] = {
      skyTop: hexStringToRgb(daySky[0]),
      skyBottom: hexStringToRgb(daySky[daySky.length - 1]),
      surface: hexNumberToRgb(p.surfaceBody),
      shadow: hexNumberToRgb(p.surfaceShadow),
      topsoil: hexNumberToRgb(p.soilLight),
      strataA: hexNumberToRgb(p.strataA),
      strataB: hexNumberToRgb(p.strataB),
      denseRock: hexNumberToRgb(p.denseRock),
      bedrock: hexNumberToRgb(p.bedrock),
    };
    return acc;
  },
  {} as Record<MapTheme, PreviewThematicPalette>
);

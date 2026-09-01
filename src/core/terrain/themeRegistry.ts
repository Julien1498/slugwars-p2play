import { MapTheme } from '../types';
import { ISLAND_THEME } from './themes/islandTheme';
import { CAVERN_THEME, ORGANIC_CAVES_THEME } from './themes/cavernThemes';
import { ARCHIPELAGO_THEME } from './themes/archipelagoThemes';
import { OPAL_ISLAND_THEME } from './themes/opalIslandTheme';
import {
  FORTRESS_THEME,
  NATURAL_ARCHES_THEME,
  SPIRES_THEME,
} from './themes/outdoorThemes';
import { ThemeConfig } from './themeTypes';

export * from './themeTypes';

export const THEME_CONFIGS: Record<MapTheme, ThemeConfig> = {
  ISLAND: ISLAND_THEME,
  CAVERN: CAVERN_THEME,
  ORGANIC_CAVES: ORGANIC_CAVES_THEME,
  FORTRESS: FORTRESS_THEME,
  OPAL_ISLAND: OPAL_ISLAND_THEME,
  ARCHIPELAGO: ARCHIPELAGO_THEME,
  NATURAL_ARCHES: NATURAL_ARCHES_THEME,
  SPIRES: SPIRES_THEME,
};

export function getThemeConfig(theme: MapTheme = 'ISLAND'): ThemeConfig {
  return THEME_CONFIGS[theme] || THEME_CONFIGS.ISLAND;
}

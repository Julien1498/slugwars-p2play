import { MapTheme } from '../types';
import { TerrainPalette } from './terrainPalettes';

export type GeologicalPalette = TerrainPalette;

export interface ThemeTopologyConfig {
  heightmapType: 'HILLS' | 'CAVERN' | 'FORTRESS' | 'ARCHIPELAGO' | 'ARCHES' | 'SPIRES' | 'FULL_SLAB' | 'OPAL_ISLAND' | 'FLOATING_ISLANDS';
  tunnels: number;
  diggers: number;
  arches: number;
  overhangs: number;
  floatingIslands: number;
}

export interface ThemePhysicsConfig {
  hasSolidCeiling: boolean;
  searchStartY: number;
  minHeadroom: number;
}

export interface ThemeDecorRules {
  bunkers: number;
  totems: number;
  cacti: number;
  crystals: number;
  oilDrums: number;
  lampposts: number;
  trees: number;
  hedgehogs: number;
  chicks: number;
  mushrooms: number;
  flowers: number;
  hangingLeaves: number;
  butterflies: number;
}

export interface ThemeMountainRendering {
  ridgeColor: { day: string; night: string };
  gradient: { day: [string, string]; night: [string, string] };
  highlightStroke?: string;
}

export interface ThemeWaterRendering {
  gradient: { day: string[]; night: string[] };
  bgGradient: { day: string[]; night: string[] };
  midWaveColor: { day: string; night: string };
  frontWaveColor: { day: string; night: string };
  outerRimColor: { day: string; night: string };
  foamColor: { day: string; night: string };
}

export interface ThemeCelestialConfig {
  day: 'SUN' | 'NONE';
  night: 'MOON' | 'CHAOS_RIFT' | 'SEARCHLIGHT' | 'NONE';
}

export interface ThemeRenderingConfig {
  palette: GeologicalPalette;
  sky: {
    day: [string, string, ...string[]];
    night: [string, string, ...string[]];
  };
  mountains: ThemeMountainRendering;
  water: ThemeWaterRendering;
  atmosphere: 'OPEN_AIR' | 'CAVERN_BEAMS';
  celestial: ThemeCelestialConfig;
}

export interface ThemeConfig {
  id: MapTheme;
  label: string;
  icon: string;
  desc: string;
  topology: ThemeTopologyConfig;
  physics: ThemePhysicsConfig;
  decor: ThemeDecorRules;
  rendering: ThemeRenderingConfig;
}

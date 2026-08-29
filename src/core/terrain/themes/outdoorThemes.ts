import { ThemeConfig } from '../themeTypes';
import { THEME_PALETTES } from '../terrainPalettes';

export const FORTRESS_THEME: ThemeConfig = {
  id: 'FORTRESS',
  label: 'Deux Forteresses',
  icon: '🏰',
  desc: 'Canyons & châteaux',
  topology: {
    heightmapType: 'FORTRESS',
    tunnels: 4,
    diggers: 0,
    arches: 0,
    overhangs: 4,
    floatingIslands: 2,
  },
  physics: {
    hasSolidCeiling: false,
    searchStartY: 40,
    minHeadroom: 22,
  },
  decor: {
    bunkers: 2,
    totems: 2,
    cacti: 3,
    crystals: 4,
    oilDrums: 3,
    lampposts: 2,
    trees: 3,
    hedgehogs: 2,
    chicks: 2,
    mushrooms: 5,
    flowers: 6,
    hangingLeaves: 4,
    butterflies: 6,
  },
  rendering: {
    palette: THEME_PALETTES.FORTRESS,
    sky: {
      day: ['#0f172a', '#0369a1', '#0284c7', '#38bdf8', '#e0f2fe'],
      night: ['#020408', '#070b14', '#0f172a', '#1e293b'],
    },
    mountains: {
      ridgeColor: { day: '#14532d', night: '#070b16' },
      gradient: {
        day: ['rgba(71, 85, 105, 0.75)', 'rgba(20, 83, 45, 0.90)'],
        night: ['rgba(15, 23, 42, 0.88)', 'rgba(9, 13, 22, 0.95)'],
      },
      highlightStroke: '#4ade80',
    },
    water: {
      gradient: {
        day: ['rgba(6, 182, 212, 0.65)', 'rgba(2, 132, 199, 0.78)', 'rgba(3, 105, 161, 0.90)', 'rgba(2, 6, 23, 0.99)'],
        night: ['rgba(14, 165, 233, 0.70)', 'rgba(2, 132, 199, 0.82)', 'rgba(3, 105, 161, 0.92)', 'rgba(2, 6, 23, 0.99)'],
      },
      bgGradient: {
        day: ['#0284c7', '#0369a1', '#0c4a6e', '#082f49'],
        night: ['#020408', '#070b14', '#0f172a', '#1e293b'],
      },
      midWaveColor: { day: 'rgba(14, 165, 233, 0.55)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(2, 132, 199, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(56, 189, 248, 0.70)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'OPEN_AIR',
    celestial: { day: 'SUN', night: 'SEARCHLIGHT' },
  },
};

export const NATURAL_ARCHES_THEME: ThemeConfig = {
  id: 'NATURAL_ARCHES',
  label: 'Arches & Ponts',
  icon: '🌉',
  desc: 'Viaducs rocheux & cavernes',
  topology: {
    heightmapType: 'ARCHES',
    tunnels: 3,
    diggers: 0,
    arches: 3,
    overhangs: 5,
    floatingIslands: 2,
  },
  physics: {
    hasSolidCeiling: false,
    searchStartY: 40,
    minHeadroom: 22,
  },
  decor: {
    bunkers: 2,
    totems: 2,
    cacti: 3,
    crystals: 4,
    oilDrums: 3,
    lampposts: 2,
    trees: 3,
    hedgehogs: 2,
    chicks: 2,
    mushrooms: 5,
    flowers: 6,
    hangingLeaves: 4,
    butterflies: 6,
  },
  rendering: {
    palette: THEME_PALETTES.NATURAL_ARCHES,
    sky: {
      day: ['#7c2d12', '#c2410c', '#ea580c', '#f59e0b', '#fef08a'],
      night: ['#1c0a00', '#2e1065', '#4c1d95', '#1e1b4b'],
    },
    mountains: {
      ridgeColor: { day: '#7c2d12', night: '#2e1065' },
      gradient: {
        day: ['rgba(194, 65, 12, 0.75)', 'rgba(124, 45, 18, 0.95)'],
        night: ['rgba(76, 29, 149, 0.85)', 'rgba(30, 27, 75, 0.95)'],
      },
    },
    water: {
      gradient: {
        day: ['rgba(6, 182, 212, 0.65)', 'rgba(2, 132, 199, 0.78)', 'rgba(3, 105, 161, 0.90)', 'rgba(2, 6, 23, 0.99)'],
        night: ['rgba(14, 165, 233, 0.70)', 'rgba(2, 132, 199, 0.82)', 'rgba(3, 105, 161, 0.92)', 'rgba(2, 6, 23, 0.99)'],
      },
      bgGradient: {
        day: ['#9a3412', '#7c2d12', '#431407', '#270a03'],
        night: ['#1c0a00', '#2e1065', '#4c1d95', '#1e1b4b'],
      },
      midWaveColor: { day: 'rgba(14, 165, 233, 0.55)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(2, 132, 199, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(56, 189, 248, 0.70)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'OPEN_AIR',
    celestial: { day: 'NONE', night: 'NONE' },
  },
};

export const SPIRES_THEME: ThemeConfig = {
  id: 'SPIRES',
  label: 'Aiguilles & Pics',
  icon: '🏔️',
  desc: 'Pics verticaux & gouffres',
  topology: {
    heightmapType: 'SPIRES',
    tunnels: 4,
    diggers: 0,
    arches: 0,
    overhangs: 6,
    floatingIslands: 2,
  },
  physics: {
    hasSolidCeiling: false,
    searchStartY: 40,
    minHeadroom: 22,
  },
  decor: {
    bunkers: 2,
    totems: 2,
    cacti: 3,
    crystals: 4,
    oilDrums: 3,
    lampposts: 2,
    trees: 3,
    hedgehogs: 2,
    chicks: 2,
    mushrooms: 5,
    flowers: 6,
    hangingLeaves: 4,
    butterflies: 6,
  },
  rendering: {
    palette: THEME_PALETTES.SPIRES,
    sky: {
      day: ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#f0f9ff'],
      night: ['#020617', '#0f172a', '#1e293b', '#334155'],
    },
    mountains: {
      ridgeColor: { day: '#334155', night: '#0f172a' },
      gradient: {
        day: ['rgba(71, 85, 105, 0.75)', 'rgba(30, 41, 59, 0.95)'],
        night: ['rgba(15, 23, 42, 0.85)', 'rgba(7, 10, 22, 0.95)'],
      },
      highlightStroke: '#4ade80',
    },
    water: {
      gradient: {
        day: ['rgba(6, 182, 212, 0.65)', 'rgba(2, 132, 199, 0.78)', 'rgba(3, 105, 161, 0.90)', 'rgba(2, 6, 23, 0.99)'],
        night: ['rgba(14, 165, 233, 0.70)', 'rgba(2, 132, 199, 0.82)', 'rgba(3, 105, 161, 0.92)', 'rgba(2, 6, 23, 0.99)'],
      },
      bgGradient: {
        day: ['#0284c7', '#0369a1', '#0c4a6e', '#082f49'],
        night: ['#020617', '#0f172a', '#1e293b', '#334155'],
      },
      midWaveColor: { day: 'rgba(14, 165, 233, 0.55)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(2, 132, 199, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(56, 189, 248, 0.70)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'OPEN_AIR',
    celestial: { day: 'SUN', night: 'MOON' },
  },
};

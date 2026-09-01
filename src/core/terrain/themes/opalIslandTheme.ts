import { ThemeConfig } from '../themeTypes';
import { THEME_PALETTES } from '../terrainPalettes';

export const OPAL_ISLAND_THEME: ThemeConfig = {
  id: 'OPAL_ISLAND',
  label: 'Île Opale',
  icon: '💎',
  desc: 'Falaises claires & galeries marines',
  topology: {
    heightmapType: 'OPAL_ISLAND',
    tunnels: 4,
    diggers: 0,
    arches: 0,
    overhangs: 4,
    floatingIslands: 3,
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
    palette: THEME_PALETTES.OPAL_ISLAND,
    sky: {
      day: ['#0369a1', '#0284c7', '#38bdf8', '#e0f2fe'],
      night: ['#02040a', '#070d1a', '#0f172a', '#1e293b'],
    },
    mountains: {
      ridgeColor: { day: '#047857', night: '#0b0417' },
      gradient: {
        day: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.90)'],
        night: ['rgba(30, 11, 60, 0.85)', 'rgba(8, 3, 19, 0.95)'],
      },
      highlightStroke: '#6ee7b7',
    },
    water: {
      gradient: {
        day: ['rgba(6, 182, 212, 0.65)', 'rgba(2, 132, 199, 0.78)', 'rgba(3, 105, 161, 0.90)', 'rgba(2, 6, 23, 0.99)'],
        night: ['rgba(14, 165, 233, 0.70)', 'rgba(2, 132, 199, 0.82)', 'rgba(3, 105, 161, 0.92)', 'rgba(2, 6, 23, 0.99)'],
      },
      bgGradient: {
        day: ['#0284c7', '#0369a1', '#0c4a6e', '#082f49'],
        night: ['#02040a', '#070d1a', '#0f172a', '#1e293b'],
      },
      midWaveColor: { day: 'rgba(14, 165, 233, 0.55)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(2, 132, 199, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(56, 189, 248, 0.70)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'OPEN_AIR',
    celestial: { day: 'SUN', night: 'CHAOS_RIFT' },
  },
};

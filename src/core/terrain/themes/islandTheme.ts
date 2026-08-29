import { ThemeConfig } from '../themeRegistry';
import { THEME_PALETTES } from '../../../rendering/terrainPalettes';

export const ISLAND_THEME: ThemeConfig = {
  id: 'ISLAND',
  label: 'Île Émeraude',
  icon: '🏝️',
  desc: 'Collines verdoyantes & plage',
  topology: {
    heightmapType: 'HILLS',
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
    palette: THEME_PALETTES.ISLAND,
    sky: {
      day: ['#0369a1', '#0284c7', '#38bdf8', '#e0f2fe'],
      night: ['#02040a', '#070d1a', '#0f172a', '#1e1b4b'],
    },
    mountains: {
      ridgeColor: { day: '#15803d', night: '#070b16' },
      gradient: {
        day: ['rgba(34, 197, 94, 0.75)', 'rgba(21, 128, 61, 0.90)'],
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
        night: ['#02040a', '#070d1a', '#0f172a', '#1e1b4b'],
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

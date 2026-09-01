import { ThemeConfig } from '../themeTypes';
import { THEME_PALETTES } from '../terrainPalettes';

export const FLOATING_ARCHIPELAGO_THEME: ThemeConfig = {
  id: 'FLOATING_ARCHIPELAGO',
  label: 'Archipel Flottant',
  icon: '☁️',
  desc: 'Îlots suspendus & abîme céleste',
  topology: {
    heightmapType: 'FLOATING_ISLANDS',
    tunnels: 0,
    diggers: 0,
    arches: 0,
    overhangs: 2,
    floatingIslands: 6,
  },
  physics: {
    hasSolidCeiling: false,
    searchStartY: 30,
    minHeadroom: 20,
  },
  decor: {
    bunkers: 1,
    totems: 2,
    cacti: 0,
    crystals: 5,
    oilDrums: 3,
    lampposts: 2,
    trees: 4,
    hedgehogs: 2,
    chicks: 2,
    mushrooms: 4,
    flowers: 8,
    hangingLeaves: 6,
    butterflies: 8,
  },
  rendering: {
    palette: THEME_PALETTES.FLOATING_ARCHIPELAGO,
    sky: {
      day: ['#0284c7', '#38bdf8', '#7dd3fc', '#bae6fd', '#f0f9ff'],
      night: ['#030712', '#0f172a', '#1e1b4b', '#312e81'],
    },
    mountains: {
      ridgeColor: { day: '#059669', night: '#1e1b4b' },
      gradient: {
        day: ['rgba(16, 185, 129, 0.75)', 'rgba(5, 150, 105, 0.90)'],
        night: ['rgba(30, 27, 75, 0.85)', 'rgba(15, 23, 42, 0.95)'],
      },
      highlightStroke: '#a7f3d0',
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

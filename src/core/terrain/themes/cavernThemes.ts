import { ThemeConfig } from '../themeRegistry';
import { THEME_PALETTES } from '../../../rendering/terrainPalettes';

export const CAVERN_THEME: ThemeConfig = {
  id: 'CAVERN',
  label: 'Grotte Caverne',
  icon: '🦇',
  desc: 'Plafond rocheux & tunnels',
  topology: {
    heightmapType: 'CAVERN',
    tunnels: 8,
    diggers: 0,
    arches: 0,
    overhangs: 4,
    floatingIslands: 2,
  },
  physics: {
    hasSolidCeiling: true,
    searchStartY: 120,
    minHeadroom: 22,
  },
  decor: {
    bunkers: 2,
    totems: 2,
    cacti: 0,
    crystals: 4,
    oilDrums: 3,
    lampposts: 0,
    trees: 0,
    hedgehogs: 2,
    chicks: 2,
    mushrooms: 5,
    flowers: 0,
    hangingLeaves: 8,
    butterflies: 0,
  },
  rendering: {
    palette: THEME_PALETTES.CAVERN,
    sky: {
      day: ['#451a03', '#78350f', '#b45309', '#d97706', '#fef08a'],
      night: ['#030102', '#170605', '#2b0c07', '#451a03'],
    },
    mountains: {
      ridgeColor: { day: '#78350f', night: '#0d0403' },
      gradient: {
        day: ['rgba(180, 83, 9, 0.75)', 'rgba(120, 53, 15, 0.95)'],
        night: ['rgba(15, 23, 42, 0.85)', 'rgba(7, 10, 22, 0.95)'],
      },
    },
    water: {
      gradient: {
        day: ['rgba(253, 224, 71, 0.85)', 'rgba(249, 115, 22, 0.88)', 'rgba(220, 38, 38, 0.94)', 'rgba(23, 6, 2, 0.99)'],
        night: ['rgba(239, 68, 68, 0.85)', 'rgba(153, 27, 27, 0.94)', 'rgba(3, 1, 2, 0.99)'],
      },
      bgGradient: {
        day: ['#78350f', '#451a03', '#1c0a02', '#0c0401'],
        night: ['#451a03', '#1c0a02', '#0c0401', '#030102'],
      },
      midWaveColor: { day: 'rgba(249, 115, 22, 0.60)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(220, 38, 38, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(253, 224, 71, 0.75)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'CAVERN_BEAMS',
    celestial: { day: 'NONE', night: 'NONE' },
  },
};

export const ORGANIC_CAVES_THEME: ThemeConfig = {
  id: 'ORGANIC_CAVES',
  label: 'Labyrinthe Boyaux',
  icon: '🕳️',
  desc: 'Tunnels organiques sinueux',
  topology: {
    heightmapType: 'FULL_SLAB',
    tunnels: 0,
    diggers: 10,
    arches: 0,
    overhangs: 0,
    floatingIslands: 0,
  },
  physics: {
    hasSolidCeiling: true,
    searchStartY: 35,
    minHeadroom: 12,
  },
  decor: {
    bunkers: 0,
    totems: 0,
    cacti: 0,
    crystals: 6,
    oilDrums: 5,
    lampposts: 0,
    trees: 0,
    hedgehogs: 0,
    chicks: 0,
    mushrooms: 8,
    flowers: 0,
    hangingLeaves: 8,
    butterflies: 0,
  },
  rendering: {
    palette: THEME_PALETTES.ORGANIC_CAVES,
    sky: {
      day: ['#451a03', '#78350f', '#b45309', '#d97706', '#fef08a'],
      night: ['#030102', '#170605', '#2b0c07', '#451a03'],
    },
    mountains: {
      ridgeColor: { day: '#78350f', night: '#0d0403' },
      gradient: {
        day: ['rgba(180, 83, 9, 0.75)', 'rgba(120, 53, 15, 0.95)'],
        night: ['rgba(15, 23, 42, 0.85)', 'rgba(7, 10, 22, 0.95)'],
      },
    },
    water: {
      gradient: {
        day: ['rgba(253, 224, 71, 0.85)', 'rgba(249, 115, 22, 0.88)', 'rgba(220, 38, 38, 0.94)', 'rgba(23, 6, 2, 0.99)'],
        night: ['rgba(239, 68, 68, 0.85)', 'rgba(153, 27, 27, 0.94)', 'rgba(3, 1, 2, 0.99)'],
      },
      bgGradient: {
        day: ['#78350f', '#451a03', '#1c0a02', '#0c0401'],
        night: ['#451a03', '#1c0a02', '#0c0401', '#030102'],
      },
      midWaveColor: { day: 'rgba(249, 115, 22, 0.60)', night: 'rgba(30, 58, 138, 0.45)' },
      frontWaveColor: { day: 'rgba(220, 38, 38, 0.80)', night: 'rgba(15, 23, 42, 0.80)' },
      outerRimColor: { day: 'rgba(253, 224, 71, 0.75)', night: 'rgba(56, 189, 248, 0.50)' },
      foamColor: { day: '#ffffff', night: '#e0f2fe' },
    },
    atmosphere: 'CAVERN_BEAMS',
    celestial: { day: 'NONE', night: 'NONE' },
  },
};

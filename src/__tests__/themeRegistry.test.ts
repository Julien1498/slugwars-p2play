import { describe, it, expect } from 'vitest';
import { THEME_CONFIGS, getThemeConfig } from '../core/terrain/themeRegistry';
import { MapTheme } from '../core/types';

describe('Theme Registry Architecture & Data Integrity', () => {
  const allThemes: MapTheme[] = [
    'ISLAND',
    'CAVERN',
    'FORTRESS',
    'OPAL_ISLAND',
    'ARCHIPELAGO',
    'NATURAL_ARCHES',
    'SPIRES',
    'ORGANIC_CAVES',
    'FLOATING_ARCHIPELAGO',
  ];

  it('contains complete registration for all 9 official MapTheme biomes', () => {
    for (const theme of allThemes) {
      expect(THEME_CONFIGS[theme]).toBeDefined();
      expect(THEME_CONFIGS[theme].id).toBe(theme);
    }
    expect(Object.keys(THEME_CONFIGS).length).toBe(allThemes.length);
  });

  describe('getThemeConfig helper', () => {
    it('returns valid config for any existing theme', () => {
      const config = getThemeConfig('ORGANIC_CAVES');
      expect(config.id).toBe('ORGANIC_CAVES');
      expect(config.label).toBe('Labyrinthe Boyaux');
    });

    it('falls back to ISLAND config for undefined or invalid theme key', () => {
      const config = getThemeConfig(undefined as any);
      expect(config.id).toBe('ISLAND');
    });
  });

  describe('UI Metadata Integrity', () => {
    it.each(allThemes)('has non-empty label, icon, and description for theme %s', (theme) => {
      const config = THEME_CONFIGS[theme];
      expect(config.label.trim().length).toBeGreaterThan(2);
      expect(config.icon.trim().length).toBeGreaterThan(0);
      expect(config.desc.trim().length).toBeGreaterThan(3);
    });
  });

  describe('Topology & Heightmap Configuration', () => {
    it.each(allThemes)('has valid procedural generation topology parameters for theme %s', (theme) => {
      const { topology } = THEME_CONFIGS[theme];
      expect(topology.heightmapType).toBeDefined();
      expect(topology.tunnels).toBeGreaterThanOrEqual(0);
      expect(topology.diggers).toBeGreaterThanOrEqual(0);
      expect(topology.arches).toBeGreaterThanOrEqual(0);
      expect(topology.overhangs).toBeGreaterThanOrEqual(0);
      expect(topology.floatingIslands).toBeGreaterThanOrEqual(0);
    });

    it('specifically configures 10 diggers for ORGANIC_CAVES', () => {
      expect(THEME_CONFIGS.ORGANIC_CAVES.topology.diggers).toBe(10);
      expect(THEME_CONFIGS.ORGANIC_CAVES.topology.heightmapType).toBe('FULL_SLAB');
    });

    it('specifically configures ARCHES heightmap for NATURAL_ARCHES', () => {
      expect(THEME_CONFIGS.NATURAL_ARCHES.topology.heightmapType).toBe('ARCHES');
      expect(THEME_CONFIGS.NATURAL_ARCHES.topology.tunnels).toBe(0);
    });
  });

  describe('Physics & Ceiling Rules', () => {
    it('enforces solid ceiling ONLY for CAVERN and ORGANIC_CAVES', () => {
      for (const theme of allThemes) {
        const hasSolidCeiling = THEME_CONFIGS[theme].physics.hasSolidCeiling;
        if (theme === 'CAVERN' || theme === 'ORGANIC_CAVES') {
          expect(hasSolidCeiling).toBe(true);
        } else {
          expect(hasSolidCeiling).toBe(false);
        }
      }
    });

    it.each(allThemes)('defines positive searchStartY and minHeadroom for theme %s', (theme) => {
      const { physics } = THEME_CONFIGS[theme];
      expect(physics.searchStartY).toBeGreaterThan(0);
      expect(physics.minHeadroom).toBeGreaterThan(0);
    });
  });

  describe('Rendering Palettes & Gradients Integrity', () => {
    const requiredPaletteKeys = [
      'highlight',
      'surfaceBody',
      'surfaceShadow',
      'surfaceDeep',
      'soilLight',
      'strataA',
      'strataB',
      'denseRock',
      'bedrock',
      'seam',
    ] as const;

    it.each(allThemes)('has complete 32-bit geological palette for theme %s', (theme) => {
      const { palette } = THEME_CONFIGS[theme].rendering;
      for (const key of requiredPaletteKeys) {
        expect(typeof palette[key]).toBe('number');
        expect(palette[key]).toBeGreaterThan(0);
      }
    });

    it.each(allThemes)('has valid day and night sky color gradients for theme %s', (theme) => {
      const { sky } = THEME_CONFIGS[theme].rendering;
      expect(sky.day.length).toBeGreaterThanOrEqual(2);
      expect(sky.night.length).toBeGreaterThanOrEqual(2);
      for (const color of [...sky.day, ...sky.night]) {
        expect(color.startsWith('#') || color.startsWith('rgba')).toBe(true);
      }
    });

    it.each(allThemes)('has valid water and background ocean gradients for theme %s', (theme) => {
      const { water } = THEME_CONFIGS[theme].rendering;
      expect(water.gradient.day.length).toBeGreaterThanOrEqual(2);
      expect(water.gradient.night.length).toBeGreaterThanOrEqual(2);
      expect(water.bgGradient.day.length).toBeGreaterThanOrEqual(2);
      expect(water.bgGradient.night.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Lobby UI Options Integration', () => {
    it('produces 9 valid selectable lobby map options with id, label, icon, desc', () => {
      const lobbyOptions = Object.values(THEME_CONFIGS).map((c) => ({
        id: c.id,
        label: c.label,
        icon: c.icon,
        desc: c.desc,
      }));

      expect(lobbyOptions.length).toBe(9);
      for (const opt of lobbyOptions) {
        expect(allThemes).toContain(opt.id);
        expect(opt.label.length).toBeGreaterThan(0);
        expect(opt.icon.length).toBeGreaterThan(0);
        expect(opt.desc.length).toBeGreaterThan(0);
      }
    });
  });
});

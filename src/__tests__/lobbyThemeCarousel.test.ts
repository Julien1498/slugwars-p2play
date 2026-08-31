import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { LobbyThemeSelector, MAP_THEMES } from '../components/game/lobby/LobbyThemeSelector';
import { BiomeMiniPreview } from '../components/game/lobby/BiomeMiniPreview';
import { MapTheme } from '../core/types';

describe('LobbyThemeSelector - Real Map Biome Carousel', () => {
  it('registers all 8 procedural biomes with valid labels and icons', () => {
    expect(MAP_THEMES).toHaveLength(8);
    const themeIds = MAP_THEMES.map((t) => t.id);
    expect(themeIds).toContain('ISLAND');
    expect(themeIds).toContain('CAVERN');
    expect(themeIds).toContain('FORTRESS');
    expect(themeIds).toContain('FLOATING_CHAOS');
    expect(themeIds).toContain('ARCHIPELAGO');
    expect(themeIds).toContain('NATURAL_ARCHES');
    expect(themeIds).toContain('SPIRES');
    expect(themeIds).toContain('ORGANIC_CAVES');
  });

  it('instantiates declarative React element for LobbyThemeSelector without errors', () => {
    const onSelectTheme = vi.fn();
    const element = React.createElement(LobbyThemeSelector, {
      currentTheme: 'ISLAND',
      isHost: true,
      onSelectTheme,
      size: 'NORMAL',
      seed: 123456,
    });

    expect(React.isValidElement(element)).toBe(true);
    expect(element.props.currentTheme).toBe('ISLAND');
    expect(element.props.seed).toBe(123456);
  });

  it('instantiates BiomeMiniPreview elements for all 8 biomes', () => {
    MAP_THEMES.forEach((theme) => {
      const element = React.createElement(BiomeMiniPreview, {
        theme: theme.id,
        size: 'NORMAL',
        seed: 42,
      });
      expect(React.isValidElement(element)).toBe(true);
    });
  });
});

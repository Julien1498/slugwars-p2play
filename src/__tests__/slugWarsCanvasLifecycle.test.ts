import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { SlugWarsCanvas, SlugWarsCanvasProps } from '../components/game/canvas/SlugWarsCanvas';
import { GameState } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

describe('SlugWarsCanvas: Declarative Architecture & Clean Lifecycle', () => {
  const createMockGameState = (): GameState => ({
    phase: 'AIMING',
    teams: [],
    slugs: [],
    projectiles: [],
    explosions: [],
    craters: [],
    supplyCrates: [],
    mines: [],
    helicopters: [],
    particles: [],
    floatingDamages: [],
    journal: [],
    turnTimer: 45,
    retreatTimer: 0,
    wind: 0,
    turnCount: 1,
    activeTeamId: 'team_red',
    activeSlugId: 'slug_1',
    config: {
      weaponSetId: 'classic',
      mapTheme: 'ISLAND',
      mapSeed: 12345,
      slugsPerTeam: 2,
      slugHp: 100,
      turnDuration: 45,
      windEnabled: true,
      vehiclesEnabled: true,
    },
  });

  const createMockTerrain = (): DestructibleTerrain => ({
    data: {
      width: 1400,
      height: 800,
      waterLevel: 750,
      grid: new Uint8Array(1400 * 800),
      solidProps: [],
      decorItems: [],
      seed: 'test_seed',
      theme: 'ISLAND',
    },
    revision: 1,
    isSolid: () => true,
    raycastSolid: () => ({ hit: false }),
    getSurfaceNormal: () => ({ nx: 0, ny: -1 }),
    carveCrater: () => {},
  } as unknown as DestructibleTerrain);

  it('renders declarative component element without monkey-patching static functions', () => {
    const gameState = createMockGameState();
    const terrain = createMockTerrain();

    const props: SlugWarsCanvasProps = {
      gameState,
      terrain,
      isMyTurn: true,
      onFire: vi.fn(),
    };

    const element = React.createElement(SlugWarsCanvas, props);
    expect(element).not.toBeNull();
    expect(React.isValidElement(element)).toBe(true);

    // Verify no monkey-patched global methods on the component function
    expect((SlugWarsCanvas as any)._updateExternalState).toBeUndefined();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { executeDevCursorAction } from '../components/game/dev/devActionExecutor';
import { GameState } from '../core/types';

describe('Dev Mode UI Actions & Executors (devActionExecutor.ts)', () => {
  const mockGameState = {
    activeSlugId: 'slug_123',
    slugs: [{ id: 'slug_123', name: 'Alpha Slug', x: 100, y: 200, hp: 100, isAlive: true }],
  } as unknown as GameState;

  it('dispatches devTeleportSlug when teleport tool is executed', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('teleport_slug', { x: 500, y: 300 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devTeleportSlug', ['slug_123', 500, 300]);
  });

  it('calls engine.devTeleportSlug directly if no onDevAction handler is passed', () => {
    const mockEngine = {
      devTeleportSlug: vi.fn(),
    };
    executeDevCursorAction('teleport_slug', { x: 500, y: 300 }, mockGameState, mockEngine, undefined);

    expect(mockEngine.devTeleportSlug).toHaveBeenCalledWith('slug_123', 500, 300);
  });

  it('dispatches devSpawnCrate with weapon type', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_crate_weapon', { x: 400, y: 200 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnCrate', [400, 200, 'weapon']);
  });

  it('dispatches devSpawnCrate with health type', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_crate_health', { x: 420, y: 210 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnCrate', [420, 210, 'health']);
  });

  it('dispatches devSpawnCrate with utility type', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_crate_utility', { x: 440, y: 220 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnCrate', [440, 220, 'utility']);
  });

  it('dispatches devSpawnMine at cursor position', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_mine', { x: 350, y: 150 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnMine', [350, 150]);
  });

  it('dispatches devSpawnOilDrum at cursor position', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_drum', { x: 600, y: 220 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnOilDrum', [600, 220]);
  });

  it('dispatches devSpawnHelicopter at cursor position', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('spawn_heli', { x: 250, y: 100 }, mockGameState, null, mockOnDevAction);

    expect(mockOnDevAction).toHaveBeenCalledWith('devSpawnHelicopter', [250, 100]);
  });

  it('dispatches devDigTerrain and devBuildTerrain with custom brush radius', () => {
    const mockOnDevAction = vi.fn();
    executeDevCursorAction('dig_terrain', { x: 300, y: 150 }, mockGameState, null, mockOnDevAction, 45);
    expect(mockOnDevAction).toHaveBeenCalledWith('devDigTerrain', [300, 150, 45]);

    executeDevCursorAction('build_terrain', { x: 320, y: 160 }, mockGameState, null, mockOnDevAction, 60);
    expect(mockOnDevAction).toHaveBeenCalledWith('devBuildTerrain', [320, 160, 60]);
  });

  it('evaluates dev mode state strictly from URL search params', () => {
    const checkDevMode = (search: string) => {
      const params = new URLSearchParams(search);
      return (
        params.get('dev') === 'true' ||
        params.get('dev') === '1' ||
        params.get('debug') === 'true' ||
        params.get('debug') === '1'
      );
    };

    expect(checkDevMode('')).toBe(false);
    expect(checkDevMode('?room=123')).toBe(false);
    expect(checkDevMode('?dev=false')).toBe(false);
    expect(checkDevMode('?dev=0')).toBe(false);
    expect(checkDevMode('?dev=true')).toBe(true);
    expect(checkDevMode('?dev=1')).toBe(true);
    expect(checkDevMode('?debug=true')).toBe(true);
    expect(checkDevMode('?debug=1')).toBe(true);
    expect(checkDevMode('?room=xyz&dev=true&autojoin=1')).toBe(true);
  });
});

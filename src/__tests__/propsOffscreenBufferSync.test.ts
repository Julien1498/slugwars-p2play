import { describe, it, expect, beforeAll, vi } from 'vitest';
import { rebuildPropsOffscreenCanvas, createTerrainBuffers } from '../rendering/renderTerrain';
import { renderBackgroundLayer } from '../components/game/canvas/renderBackgroundLayer';
import { DestructibleTerrain } from '../core/terrain';
import { SolidProp, CraterRecord, GameState } from '../core/types';

describe('PropsOffscreenBuffer - Event-Driven Craters & Dynamic Synchronization', () => {
  beforeAll(() => {
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        createElement: (tag: string) => {
          if (tag === 'canvas') {
            const ctx = {
              createImageData: (w: number, h: number) => ({
                width: w,
                height: h,
                data: new Uint8ClampedArray(w * h * 4),
              }),
              putImageData: vi.fn(),
              drawImage: vi.fn(),
              clearRect: vi.fn(),
              save: vi.fn(),
              restore: vi.fn(),
              beginPath: vi.fn(),
              arc: vi.fn(),
              fill: vi.fn(),
              translate: vi.fn(),
              rotate: vi.fn(),
              scale: vi.fn(),
              fillRect: vi.fn(),
              strokeRect: vi.fn(),
              stroke: vi.fn(),
              setTransform: vi.fn(),
              createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
              createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
            };
            return {
              width: 0,
              height: 0,
              getContext: () => ctx,
            };
          }
          return {};
        },
      };
    }
  });
  const createMockContext = () => {
    const calls: string[] = [];
    const ctx = {
      save: vi.fn(() => calls.push('save')),
      restore: vi.fn(() => calls.push('restore')),
      clearRect: vi.fn((x, y, w, h) => calls.push(`clearRect(${x},${y},${w},${h})`)),
      beginPath: vi.fn(() => calls.push('beginPath')),
      closePath: vi.fn(() => calls.push('closePath')),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn((x, y, r) => calls.push(`arc(${x},${y},${r})`)),
      fill: vi.fn(() => calls.push('fill')),
      drawImage: vi.fn((...args: unknown[]) => calls.push(`drawImage(${args.length})`)),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      stroke: vi.fn(),
      setTransform: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      globalCompositeOperation: 'source-over',
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'medium',
      _calls: calls,
    };
    return ctx as unknown as CanvasRenderingContext2D & typeof ctx;
  };

  it('draws alive props and applies destination-out for all craters', () => {
    const buffers = createTerrainBuffers(800, 600);
    const mockCtx = createMockContext();
    vi.spyOn(buffers.propsOffscreenCanvas, 'getContext').mockReturnValue(mockCtx);

    const solidProps: SolidProp[] = [
      { id: 'sp1', type: 'oil_drum', x: 100, y: 150, width: 24, height: 32, destroyed: false },
      { id: 'sp2', type: 'cactus', x: 300, y: 200, width: 20, height: 40, destroyed: true },
    ];
    const craters: CraterRecord[] = [
      { id: 'c1', x: 100, y: 150, radius: 15 },
      { id: 'c2', x: 250, y: 200, radius: 25 },
    ];

    rebuildPropsOffscreenCanvas(buffers, solidProps, craters);

    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
    expect(mockCtx.arc).toHaveBeenCalledWith(100, 150, 15, 0, Math.PI * 2);
    expect(mockCtx.arc).toHaveBeenCalledWith(250, 200, 25, 0, Math.PI * 2);
    expect(mockCtx.fill).toHaveBeenCalledTimes(2);
  });

  it('preserves surviving props and cuts all existing craters when a prop is destroyed', () => {
    const buffers = createTerrainBuffers(1000, 700);
    const mockCtx = createMockContext();
    vi.spyOn(buffers.propsOffscreenCanvas, 'getContext').mockReturnValue(mockCtx);

    const solidProps: SolidProp[] = [
      { id: 'sp_survive', type: 'oil_drum', x: 150, y: 300, width: 24, height: 32, destroyed: false },
      { id: 'sp_dead', type: 'crystal', x: 500, y: 350, width: 30, height: 45, destroyed: false },
    ];
    const craters: CraterRecord[] = [
      { id: 'c_prior', x: 150, y: 310, radius: 12 },
    ];

    // Initial build
    rebuildPropsOffscreenCanvas(buffers, solidProps, craters);
    expect(mockCtx.arc).toHaveBeenCalledWith(150, 310, 12, 0, Math.PI * 2);

    // Blast destroys sp_dead and adds new crater
    solidProps[1].destroyed = true;
    craters.push({ id: 'c_fatal', x: 500, y: 350, radius: 30 });

    mockCtx.arc.mockClear();
    rebuildPropsOffscreenCanvas(buffers, solidProps, craters);

    // Rebuild must cut BOTH craters into the surviving prop canvas
    expect(mockCtx.arc).toHaveBeenCalledWith(150, 310, 12, 0, Math.PI * 2);
    expect(mockCtx.arc).toHaveBeenCalledWith(500, 350, 30, 0, Math.PI * 2);
  });

  it('renders propsOffscreenCanvas via single drawImage in renderBackgroundLayer when zoomed out', () => {
    const mockCtx = createMockContext();
    const buffers = createTerrainBuffers(800, 600);

    const mockTerrain = {
      data: {
        width: 800,
        height: 600,
        waterLevel: 550,
        grid: new Uint8Array(800 * 600),
        solidProps: [{ id: 'sp1', type: 'oil_drum', x: 200, y: 300, width: 24, height: 32, destroyed: false }],
        decorItems: [],
        seed: 'test',
        theme: 'ISLAND',
      },
      revision: 0,
    } as unknown as DestructibleTerrain;

    const mockState: GameState = {
      phase: 'AIMING',
      turnTimer: 45,
      retreatTimer: 0,
      wind: 0,
      turnCount: 1,
      activeTeamId: 't1',
      activeSlugId: 's1',
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
      config: {
        weaponSetId: 'classic',
        mapTheme: 'ISLAND',
        mapSeed: 1,
        slugsPerTeam: 1,
        slugHp: 100,
        turnDuration: 45,
        windEnabled: false,
        vehiclesEnabled: false,
      },
    };

    renderBackgroundLayer({
      ctx: mockCtx,
      canvas: document.createElement('canvas'),
      containerRect: { width: 800, height: 600 } as DOMRect,
      terrain: mockTerrain,
      buffers,
      gameState: mockState,
      bgDpr: 1,
      totalScale: 0.8,
      pan: { x: 0, y: 0 },
      waterY: 550,
      animTime: 0,
      slowTime: 0,
      viewBounds: { viewLeft: 0, viewRight: 800, viewTop: 0, viewBottom: 600 },
      isMyTurn: true,
    });

    // Check that propsOffscreenCanvas was drawn with drawImage
    const drewPropsCanvas = mockCtx.drawImage.mock.calls.some((callArgs: any[]) => callArgs[0] === buffers.propsOffscreenCanvas);
    expect(drewPropsCanvas).toBe(true);
  });

  it('renders visible props directly via renderHDDestructibleProp when zoomed in (totalScale >= 1.0)', () => {
    const mockCtx = createMockContext();
    const buffers = createTerrainBuffers(800, 600);

    const mockTerrain = {
      data: {
        width: 800,
        height: 600,
        waterLevel: 550,
        grid: new Uint8Array(800 * 600),
        solidProps: [{ id: 'sp1', type: 'oil_drum', x: 200, y: 300, width: 24, height: 32, destroyed: false }],
        decorItems: [],
        seed: 'test',
        theme: 'ISLAND',
      },
      revision: 0,
    } as unknown as DestructibleTerrain;

    const mockState: GameState = {
      phase: 'AIMING',
      turnTimer: 45,
      retreatTimer: 0,
      wind: 0,
      turnCount: 1,
      activeTeamId: 't1',
      activeSlugId: 's1',
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
      config: {
        weaponSetId: 'classic',
        mapTheme: 'ISLAND',
        mapSeed: 1,
        slugsPerTeam: 1,
        slugHp: 100,
        turnDuration: 45,
        windEnabled: false,
        vehiclesEnabled: false,
      },
    };

    renderBackgroundLayer({
      ctx: mockCtx,
      canvas: document.createElement('canvas'),
      containerRect: { width: 800, height: 600 } as DOMRect,
      terrain: mockTerrain,
      buffers,
      gameState: mockState,
      bgDpr: 1,
      totalScale: 1.5,
      pan: { x: 0, y: 0 },
      waterY: 550,
      animTime: 0,
      slowTime: 0,
      viewBounds: { viewLeft: 0, viewRight: 800, viewTop: 0, viewBottom: 600 },
      isMyTurn: true,
    });

    // When zoomed in, propsOffscreenCanvas is bypassed to ensure 2.5x supersampled crispness
    const drewPropsCanvas = mockCtx.drawImage.mock.calls.some((callArgs: any[]) => callArgs[0] === buffers.propsOffscreenCanvas);
    expect(drewPropsCanvas).toBe(false);
    // Directly draws the prop with drawImage from the sprite cache
    expect(mockCtx.drawImage).toHaveBeenCalled();
  });
});

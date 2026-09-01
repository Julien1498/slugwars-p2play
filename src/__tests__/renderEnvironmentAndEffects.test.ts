import { describe, it, expect, vi } from 'vitest';
import { renderSkyAndAtmosphere, SkyRenderContext } from '../rendering/renderSky';
import { renderForegroundOcean, WaterRenderContext } from '../rendering/renderWater';
import { renderAimGuides, AimGuidesContext } from '../rendering/renderAimGuides';
import { renderHitboxDebugOverlay, HitboxRenderContext } from '../rendering/renderHitboxes';
import { renderProjectiles, ProjectilesRenderContext } from '../rendering/renderProjectiles';
import { renderPlacementGhost } from '../rendering/renderPlacementGhost';
import { GameState, Slug, MapTheme, ActiveProjectile } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';
import { TerrainData } from '../core/terrainGenerator';

describe('renderEnvironmentAndEffects - Sky, Water, Aim Guides, Projectiles & FX', () => {
  const createMockContext = () => {
    const gradientMock = {
      addColorStop: vi.fn(),
    };
    return {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      setLineDash: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      clip: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 24 })),
      createLinearGradient: vi.fn(() => gradientMock),
      createRadialGradient: vi.fn(() => gradientMock),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      globalAlpha: 1,
      font: '10px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
      shadowColor: 'transparent',
      shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D;
  };

  const createMockTerrain = (width: number = 600, height: number = 400): DestructibleTerrain => {
    const grid = new Uint8Array(width * height);
    // Fill bottom half with solid ground
    for (let y = height / 2; y < height; y++) {
      for (let x = 0; x < width; x++) {
        grid[y * width + x] = 1;
      }
    }
    const data: TerrainData = {
      seed: 12345,
      width,
      height,
      theme: 'ISLAND',
      grid,
      decorItems: [],
      solidProps: [],
      spawnPoints: [{ x: 100, y: 150 }],
      minePoints: [],
      waterLevel: 450,
    };
    return new DestructibleTerrain(data);
  };

  describe('renderSkyAndAtmosphere', () => {
    const themes: MapTheme[] = ['ISLAND', 'CAVERN', 'ORGANIC_CAVES', 'NATURAL_ARCHES', 'SPIRES', 'ARCHIPELAGO', 'FORTRESS', 'OPAL_ISLAND', 'FLOATING_ARCHIPELAGO'];

    it.each(themes)('renders sky and background ocean horizon for theme %s without throwing', (theme) => {
      const ctx = createMockContext();
      const skyCtx: SkyRenderContext = {
        ctx,
        width: 1920,
        height: 1080,
        waterY: 800,
        theme,
        isDay: true,
        animTime: 10,
        slowTime: 2,
        worldLeft: 0,
        worldRight: 2000,
        worldTop: -500,
        worldBottom: 1200,
        viewLeft: 0,
        viewRight: 1000,
        viewTop: 0,
        viewBottom: 800,
      };

      expect(() => renderSkyAndAtmosphere(skyCtx)).not.toThrow();
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('supports night time atmospheric rendering', () => {
      const ctx = createMockContext();
      const skyCtx: SkyRenderContext = {
        ctx,
        width: 1920,
        height: 1080,
        waterY: 800,
        theme: 'ISLAND',
        isDay: false,
        animTime: 10,
        slowTime: 2,
        worldLeft: 0,
        worldRight: 2000,
        worldTop: -500,
        worldBottom: 1200,
      };

      expect(() => renderSkyAndAtmosphere(skyCtx)).not.toThrow();
      expect(ctx.fill).toHaveBeenCalled();
    });
  });

  describe('renderForegroundOcean & water splashes', () => {
    it('renders water surface, waves, bubbles, ripples and splashes', () => {
      const ctx = createMockContext();
      const waterCtx: WaterRenderContext = {
        ctx,
        height: 1080,
        waterY: 800,
        theme: 'ISLAND',
        isDay: true,
        slowTime: 2,
        animTime: 10,
        worldLeft: 0,
        worldRight: 2000,
        worldBottom: 1200,
        viewLeft: 0,
        viewRight: 1000,
        bubbles: [{ x: 200, y: 850, vx: 0, vy: -1, size: 4, life: 0.8 }],
        ripples: [{ x: 300, radius: 15, life: 0.5, color: '#ffffff' }],
        splashes: [{ x: 400, y: 790, vx: 1, vy: -3, size: 3, life: 0.9, color: '#bae6fd' }],
      };

      expect(() => {
        renderForegroundOcean(waterCtx);
      }).not.toThrow();

      expect(ctx.fill).toHaveBeenCalled();
    });
  });

  describe('renderAimGuides', () => {
    it('renders aim guides, reticles and charging power line without throwing', () => {
      const ctx = createMockContext();
      const terrain = createMockTerrain(500, 300);
      const activeSlug: Slug = {
        id: 'slug_1',
        teamId: 'team_red',
        name: 'Sluggy',
        x: 200,
        y: 150,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        facing: 'right',
        aimAngle: 45,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
        isChargingPower: true,
      };

      const aimCtx: AimGuidesContext = {
        ctx,
        activeSlug,
        isMyTurn: true,
        terrain,
        mousePos: { x: 300, y: 100 },
        lockedTarget: null,
        animTime: 5,
      };

      expect(() => renderAimGuides(aimCtx)).not.toThrow();
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });
  });

  describe('renderHitboxDebugOverlay', () => {
    it('renders visual hitboxes for slugs and active entities in debug mode', () => {
      const ctx = createMockContext();
      const terrain = createMockTerrain(600, 400);
      const gameState = {
        slugs: [
          { id: 'slug_1', x: 200, y: 150, isAlive: true, isPlaced: true, facing: 'right' },
          { id: 'slug_2', x: 400, y: 150, isAlive: false, isPlaced: true, facing: 'left' },
        ],
        projectiles: [
          { id: 'p_1', x: 250, y: 120, radius: 6, weaponId: 'bazooka' },
        ],
        supplyCrates: [
          { id: 'c_1', x: 300, y: 100, isLanded: true },
        ],
        mines: [
          { id: 'm_1', x: 350, y: 150, isTriggered: true },
        ],
      } as unknown as GameState;

      const hitboxCtx: HitboxRenderContext = {
        ctx,
        gameState,
        terrain,
        waterLevel: 350,
        width: 600,
        height: 400,
      };

      expect(() => renderHitboxDebugOverlay(hitboxCtx)).not.toThrow();
      expect(ctx.strokeRect).toHaveBeenCalled();
    });
  });

  describe('renderProjectiles', () => {
    const allWeaponIds = [
      'bazooka',
      'homing_missile',
      'grenade',
      'banana_bomb',
      'cluster_banana',
      'holy_grenade',
      'dynamite',
      'super_sheep',
      'concrete_donkey',
      'homing_pigeon',
      'air_strike',
      'shotgun',
      'prod',
    ];

    it.each(allWeaponIds)('renders projectile %s without crashing', (weaponId) => {
      const ctx = createMockContext();
      const projectiles: ActiveProjectile[] = [
        {
          id: `p_${weaponId}`,
          weaponId,
          x: 200,
          y: 150,
          vx: 8,
          vy: -4,
          radius: 5,
          fuseTimerMs: 2000,
        } as any,
      ];

      const pCtx: ProjectilesRenderContext = {
        ctx,
        projectiles,
        animTime: 12,
      };

      expect(() => renderProjectiles(pCtx)).not.toThrow();
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('culls projectiles outside active viewport bounds', () => {
      const ctx = createMockContext();
      const projectiles: ActiveProjectile[] = [
        { id: 'p_culled', weaponId: 'bazooka', x: 900, y: 150, vx: 0, vy: 0, radius: 4 } as any,
      ];

      const pCtx: ProjectilesRenderContext = {
        ctx,
        projectiles,
        animTime: 12,
        viewLeft: 100,
        viewRight: 400,
      };

      renderProjectiles(pCtx);
      // Projectile at 900 is outside [100, 400], should not save/draw
      expect(ctx.save).not.toHaveBeenCalled();
    });
  });

  describe('renderPlacementGhost', () => {
    it('renders placement ghost for active slug positioning without crashing', () => {
      const ctx = createMockContext();
      const terrain = createMockTerrain(600, 400);

      const gameState = {
        phase: 'PLACEMENT',
        activeTeamId: 'team_red',
        activeSlugId: 'slug_1',
        teams: [{ id: 'team_red', color: '#ef4444' }],
        slugs: [{ id: 'slug_1', name: 'Sluggy' }],
      } as unknown as GameState;

      expect(() => {
        renderPlacementGhost(ctx, gameState, terrain, { x: 300, y: 180 }, true, 10);
      }).not.toThrow();
    });
  });
});

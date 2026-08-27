import { describe, it, expect, vi } from 'vitest';
import { renderSlugs, renderGhostSpirits, SlugsRenderContext } from '../rendering/renderSlugs';
import { Slug, Team, GameState } from '../core/types';
import { WeaponId } from '../core/weapons/types';

// Polyfill Path2D for headless test environment if not present
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class MockPath2D {
    rect = vi.fn();
    roundRect = vi.fn();
    arc = vi.fn();
    moveTo = vi.fn();
    lineTo = vi.fn();
    quadraticCurveTo = vi.fn();
    bezierCurveTo = vi.fn();
    setLineDash = vi.fn();
    closePath = vi.fn();
    ellipse = vi.fn();
  };
}

describe('RenderSlugs - Canvas Graphics Pipeline', () => {
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

  const createMockGameState = (): GameState => {
    const teams: Team[] = [
      { id: 'team_red', name: 'Red Team', color: '#ef4444', avatar: 'slug', isHost: true, inventory: { bazooka: 99 } },
      { id: 'team_blue', name: 'Blue Team', color: '#3b82f6', avatar: 'snail', isHost: false, inventory: { grenade: 5 } },
    ];
    const slugs: Slug[] = [
      {
        id: 'slug_1',
        teamId: 'team_red',
        name: 'Sluggy',
        x: 300,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        facing: 'right',
        aimAngle: 0.2,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
      },
      {
        id: 'slug_2',
        teamId: 'team_blue',
        name: 'Shelly',
        x: 600,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 80,
        maxHp: 100,
        isAlive: true,
        facing: 'left',
        aimAngle: -0.4,
        aimPower: 5,
        selectedWeaponId: 'grenade',
      },
    ];

    return {
      phase: 'AIMING',
      activeSlugId: 'slug_1',
      activeTeamId: 'team_red',
      turnTimer: 30,
      roundNumber: 1,
      teams,
      slugs,
      projectiles: [],
      particles: [],
      craters: [],
      floatingDamages: [],
      winnerTeamId: null,
      terrainSeed: 12345,
      mapTheme: 'ISLAND',
    } as unknown as GameState;
  };

  describe('renderSlugs core loop & culling', () => {
    it('renders alive slugs on screen without throwing errors', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      const renderCtx: SlugsRenderContext = {
        ctx,
        gameState,
        animTime: 100,
        slugDeathTimestamps: new Map(),
      };

      expect(() => renderSlugs(renderCtx)).not.toThrow();
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalledWith('100', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith('80', expect.any(Number), expect.any(Number));
    });

    it('skips rendering dead slugs from the main alive slug loop', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      gameState.slugs[0].isAlive = false; // slug_1 dead
      gameState.slugs[1].isAlive = false; // slug_2 dead

      const renderCtx: SlugsRenderContext = {
        ctx,
        gameState,
        animTime: 100,
        slugDeathTimestamps: new Map(),
      };

      renderSlugs(renderCtx);
      // Since no slugs are alive, no HP badge text is rendered
      expect(ctx.fillText).not.toHaveBeenCalled();
    });

    it('culls slugs outside the active viewport (viewLeft / viewRight)', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      // slug_1 is at x = 300, slug_2 is at x = 600
      // Set viewport strictly around slug_1 (viewLeft = 100, viewRight = 450)
      const renderCtx: SlugsRenderContext = {
        ctx,
        gameState,
        animTime: 100,
        slugDeathTimestamps: new Map(),
        viewLeft: 100,
        viewRight: 450,
      };

      renderSlugs(renderCtx);

      // Only slug_1 (hp: 100) should be rendered, slug_2 (hp: 80) should be culled
      expect(ctx.fillText).toHaveBeenCalledWith('100', expect.any(Number), expect.any(Number));
      expect(ctx.fillText).not.toHaveBeenCalledWith('80', expect.any(Number), expect.any(Number));
    });
  });

  describe('renderGhostSpirits for dead slugs', () => {
    it('renders ascending ghost spirits for recently dead slugs (< 3.5s elapsed)', () => {
      const ctx = createMockContext();
      const deadSlug: Slug = {
        id: 'slug_dead_1',
        teamId: 'team_red',
        name: 'Ghosty',
        x: 300,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 0,
        maxHp: 100,
        isAlive: false,
        facing: 'right',
        aimAngle: 0,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
      };
      const deathTimestamps = new Map<string, number>();
      deathTimestamps.set('slug_dead_1', performance.now() - 1000); // 1.0s elapsed

      expect(() => {
        renderGhostSpirits(ctx, [deadSlug], 50, deathTimestamps);
      }).not.toThrow();

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('does not render ghosts for slugs dead for longer than 3.5s or alive slugs', () => {
      const ctx = createMockContext();
      const aliveSlug: Slug = {
        id: 'slug_alive',
        teamId: 'team_red',
        name: 'Living',
        x: 300,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        facing: 'right',
        aimAngle: 0,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
      };
      const oldDeadSlug: Slug = {
        id: 'slug_old_dead',
        teamId: 'team_blue',
        name: 'OldGhost',
        x: 400,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 0,
        maxHp: 100,
        isAlive: false,
        facing: 'right',
        aimAngle: 0,
        aimPower: 5,
        selectedWeaponId: 'grenade',
      };
      const deathTimestamps = new Map<string, number>();
      deathTimestamps.set('slug_old_dead', performance.now() - 5000); // 5s elapsed (expired)

      renderGhostSpirits(ctx, [aliveSlug, oldDeadSlug], 50, deathTimestamps);

      // No ghost should be rendered
      expect(ctx.save).not.toHaveBeenCalled();
    });
  });

  describe('Weapons in hand rendering', () => {
    const allWeapons: WeaponId[] = [
      'bazooka',
      'homing_missile',
      'grenade',
      'holy_grenade',
      'banana_bomb',
      'cluster_banana',
      'dynamite',
      'shotgun',
      'homing_pigeon',
      'prod',
      'baseball_bat',
      'air_strike',
      'concrete_donkey',
      'super_sheep',
      'blowtorch',
      'teleport',
      'ninja_rope',
      'girder',
      'airdrop',
      'skip_turn',
    ];

    it.each(allWeapons)('renders weapon %s in slug hands without crashing', (weapon) => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      gameState.slugs[0].selectedWeaponId = weapon;
      gameState.activeSlugId = gameState.slugs[0].id;

      const renderCtx: SlugsRenderContext = {
        ctx,
        gameState,
        animTime: 120,
        slugDeathTimestamps: new Map(),
      };

      expect(() => renderSlugs(renderCtx)).not.toThrow();
    });
  });

  describe('Cosmetics and Hats rendering', () => {
    const allHats = ['military', 'bandana', 'cyber', 'cowboy', 'none'] as const;

    it.each(allHats)('renders hat %s without crashing', (hat) => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      (gameState.slugs[0] as any).hatId = hat;

      const renderCtx: SlugsRenderContext = {
        ctx,
        gameState,
        animTime: 120,
        slugDeathTimestamps: new Map(),
      };

      expect(() => renderSlugs(renderCtx)).not.toThrow();
    });
  });
});

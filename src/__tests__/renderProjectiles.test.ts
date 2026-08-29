import { describe, it, expect, vi } from 'vitest';
import { renderProjectiles } from '../rendering/renderProjectiles';
import { ActiveProjectile } from '../core/types';

describe('renderProjectiles: O(1) Projectile Dispatchers & Visual Rendering', () => {
  const createMockContext = (): CanvasRenderingContext2D => {
    return {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      quadraticCurveTo: vi.fn(),
      bezierCurveTo: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      strokeText: vi.fn(),
      fillText: vi.fn(),
      createRadialGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
    } as unknown as CanvasRenderingContext2D;
  };

  const createProjectile = (weaponId: string, overrides?: Partial<ActiveProjectile>): ActiveProjectile => ({
    id: `p_${weaponId}`,
    weaponId,
    x: 200,
    y: 150,
    vx: 10,
    vy: 5,
    radius: 4,
    bounces: false,
    windAffected: false,
    ownerSlugId: 'slug_1',
    ...overrides,
  });

  it('renders all weapon projectile types without error', () => {
    const allWeaponIds = [
      'bazooka',
      'homing_missile',
      'grenade',
      'air_strike',
      'homing_pigeon',
      'cluster_banana',
      'shotgun',
      'super_sheep',
      'holy_grenade',
      'banana_bomb',
      'dynamite',
      'concrete_donkey',
      'unknown_custom_orb',
    ];

    const ctx = createMockContext();
    const projectiles = allWeaponIds.map((id) => createProjectile(id));

    expect(() => {
      renderProjectiles({
        ctx,
        projectiles,
        animTime: 1.5,
      });
    }).not.toThrow();

    expect(ctx.translate).toHaveBeenCalledTimes(allWeaponIds.length);
  });

  it('renders fuse timer badge for timed projectiles', () => {
    const ctx = createMockContext();
    const projectiles = [
      createProjectile('grenade', { fuseTimerMs: 2500 }),
    ];

    renderProjectiles({
      ctx,
      projectiles,
      animTime: 1.0,
    });

    expect(ctx.strokeText).toHaveBeenCalledWith('⚠️ 2.5s', 0, -12);
    expect(ctx.fillText).toHaveBeenCalledWith('⚠️ 2.5s', 0, -12);
  });

  it('skips projectiles outside viewport culling bounds', () => {
    const ctx = createMockContext();
    const projectiles = [
      createProjectile('bazooka', { x: 50 }),
      createProjectile('grenade', { x: 500 }),
      createProjectile('dynamite', { x: 1200 }),
    ];

    renderProjectiles({
      ctx,
      projectiles,
      animTime: 1.0,
      viewLeft: 400,
      viewRight: 600,
    });

    // Only the grenade at x=500 is in viewport (400-80 to 600+80 = 320 to 680)
    expect(ctx.translate).toHaveBeenCalledTimes(1);
    expect(ctx.translate).toHaveBeenCalledWith(500, 150);
  });
});

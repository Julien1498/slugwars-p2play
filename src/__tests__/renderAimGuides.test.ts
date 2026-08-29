import { describe, it, expect, vi } from 'vitest';
import { renderAimGuides, AimGuidesContext } from '../rendering/renderAimGuides';
import { Slug } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

// Polyfill Path2D for headless test environment if not present
if (typeof (globalThis as any).Path2D === 'undefined') {
  (globalThis as any).Path2D = class MockPath2D {
    moveTo = vi.fn();
    lineTo = vi.fn();
    arc = vi.fn();
    rect = vi.fn();
    closePath = vi.fn();
  };
}

describe('renderAimGuides - Canvas Aiming & Reticles Pipeline', () => {
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
      arc: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setLineDash: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 30 })),
      createLinearGradient: vi.fn(() => gradientMock),
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      font: '10px sans-serif',
      textAlign: 'center',
      textBaseline: 'middle',
    } as unknown as CanvasRenderingContext2D;
  };

  const mockTerrain: DestructibleTerrain = {
    data: { width: 1400, height: 800, waterLevel: 700 },
    isSolid: (x: number, y: number) => y >= 500 && x >= 200 && x <= 600,
  } as unknown as DestructibleTerrain;

  const createMockSlug = (overrides?: Partial<Slug>): Slug => ({
    id: 's1',
    teamId: 't1',
    name: 'Test Slug',
    x: 300,
    y: 400,
    vx: 0,
    vy: 0,
    hp: 100,
    maxHp: 100,
    isAlive: true,
    facing: 'right',
    aimAngle: 45,
    aimPower: 50,
    selectedWeaponId: 'bazooka',
    isPlaced: true,
    ...overrides,
  });

  it('renders classic animated reticle for ballistic weapons on player turn', () => {
    const ctx = createMockContext();
    const activeSlug = createMockSlug({ selectedWeaponId: 'bazooka', isChargingPower: false });
    const rc: AimGuidesContext = {
      ctx,
      activeSlug,
      isMyTurn: true,
      terrain: mockTerrain,
      mousePos: { x: 350, y: 350 },
      lockedTarget: null,
      animTime: 1.5,
    };

    expect(() => renderAimGuides(rc)).not.toThrow();
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled();
  });

  it('renders power charging bar when active slug is charging shot', () => {
    const ctx = createMockContext();
    const activeSlug = createMockSlug({ selectedWeaponId: 'grenade', isChargingPower: true, aimPower: 75 });
    const rc: AimGuidesContext = {
      ctx,
      activeSlug,
      isMyTurn: true,
      terrain: mockTerrain,
      mousePos: { x: 350, y: 350 },
      lockedTarget: null,
      animTime: 2.0,
    };

    expect(() => renderAimGuides(rc)).not.toThrow();
    expect(ctx.createLinearGradient).toHaveBeenCalled();
    expect(ctx.fillRect).toHaveBeenCalled();
  });

  it('renders ninja rope aiming ray and raycasts against solid terrain', () => {
    const ctx = createMockContext();
    const activeSlug = createMockSlug({ selectedWeaponId: 'ninja_rope', aimAngle: -45, facing: 'right' });
    const rc: AimGuidesContext = {
      ctx,
      activeSlug,
      isMyTurn: true,
      terrain: mockTerrain,
      mousePos: { x: 400, y: 500 },
      lockedTarget: null,
      animTime: 0.5,
    };

    expect(() => renderAimGuides(rc)).not.toThrow();
    expect(ctx.setLineDash).toHaveBeenCalled();
  });

  it('renders tactical target reticle for target-requiring weapons (air strike, homing missile, concrete donkey)', () => {
    for (const weaponId of ['air_strike', 'homing_missile', 'concrete_donkey']) {
      const ctx = createMockContext();
      const activeSlug = createMockSlug({ selectedWeaponId: weaponId });
      const rc: AimGuidesContext = {
        ctx,
        activeSlug,
        isMyTurn: true,
        terrain: mockTerrain,
        mousePos: { x: 450, y: 300 },
        lockedTarget: { x: 450, y: 300 },
        animTime: 1.0,
      };

      expect(() => renderAimGuides(rc)).not.toThrow();
      expect(ctx.translate).toHaveBeenCalledWith(450, 300);
    }
  });

  it('renders girder placement ghost in unlocked and locked states', () => {
    // 1. Unlocked state following mousePos
    const ctxUnlocked = createMockContext();
    const activeSlugUnlocked = createMockSlug({ selectedWeaponId: 'girder', aimAngle: 30 });
    const rcUnlocked: AimGuidesContext = {
      ctx: ctxUnlocked,
      activeSlug: activeSlugUnlocked,
      isMyTurn: true,
      terrain: mockTerrain,
      mousePos: { x: 500, y: 350 },
      lockedTarget: null,
      animTime: 1.0,
    };

    expect(() => renderAimGuides(rcUnlocked)).not.toThrow();
    expect(ctxUnlocked.rotate).toHaveBeenCalled();

    // 2. Locked state with rotation ray
    const ctxLocked = createMockContext();
    const activeSlugLocked = createMockSlug({ selectedWeaponId: 'girder', aimAngle: 90 });
    const rcLocked: AimGuidesContext = {
      ctx: ctxLocked,
      activeSlug: activeSlugLocked,
      isMyTurn: true,
      terrain: mockTerrain,
      mousePos: { x: 550, y: 400 },
      lockedTarget: { x: 500, y: 350 },
      animTime: 1.2,
    };

    expect(() => renderAimGuides(rcLocked)).not.toThrow();
    expect(ctxLocked.strokeRect).toHaveBeenCalled();
  });

  it('does not render aim guides when it is not player turn', () => {
    const ctx = createMockContext();
    const activeSlug = createMockSlug({ selectedWeaponId: 'bazooka', isChargingPower: false });
    const rc: AimGuidesContext = {
      ctx,
      activeSlug,
      isMyTurn: false,
      terrain: mockTerrain,
      mousePos: { x: 350, y: 350 },
      lockedTarget: null,
      animTime: 1.0,
    };

    renderAimGuides(rc);
    expect(ctx.translate).not.toHaveBeenCalled();
  });
});

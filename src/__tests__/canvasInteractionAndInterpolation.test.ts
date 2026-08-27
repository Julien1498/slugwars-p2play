import { describe, it, expect } from 'vitest';
import { calculateAimAngleAndFacing, calculateGirderAngle } from '../rendering/interactionUtils';
import { createInterpolationCache, interpolateVisualState } from '../rendering/interpolationUtils';
import { GameState, Slug, ActiveProjectile, SupplyCrate } from '../core/types';

describe('Canvas Interactions & Aiming Calculation', () => {
  const slugPos = { x: 500, y: 300 };

  describe('calculateAimAngleAndFacing', () => {
    it('calculates right-facing angle when aiming to the right', () => {
      const pointerRight = { x: 600, y: 200 }; // 45 deg upward to the right
      const { aimAngle, facing } = calculateAimAngleAndFacing(pointerRight, slugPos);

      expect(facing).toBe('right');
      expect(aimAngle).toBe(45);
    });

    it('calculates left-facing angle when aiming to the left with mirrored angle', () => {
      const pointerLeft = { x: 400, y: 200 }; // 45 deg upward to the left
      const { aimAngle, facing } = calculateAimAngleAndFacing(pointerLeft, slugPos);

      expect(facing).toBe('left');
      expect(aimAngle).toBe(45);
    });

    it('clamps steep upward aiming to maximum +85 degrees', () => {
      const pointerStraightUp = { x: 501, y: 50 };
      const { aimAngle } = calculateAimAngleAndFacing(pointerStraightUp, slugPos);

      expect(aimAngle).toBe(85);
    });

    it('clamps steep downward aiming to minimum -85 degrees', () => {
      const pointerStraightDown = { x: 501, y: 600 };
      const { aimAngle } = calculateAimAngleAndFacing(pointerStraightDown, slugPos);

      expect(aimAngle).toBe(-85);
    });

    it('correctly handles horizontal aiming at 0 degrees', () => {
      const pointerHorizontal = { x: 700, y: 300 };
      const { aimAngle, facing } = calculateAimAngleAndFacing(pointerHorizontal, slugPos);

      expect(facing).toBe('right');
      expect(aimAngle).toBe(0);
    });
  });

  describe('calculateGirderAngle', () => {
    const pivot = { x: 400, y: 250 };

    it('computes 0° for horizontal right orientation', () => {
      expect(calculateGirderAngle({ x: 500, y: 250 }, pivot)).toBe(0);
    });

    it('computes 90° for vertical down orientation', () => {
      expect(calculateGirderAngle({ x: 400, y: 350 }, pivot)).toBe(90);
    });

    it('computes 180° for horizontal left orientation', () => {
      expect(calculateGirderAngle({ x: 300, y: 250 }, pivot)).toBe(180);
    });

    it('computes 270° for vertical up orientation without negative values', () => {
      expect(calculateGirderAngle({ x: 400, y: 150 }, pivot)).toBe(270);
    });
  });
});

describe('Multi-Entity Visual State Interpolation (144 FPS)', () => {
  const createMockSlug = (id: string, x: number, y: number): Slug => ({
    id,
    name: `Slug_${id}`,
    teamId: 't1',
    hp: 100,
    maxHp: 100,
    x,
    y,
    vx: 0,
    vy: 0,
    aimAngle: 0,
    aimPower: 50,
    facing: 'right',
    selectedWeaponId: 'bazooka',
    isAlive: true,
    isPlaced: true,
    inVehicleId: null,
    movingDir: null,
    currentTargetPoint: undefined,
  });

  const createMockState = (): GameState => ({
    phase: 'AIMING',
    activeTeamId: 't1',
    activeSlugId: 's1',
    turnTimer: 45,
    turnCount: 1,
    wind: 0,
    waterLevel: 550,
    teams: [
      {
        id: 't1',
        name: 'Team Alpha',
        color: '#ec4899',
        avatar: '🪖',
        isHost: true,
        inventory: {},
      },
    ],
    slugs: [createMockSlug('s1', 100, 200), createMockSlug('s2', 300, 400)],
    mines: [],
    helicopters: [],
    projectiles: [
      {
        id: 'p1',
        weaponId: 'bazooka',
        x: 150,
        y: 220,
        vx: 10,
        vy: -5,
        radius: 4,
        bounces: false,
        windAffected: true,
        ownerSlugId: 's1',
      },
    ],
    supplyCrates: [
      {
        id: 'c1',
        x: 250,
        y: 100,
        vy: 2,
        isLanded: false,
        crateType: 'health',
        healAmount: 25,
      },
    ],
    craters: [],
    explosions: [],
    particles: [],
    floatingDamages: [],
    journal: [],
    winnerTeamId: undefined,
    config: {
      weaponSetId: 'standard',
      slugHp: 100,
      slugsPerTeam: 2,
      turnDuration: 45,
      windEnabled: true,
      vehiclesEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: 12345,
    },
  });

  it('smoothly interpolates multiple slugs, crates, and projectiles in a single pass', () => {
    const cache = createInterpolationCache();
    const state = createMockState();

    // First frame: initial visual registration
    const initialVisual = interpolateVisualState(state, cache, 0.5);
    expect(initialVisual.slugs[0].x).toBe(100);
    expect(initialVisual.slugs[0].y).toBe(200);
    expect(initialVisual.supplyCrates?.[0].y).toBe(100);

    // Second frame: entities move slightly (smooth lerp)
    state.slugs[0].x = 120; // +20px movement (< 64px)
    state.slugs[0].y = 200;
    state.supplyCrates![0].y = 110;

    const interpolated = interpolateVisualState(state, cache, 0.5);

    // At alpha=0.5, visual slug position should be halfway between 100 and 120 -> 110
    expect(interpolated.slugs[0].x).toBeCloseTo(110, 4);
    expect(interpolated.supplyCrates?.[0].y).toBeCloseTo(105, 4);
  });

  it('snaps immediately if slug is teleported (>64px jump)', () => {
    const cache = createInterpolationCache();
    const state = createMockState();

    // Initial frame
    interpolateVisualState(state, cache, 0.2);

    // Sudden teleport to distant location (800px away)
    state.slugs[0].x = 900;
    state.slugs[0].y = 200;

    const afterTeleport = interpolateVisualState(state, cache, 0.2);
    // Must snap instantly to 900 without trailing through intermediate pixels
    expect(afterTeleport.slugs[0].x).toBe(900);
  });

  it('automatically purges destroyed projectiles from interpolation cache', () => {
    const cache = createInterpolationCache();
    const state = createMockState();

    // Frame 1: Projectile 'p1' is active
    interpolateVisualState(state, cache, 0.5);
    expect(cache.visualProjectilePositions.has('p1')).toBe(true);

    // Frame 2: Projectile 'p1' explodes and is removed from GameState
    state.projectiles = [];
    interpolateVisualState(state, cache, 0.5);

    // Cache must have evicted 'p1' to prevent memory leaks
    expect(cache.visualProjectilePositions.has('p1')).toBe(false);
  });
});

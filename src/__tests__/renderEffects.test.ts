import { describe, it, expect, vi } from 'vitest';
import {
  renderParticles,
  renderClientExplosions,
  renderNinjaRopes,
  renderSupplyCrates,
  renderFloatingDamages,
  renderMines,
  renderHelicopters,
  renderTombstones,
  ClientParticle,
  ClientExplosion,
  ClientFloatingDamage,
} from '../rendering/renderEffects';
import { GameState, Slug, SupplyCrate, Landmine, HelicopterVehicle, Team } from '../core/types';

describe('renderEffects - Complete Canvas VFX & Entities Pipeline', () => {
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

  const createMockGameState = (): GameState => {
    const teams: Team[] = [
      { id: 'team_red', name: 'Red Team', color: '#ef4444', avatar: 'slug', isHost: true, inventory: {} },
      { id: 'team_blue', name: 'Blue Team', color: '#3b82f6', avatar: 'snail', isHost: false, inventory: {} },
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
        isPlaced: true,
        facing: 'right',
        aimAngle: 0,
        aimPower: 5,
        selectedWeaponId: 'bazooka',
        ropeState: { hookX: 300, hookY: 100, length: 100, angleRad: 0, angularVelocity: 0 },
      },
      {
        id: 'slug_dead',
        teamId: 'team_blue',
        name: 'Shelly',
        x: 500,
        y: 220,
        vx: 0,
        vy: 0,
        hp: 0,
        maxHp: 100,
        isAlive: false,
        isPlaced: true,
        facing: 'left',
        aimAngle: 0,
        aimPower: 5,
        selectedWeaponId: 'grenade',
      },
    ];

    return {
      phase: 'AIMING',
      activeSlugId: 'slug_1',
      activeTeamId: 'team_red',
      teams,
      slugs,
    } as unknown as GameState;
  };

  describe('renderParticles', () => {
    it('updates particle physics, decreases life, and removes expired particles', () => {
      const ctx = createMockContext();
      const particles: ClientParticle[] = [
        { x: 100, y: 100, vx: 2, vy: -1, color: '#facc15', size: 3, life: 0.9 },
        { x: 200, y: 200, vx: 0, vy: 0, color: '#ef4444', size: 2, life: 0.01 }, // will expire
      ];

      renderParticles(ctx, particles);

      expect(particles[0].x).toBe(102);
      expect(particles[0].y).toBe(99);
      expect(particles[0].life).toBeCloseTo(0.865, 3);
      expect(particles).toHaveLength(1); // 2nd particle removed
      expect(ctx.fill).toHaveBeenCalled();
    });

    it('culls particles outside viewport bounds', () => {
      const ctx = createMockContext();
      const particles: ClientParticle[] = [
        { x: 500, y: 100, vx: 0, vy: 0, color: '#ffffff', size: 2, life: 0.5 },
      ];

      // Viewport set between 0 and 300
      renderParticles(ctx, particles, 0, 300);

      // Particle at 500 should be culled (no arc/fill)
      expect(ctx.fill).not.toHaveBeenCalled();
    });
  });

  describe('renderClientExplosions', () => {
    it('renders shockwaves and fireball gradients for active explosions', () => {
      const ctx = createMockContext();
      const now = performance.now();
      const explosions: ClientExplosion[] = [
        { id: 'ex_1', x: 250, y: 180, radius: 45, startTime: now - 100, duration: 400 },
      ];

      renderClientExplosions(ctx, explosions);

      expect(ctx.createRadialGradient).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(explosions).toHaveLength(1);
    });

    it('removes finished explosions once duration has elapsed', () => {
      const ctx = createMockContext();
      const now = performance.now();
      const explosions: ClientExplosion[] = [
        { id: 'ex_old', x: 250, y: 180, radius: 45, startTime: now - 1000, duration: 300 },
      ];

      renderClientExplosions(ctx, explosions);

      expect(explosions).toHaveLength(0);
    });
  });

  describe('renderNinjaRopes', () => {
    it('renders rope line and anchor hook for climbing slugs', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();

      renderNinjaRopes(ctx, gameState.slugs);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.moveTo).toHaveBeenCalledWith(300, 100); // hook pos
      expect(ctx.lineTo).toHaveBeenCalledWith(300, 192); // slug pos (y - 8)
      expect(ctx.restore).toHaveBeenCalled();
    });
  });

  describe('renderSupplyCrates', () => {
    it('renders falling crates with animated parachute sway in the wind and zero gradient allocations', () => {
      const ctx = createMockContext();
      const crates: SupplyCrate[] = [
        { id: 'c_air', x: 200, y: 100, vy: 1.5, isLanded: false, crateType: 'health', healAmount: 50 },
      ];

      renderSupplyCrates(ctx, crates, 15);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.rotate).toHaveBeenCalled();
      expect(ctx.createLinearGradient).not.toHaveBeenCalled();
      expect(ctx.fill).toHaveBeenCalled();
      expect(ctx.stroke).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('renders landed crates with ground drop shadow, health badge, and pure vector emblems', () => {
      const ctx = createMockContext();
      const crates: SupplyCrate[] = [
        { id: 'c_ground', x: 350, y: 280, vy: 0, isLanded: true, crateType: 'health', healAmount: 50 },
        { id: 'c_weapon', x: 450, y: 280, vy: 0, isLanded: true, crateType: 'weapon' },
        { id: 'c_util', x: 550, y: 280, vy: 0, isLanded: true, crateType: 'utility' },
      ];

      renderSupplyCrates(ctx, crates, 0);

      expect(ctx.fillText).toHaveBeenCalledWith('+50 HP', 0, 16);
      expect(ctx.fillText).toHaveBeenCalledWith('ARMES', 0, 16);
      expect(ctx.fillText).toHaveBeenCalledWith('OUTILS', 0, 16);
      expect(ctx.createLinearGradient).not.toHaveBeenCalled();
    });
  });

  describe('renderFloatingDamages', () => {
    it('renders floating heal (+20 HP in green) and damage (-45 in yellow)', () => {
      const ctx = createMockContext();
      const now = performance.now();
      const damages: ClientFloatingDamage[] = [
        { id: 'd_heal', x: 200, y: 150, damage: -25, startTime: now - 50, duration: 1000 },
        { id: 'd_hit', x: 400, y: 150, damage: 60, startTime: now - 50, duration: 1000 },
      ];

      renderFloatingDamages(ctx, damages);

      expect(ctx.fillText).toHaveBeenCalledWith('+25 HP', 200, expect.any(Number));
      expect(ctx.fillText).toHaveBeenCalledWith('-60', 400, expect.any(Number));
      expect(damages).toHaveLength(2);
    });
  });

  describe('renderMines', () => {
    it('renders landmines with red blinking LED and countdown text when triggered', () => {
      const ctx = createMockContext();
      const mines: Landmine[] = [
        { id: 'm_active', x: 300, y: 200, isTriggered: true, fuseTimerMs: 1400 },
        { id: 'm_idle', x: 600, y: 200, isTriggered: false },
      ];

      renderMines(ctx, mines);

      expect(ctx.ellipse).toHaveBeenCalled();
      expect(ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('1.4s'), 300, expect.any(Number));
    });
  });

  describe('renderHelicopters', () => {
    it('renders helicopter fuselage, animated main rotor, tail rotor, searchlight cone and pilot', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      const heli: HelicopterVehicle = {
        id: 'heli_1',
        x: 320,
        y: 180,
        vx: 1.2,
        vy: -0.5,
        hp: 100,
        maxHp: 120,
        facing: 'right',
        pilotSlugId: 'slug_1',
        rotorAngle: 1.2,
      };

      renderHelicopters(ctx, [heli], gameState, 10, true);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.scale).not.toHaveBeenCalledWith(-1, 1);
      expect(ctx.createLinearGradient).toHaveBeenCalled(); // Searchlight cone
      expect(ctx.fillRect).toHaveBeenCalled(); // HP bar
      expect(ctx.restore).toHaveBeenCalled();
    });

    it('renders prompt [ENTRER / E] when an unpiloted helicopter is within range of active slug', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();
      const heli: HelicopterVehicle = {
        id: 'heli_empty',
        x: 310,
        y: 190, // slug_1 is at x=300, y=200 (distance ~14px < 65px)
        vx: 0,
        vy: 0,
        hp: 120,
        maxHp: 120,
        facing: 'right',
        pilotSlugId: null,
        rotorAngle: 0,
      };

      renderHelicopters(ctx, [heli], gameState, 10, true);

      expect(ctx.fillText).toHaveBeenCalledWith(expect.stringContaining('[ENTRER / E]'), 310, expect.any(Number));
    });
  });

  describe('renderTombstones', () => {
    it('renders tombstones with engraved cross for placed dead slugs above water', () => {
      const ctx = createMockContext();
      const gameState = createMockGameState();

      renderTombstones(ctx, gameState.slugs, 400);

      // slug_dead is at x=500, y=220 (above waterLevel 400)
      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.translate).toHaveBeenCalledWith(500, 220);
      expect(ctx.createLinearGradient).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });
  });
});

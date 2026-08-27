import { describe, it, expect, vi } from 'vitest';
import {
  SmokeParticlePool,
  createCloudPool,
  updateAndRenderClouds,
  createStarPool,
  updateAndRenderStars,
} from '../components/game/connection/backdrop/backdropParticlePool';
import {
  drawSafeEllipse,
  drawRoundRect,
} from '../components/game/connection/backdrop/backdropGeometry';

describe('ConnectionBackdropCanvas: Particle Pools & Canvas Geometry', () => {
  describe('SmokeParticlePool (0-allocation ring buffer)', () => {
    it('initializes with 0 active particles and can spawn up to maxCount', () => {
      const pool = new SmokeParticlePool(10);
      expect(pool.getActiveCount()).toBe(0);

      pool.spawn(100, 200, -1, -2, 5);
      expect(pool.getActiveCount()).toBe(1);

      for (let i = 0; i < 15; i++) {
        pool.spawn(i * 10, i * 20, 0, 0, 4);
      }
      // Cannot exceed maxCount = 10
      expect(pool.getActiveCount()).toBe(10);
    });

    it('decays particle life and automatically recycles dead particles without memory allocation', () => {
      const pool = new SmokeParticlePool(5);
      pool.spawn(50, 50, 0.5, -0.5, 3);
      expect(pool.getActiveCount()).toBe(1);

      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      // Update 50 times (life decays by 0.025 each tick -> 50 * 0.025 = 1.25 > 1)
      for (let i = 0; i < 50; i++) {
        pool.updateAndRender(mockCtx);
      }

      // Particle should now be recycled
      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('Clouds & Stars Pools', () => {
    it('creates cloud items with valid speed, size and opacity within bounds', () => {
      const clouds = createCloudPool(1920, 1080);
      expect(clouds.length).toBe(6);

      for (const cloud of clouds) {
        expect(cloud.x).toBeGreaterThanOrEqual(0);
        expect(cloud.speed).toBeGreaterThan(0);
        expect(cloud.size).toBeGreaterThan(0);
        expect(cloud.opacity).toBeGreaterThan(0);
      }
    });

    it('wraps clouds back to left when they drift past right edge', () => {
      const clouds = [{ x: 1200, y: 100, speed: 2, size: 50, opacity: 0.2 }];
      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      updateAndRenderClouds(mockCtx, clouds, 1000); // 1200 + 2 = 1202 > 1000 + 150
      expect(clouds[0].x).toBe(-150);
    });

    it('creates star items and updates alpha oscillation deterministically', () => {
      const stars = createStarPool(1000, 800);
      expect(stars.length).toBe(45);

      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      updateAndRenderStars(mockCtx, stars, 2.5);
      for (const star of stars) {
        expect(star.alpha).toBeGreaterThanOrEqual(0.3);
        expect(star.alpha).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('Canvas Safe Geometry & Radius Clamping', () => {
    it('safely clamps ellipse radii to positive values (prevents Canvas negative radius crash)', () => {
      const mockCtx = {
        beginPath: vi.fn(),
        ellipse: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      drawSafeEllipse(mockCtx, 100, 100, -15, 0);
      expect(mockCtx.ellipse).toHaveBeenCalledWith(100, 100, 15, 0.1, 0, 0, Math.PI * 2);
    });

    it('safely clamps rounded rectangle radius when dimensions are very small', () => {
      const mockCtx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      expect(() => drawRoundRect(mockCtx, 10, 10, 4, 4, 10)).not.toThrow();
    });
  });
});

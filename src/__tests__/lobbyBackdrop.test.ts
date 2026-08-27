import { describe, it, expect, vi } from 'vitest';
import {
  FlarePool,
  createLobbyStarPool,
  updateAndRenderLobbyStars,
  createNebulaCloudPool,
  updateAndRenderNebulaClouds,
} from '../components/game/lobby/backdrop/lobbyParticlePool';
import {
  drawSafeEllipse,
  drawRoundRect,
} from '../components/game/lobby/backdrop/lobbyGeometry';

describe('LobbyBackdropCanvas: Particle Pools & Canvas Geometry', () => {
  describe('FlarePool (0-allocation ring buffer)', () => {
    it('initializes with 0 active flares and caps maximum flares at maxCount', () => {
      const pool = new FlarePool(3);
      expect(pool.getActiveCount()).toBe(0);

      // Force trySpawn by overriding Math.random to 0
      const origRandom = Math.random;
      Math.random = () => 0.001;

      for (let i = 0; i < 10; i++) {
        pool.trySpawn(1920, 1080);
      }
      expect(pool.getActiveCount()).toBe(3);

      Math.random = origRandom;
    });

    it('decays flare life and recycles active flares after trail finishes without allocations', () => {
      const pool = new FlarePool(2);
      const origRandom = Math.random;
      Math.random = () => 0.001;
      pool.trySpawn(1000, 800);
      Math.random = origRandom;

      expect(pool.getActiveCount()).toBe(1);

      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      // Update 80 times (life decays by 0.014 each tick -> 80 * 0.014 = 1.12 > 1)
      for (let i = 0; i < 80; i++) {
        pool.updateAndRender(mockCtx, 800);
      }

      expect(pool.getActiveCount()).toBe(0);
    });
  });

  describe('Stars & Nebula Clouds Pools', () => {
    it('creates stars with alpha between 0.3 and 1.0 during animation', () => {
      const stars = createLobbyStarPool(1200, 800);
      expect(stars.length).toBe(55);

      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      updateAndRenderLobbyStars(mockCtx, stars, 1.5);
      for (const s of stars) {
        expect(s.alpha).toBeGreaterThanOrEqual(0.3);
        expect(s.alpha).toBeLessThanOrEqual(1.0);
      }
    });

    it('wraps nebula clouds back to left when they drift off-screen', () => {
      const clouds = [{ x: 1300, y: 50, speed: 2, size: 60, opacity: 0.15 }];
      const mockCtx = {
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      updateAndRenderNebulaClouds(mockCtx, clouds, 1000); // 1300 + 2 = 1302 > 1000 + 150
      expect(clouds[0].x).toBe(-150);
    });
  });

  describe('Canvas Geometry Bounds Protection', () => {
    it('safely clamps ellipse radii to avoid negative value errors', () => {
      const mockCtx = {
        beginPath: vi.fn(),
        ellipse: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      drawSafeEllipse(mockCtx, 50, 50, -20, 0);
      expect(mockCtx.ellipse).toHaveBeenCalledWith(50, 50, 20, 0.1, 0, 0, Math.PI * 2);
    });

    it('safely handles rounded rectangles with small dimensions without throwing', () => {
      const mockCtx = {
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      expect(() => drawRoundRect(mockCtx, 0, 0, 2, 2, 8)).not.toThrow();
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { MAP_SIZE_CONFIGS, MapSize, MapTheme, Slug, GameState } from '../core/types';
import { generateProceduralTerrain } from '../core/terrainGenerator';
import { startMove, stopMove, moveSlug } from '../core/engine/engineControls';
import { updateSlugPhysics } from '../core/physics';
import { DestructibleTerrain } from '../core/terrain';
import { clampPanOffset } from '../rendering/cameraUtils';
import { SlugWarsEngine } from '../core/gameEngine';

describe('Map Size & Movement Speed Balance (TDD)', () => {
  describe('1. Map Size Configurations (MAP_SIZE_CONFIGS)', () => {
    it('defines recalibrated dimensions for SMALL, NORMAL, and LARGE maps', () => {
      expect(MAP_SIZE_CONFIGS.SMALL.width).toBe(1400);
      expect(MAP_SIZE_CONFIGS.SMALL.height).toBe(800);

      expect(MAP_SIZE_CONFIGS.NORMAL.width).toBe(2000);
      expect(MAP_SIZE_CONFIGS.NORMAL.height).toBe(1000);

      expect(MAP_SIZE_CONFIGS.LARGE.width).toBe(2600);
      expect(MAP_SIZE_CONFIGS.LARGE.height).toBe(1200);
    });

    it('contains informative labels and descriptions with pixel resolutions', () => {
      expect(MAP_SIZE_CONFIGS.SMALL.desc).toContain('1400×800');
      expect(MAP_SIZE_CONFIGS.NORMAL.desc).toContain('2000×1000');
      expect(MAP_SIZE_CONFIGS.LARGE.desc).toContain('2600×1200');
    });
  });

  describe('2. Procedural Terrain Generation across Balanced Dimensions', () => {
    const testThemes: MapTheme[] = ['ISLAND', 'CAVERN', 'FORTRESS', 'FLOATING_CHAOS', 'ORGANIC_CAVES'];
    const mapSizes: MapSize[] = ['SMALL', 'NORMAL', 'LARGE'];

    it.each(mapSizes)('generates valid terrain structure on size %s', (sizeKey) => {
      const cfg = MAP_SIZE_CONFIGS[sizeKey];
      const terrain = generateProceduralTerrain(12345, 'ISLAND', cfg.width, cfg.height);

      expect(terrain.width).toBe(cfg.width);
      expect(terrain.height).toBe(cfg.height);
      expect(terrain.grid.length).toBe(cfg.width * cfg.height);

      // Verify all spawn points are strictly inside map boundaries
      expect(terrain.spawnPoints.length).toBeGreaterThanOrEqual(4);
      for (const sp of terrain.spawnPoints) {
        expect(sp.x).toBeGreaterThanOrEqual(20);
        expect(sp.x).toBeLessThanOrEqual(cfg.width - 20);
        expect(sp.y).toBeGreaterThanOrEqual(20);
        expect(sp.y).toBeLessThanOrEqual(terrain.waterLevel);
      }

      // Verify all mine points are within map bounds
      for (const mp of terrain.minePoints) {
        expect(mp.x).toBeGreaterThanOrEqual(20);
        expect(mp.x).toBeLessThanOrEqual(cfg.width - 20);
      }
    });

    it('generates massive 2600x1200 LARGE maps deterministically across various biomes', () => {
      for (const theme of testThemes) {
        const terrain = generateProceduralTerrain(54321, theme, 2600, 1200);
        expect(terrain.width).toBe(2600);
        expect(terrain.height).toBe(1200);
        expect(terrain.spawnPoints.length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Slug Movement Velocity & Controls (2.4 px/tick)', () => {
    let mockState: GameState;

    beforeEach(() => {
      mockState = {
        phase: 'AIMING',
        activeTeamId: 'team_1',
        activeSlugId: 'slug_1',
        turnTimer: 45,
        turnCount: 1,
        wind: 0,
        config: {
          turnDuration: 45,
          slugsPerTeam: 1,
          slugHp: 100,
          mapTheme: 'ISLAND',
          mapSeed: 42,
          windEnabled: true,
          vehiclesEnabled: true,
          weaponSetId: 'CLASSIC',
        },
        teams: [
          {
            id: 'team_1',
            name: 'Red',
            color: '#ef4444',
            avatar: '🐌',
            isHost: true,
            inventory: { bazooka: -1 },
          },
        ],
        slugs: [
          {
            id: 'slug_1',
            teamId: 'team_1',
            name: 'Speedy Slug',
            x: 200,
            y: 300,
            vx: 0,
            vy: 0,
            hp: 100,
            maxHp: 100,
            facing: 'right',
            aimAngle: 45,
            aimPower: 50,
            selectedWeaponId: 'bazooka',
            isAlive: true,
            isPlaced: true,
          },
        ],
        particles: [],
        floatingDamages: [],
        projectiles: [],
        explosions: [],
        supplyCrates: [],
        mines: [],
        helicopters: [],
        journal: [],
      };
    });

    it('sets slug vx to exact calibrated speed ±2.4 px/tick on startMove', () => {
      startMove(mockState, 'right');
      expect(mockState.slugs[0].vx).toBe(2.4);
      expect(mockState.slugs[0].facing).toBe('right');
      expect(mockState.slugs[0].movingDir).toBe('right');

      startMove(mockState, 'left');
      expect(mockState.slugs[0].vx).toBe(-2.4);
      expect(mockState.slugs[0].facing).toBe('left');
      expect(mockState.slugs[0].movingDir).toBe('left');
    });

    it('resets slug vx and movingDir on stopMove', () => {
      startMove(mockState, 'right');
      expect(mockState.slugs[0].vx).toBe(2.4);

      stopMove(mockState);
      expect(mockState.slugs[0].vx).toBe(0);
      expect(mockState.slugs[0].movingDir).toBeNull();
    });

    it('sets slug vx to ±2.4 px/tick in moveSlug during active turns', () => {
      const movedRight = moveSlug(mockState, 'right');
      expect(movedRight).toBe(true);
      expect(mockState.slugs[0].vx).toBe(2.4);
      expect(mockState.slugs[0].facing).toBe('right');

      const movedLeft = moveSlug(mockState, 'left');
      expect(movedLeft).toBe(true);
      expect(mockState.slugs[0].vx).toBe(-2.4);
      expect(mockState.slugs[0].facing).toBe('left');
    });
  });

  describe('4. Movement Physics Simulation at 2.4 px/tick', () => {
    function createFlatTerrain(width = 600, height = 400, groundY = 250): DestructibleTerrain {
      const grid = new Uint8Array(width * height);
      for (let y = groundY; y < height; y++) {
        for (let x = 0; x < width; x++) {
          grid[y * width + x] = 1;
        }
      }
      return new DestructibleTerrain({
        width,
        height,
        grid,
        theme: 'ISLAND',
        seed: 123,
        waterLevel: height - 10,
        minePoints: [],
        spawnPoints: [{ x: 100, y: groundY - 20 }],
        decorItems: [],
        solidProps: [],
      });
    }

    it('advances slug position smoothly at 2.4 px/tick without tunneling', () => {
      const terrain = createFlatTerrain();
      const slug: Slug = {
        id: 'slug_test',
        teamId: 'team_1',
        name: 'Runner',
        x: 100,
        y: 249,
        vx: 2.4,
        vy: 0,
        hp: 100,
        maxHp: 100,
        facing: 'right',
        movingDir: 'right',
        aimAngle: 45,
        aimPower: 0,
        selectedWeaponId: 'bazooka',
        isAlive: true,
        isPlaced: true,
      };

      for (let i = 0; i < 10; i++) {
        slug.vx = 2.4;
        updateSlugPhysics(slug, terrain, [slug]);
      }

      // Expected displacement after friction: ~20.4px
      expect(slug.x).toBeGreaterThanOrEqual(119);
      expect(slug.x).toBeLessThanOrEqual(124);
      expect(slug.y).toBeLessThanOrEqual(250);
    });
  });

  describe('5. Camera Clamping on Large Maps', () => {
    it('clamps camera pan cleanly within 2600x1200 map boundaries', () => {
      const clampedCenter = clampPanOffset({ x: 0, y: 0 }, 1.0, 1920, 1080, 2600, 1200);
      expect(clampedCenter.x).toBe(0);
      expect(clampedCenter.y).toBe(0);

      const clampedExcessive = clampPanOffset({ x: 9999, y: -9999 }, 1.0, 1920, 1080, 2600, 1200);
      expect(clampedExcessive.x).toBeLessThan(9999);
      expect(clampedExcessive.y).toBeGreaterThan(-9999);
    });
  });

  describe('6. Map Size Switch in Lobby & Entity Placement Consistency', () => {
    it('spawns mines and helicopters on correct terrain geometry when mapSize is changed in lobby', () => {
      const engine = new SlugWarsEngine();
      engine.addTeam('t1', 'Team 1', '#ef4444', 'avatar1', true);
      engine.addTeam('t2', 'Team 2', '#3b82f6', 'avatar2', false);

      engine.setConfig({ mapSize: 'LARGE', mapSeed: 98765 });
      expect(engine.state.config.mapSize).toBe('LARGE');

      engine.startGame();
      expect(engine.terrain.data.width).toBe(2600);
      expect(engine.terrain.data.height).toBe(1200);

      expect(engine.state.mines.length).toBeGreaterThan(0);
      for (const mine of engine.state.mines) {
        expect(mine.x).toBeGreaterThanOrEqual(100);
        expect(mine.x).toBeLessThanOrEqual(2500);
        const groundY = Math.round(mine.y + 3);
        expect(engine.terrain.isSolid(Math.round(mine.x), groundY)).toBe(true);
      }

      if (engine.state.helicopters.length > 0) {
        const heli = engine.state.helicopters[0];
        expect(heli.x).toBeGreaterThanOrEqual(100);
        expect(heli.x).toBeLessThanOrEqual(2500);
        const heliGroundY = Math.round(heli.y + 14);
        expect(engine.terrain.isSolid(Math.round(heli.x), heliGroundY)).toBe(true);
      }
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { updateMines, updateSupplyCrates } from '../core/engine/supplyDropManager';

describe('Tactical Weapons & Utility Items', () => {
  let engine: SlugWarsEngine;

  beforeEach(() => {
    engine = new SlugWarsEngine({
      turnDuration: 45,
      slugsPerTeam: 2,
      mapTheme: 'ISLAND',
      mapSeed: 42,
      turnDelaysEnabled: false,
    });
    engine.addTeam('team_red', 'Red Team', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue Team', '#3b82f6', '🐌', false);
    engine.startGame();

    // Place all slugs
    let offset = 0;
    while (engine.state.phase === 'PLACEMENT') {
      engine.placeSlug({ x: 300 + offset * 80, y: 250 });
      offset++;
    }
  });

  describe('Baseball Bat (baseball_bat)', () => {
    it('applies melee damage and strong knockback to adjacent enemy slug', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const enemySlug = engine.state.slugs.find((s) => s.teamId !== activeSlug.teamId && s.isAlive)!;

      // Position enemy right next to active slug
      activeSlug.x = 200;
      activeSlug.y = 200;
      activeSlug.facing = 'right';
      enemySlug.x = 215;
      enemySlug.y = 200;
      const initialHp = enemySlug.hp;

      engine.selectWeapon('baseball_bat');
      const fired = engine.fireWeapon();

      expect(fired).toBe(true);
      expect(enemySlug.hp).toBe(initialHp - 30);
      expect(enemySlug.vx).toBe(18); // Knockback right
      expect(enemySlug.vy).toBe(-10); // Knockback upward
    });

    it('does not damage slugs that are out of melee range (> 40px)', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      const enemySlug = engine.state.slugs.find((s) => s.teamId !== activeSlug.teamId && s.isAlive)!;

      activeSlug.x = 200;
      activeSlug.y = 200;
      enemySlug.x = 350;
      enemySlug.y = 200;
      const initialHp = enemySlug.hp;

      engine.selectWeapon('baseball_bat');
      engine.fireWeapon();

      expect(enemySlug.hp).toBe(initialHp);
      expect(enemySlug.vx).toBe(0);
    });
  });

  describe('Teleporter (teleport)', () => {
    it('relocates active slug to target coordinates safely and transitions to resolving', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('teleport');

      const targetPoint = { x: 300, y: 150 };
      const fired = engine.fireWeapon(targetPoint);

      expect(fired).toBe(true);
      expect(activeSlug.x).toBeGreaterThan(0);
      expect(activeSlug.vx).toBe(0);
      expect(activeSlug.vy).toBe(0);
      expect(engine.state.phase).toBe('RESOLVING');
    });
  });

  describe('Girder Placement (girder)', () => {
    it('solidifies terrain pixels and records girder in state', () => {
      const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
      engine.selectWeapon('girder');
      activeSlug.aimAngle = 0; // Horizontal girder

      const targetPoint = { x: 400, y: 300 };
      const initialGirdersCount = engine.state.girders?.length || 0;

      const fired = engine.fireWeapon(targetPoint);
      expect(fired).toBe(true);

      expect(engine.state.girders?.length).toBe(initialGirdersCount + 1);
      const placedGirder = engine.state.girders![engine.state.girders!.length - 1];
      expect(placedGirder.x).toBe(400);
      expect(placedGirder.y).toBe(300);
      expect(placedGirder.length).toBe(110);
      expect(placedGirder.thickness).toBe(14);

      // Verify that the terrain grid at the center of the girder is solid
      expect(engine.terrain.isSolid(400, 300)).toBe(true);
    });
  });

  describe('Air Strike (air_strike)', () => {
    it('spawns 5 falling bomb projectiles staggered horizontally across the target', () => {
      engine.selectWeapon('air_strike');
      const targetPoint = { x: 500, y: 300 };

      const initialProjCount = engine.state.projectiles.length;
      const fired = engine.fireWeapon(targetPoint);

      expect(fired).toBe(true);
      expect(engine.state.projectiles.length).toBe(initialProjCount + 5);

      const airBombs = engine.state.projectiles.filter((p) => p.weaponId === 'air_strike');
      expect(airBombs.length).toBe(5);

      // Check staggered X coordinates around targetX (500 - 40 + i * 20)
      expect(airBombs[0].x).toBe(460);
      expect(airBombs[2].x).toBe(500);
      expect(airBombs[4].x).toBe(540);
      expect(airBombs[0].vy).toBeGreaterThan(0); // Falling downwards
    });
  });

  describe('Skip Turn (skip_turn)', () => {
    it('immediately starts resolving phase without creating projectiles', () => {
      engine.selectWeapon('skip_turn');
      const fired = engine.fireWeapon();

      expect(fired).toBe(true);
      expect(engine.state.projectiles.length).toBe(0);
      expect(engine.state.phase).toBe('RESOLVING');
    });
  });

  describe('Landmines & Supply Drops System', () => {
    it('triggers landmine countdown when a living slug steps within 25px', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      engine.state.mines = [
        { id: 'm1', x: 200, y: 200, isTriggered: false },
      ];

      const slug = engine.state.slugs[0];
      slug.x = 210;
      slug.y = 208;
      slug.isAlive = true;
      slug.isPlaced = true;

      updateMines(engine.state, engine.terrain, engine.carveCrater.bind(engine), addLog);

      expect(engine.state.mines[0].isTriggered).toBe(true);
      expect(engine.state.mines[0].fuseTimerMs).toBe(2000);
    });

    it('detonates triggered mine when fuse expires and damages nearby slugs', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      engine.state.mines = [
        { id: 'm1', x: 200, y: 200, isTriggered: true, fuseTimerMs: 50 },
      ];

      const slug = engine.state.slugs[0];
      slug.x = 205;
      slug.y = 205;
      slug.isAlive = true;
      slug.isPlaced = true;
      const hpBefore = slug.hp;

      updateMines(engine.state, engine.terrain, engine.carveCrater.bind(engine), addLog);

      expect(engine.state.mines.length).toBe(0); // Mine exploded and removed
      expect(engine.state.explosions.length).toBeGreaterThan(0);
      expect(slug.hp).toBeLessThan(hpBefore);
    });

    it('supply crate heals slug upon contact and removes crate from state', () => {
      const logs: string[] = [];
      const addLog = (msg: string) => logs.push(msg);

      const slug = engine.state.slugs[0];
      slug.x = 300;
      slug.y = 200;
      slug.isAlive = true;
      slug.hp = 40;
      slug.maxHp = 100;

      engine.state.supplyCrates = [
        {
          id: 'crate_1',
          x: 305,
          y: 195,
          vy: 0,
          isLanded: true,
          crateType: 'health',
          healAmount: 50,
        },
      ];

      updateSupplyCrates(engine.state, engine.terrain, addLog);

      expect(engine.state.supplyCrates.length).toBe(0); // Collected
      expect(slug.hp).toBe(90); // 40 + 50
    });
  });
});

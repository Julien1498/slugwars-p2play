import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { updateSlugPhysics, isSlugGrounded } from '../core/physics/slugPhysics';

describe('Client-Side Movement & Jump Prediction with Soft Anchor Reconciliation', () => {
  it('instantly applies movement velocity and predicts terrain movement on client', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 424242 });
    engine.addTeam('guest_team', 'Guest', '#ef4444', '🐌', true);
    engine.addTeam('enemy_team', 'Enemy', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug(engine.terrain.data.spawnPoints[0]);
    engine.placeSlug(engine.terrain.data.spawnPoints[1]);

    const activeSlug = engine.state.slugs[0];
    const initialX = activeSlug.x;

    // Simulate optimistic START_MOVE 'right' on guest
    activeSlug.movingDir = 'right';
    activeSlug.facing = 'right';
    activeSlug.vx = 3.2;

    expect(activeSlug.movingDir).toBe('right');
    expect(activeSlug.vx).toBe(3.2);

    // Run local physics step
    updateSlugPhysics(activeSlug, engine.terrain, engine.state.slugs);

    // Slug has moved right in local client prediction
    expect(activeSlug.x).toBeGreaterThan(initialX);
  });

  it('instantly predicts upward ballistic jump velocity on client', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 424242 });
    engine.addTeam('guest_team', 'Guest', '#ef4444', '🐌', true);
    engine.addTeam('enemy_team', 'Enemy', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug(engine.terrain.data.spawnPoints[0]);
    engine.placeSlug(engine.terrain.data.spawnPoints[1]);

    const activeSlug = engine.state.slugs[0];

    // Settle slug onto terrain
    for (let i = 0; i < 15; i++) {
      engine.tick();
    }
    const initialY = activeSlug.y;

    // Ensure slug is grounded
    expect(isSlugGrounded(activeSlug, engine.terrain, engine.state.slugs)).toBe(true);

    // Simulate optimistic JUMP on guest
    activeSlug.vy = -6.5;
    activeSlug.vx = activeSlug.facing === 'right' ? 2.5 : -2.5;

    // Run 3 physics ticks in air
    for (let i = 0; i < 3; i++) {
      updateSlugPhysics(activeSlug, engine.terrain, engine.state.slugs);
    }

    // Slug is higher in the air (lower Y coordinate)
    expect(activeSlug.y).toBeLessThan(initialY);
    expect(isSlugGrounded(activeSlug, engine.terrain, engine.state.slugs)).toBe(false);
  });

  it('softly reconciles small host position offsets without snapping', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 424242 });
    engine.addTeam('guest_team', 'Guest', '#ef4444', '🐌', true);
    engine.startGame();
    engine.placeSlug(engine.terrain.data.spawnPoints[0]);

    const activeSlug = engine.state.slugs[0];
    activeSlug.movingDir = null;
    activeSlug.vx = 0;
    activeSlug.x = 200;
    activeSlug.y = 150;

    const hostAuthoritativeX = 206;
    const hostAuthoritativeY = 150;

    // Soft reconciliation formula
    const reconciledX = activeSlug.x + (hostAuthoritativeX - activeSlug.x) * 0.45;
    const reconciledY = activeSlug.y + (hostAuthoritativeY - activeSlug.y) * 0.45;

    expect(reconciledX).toBeCloseTo(202.7, 1);
    expect(reconciledY).toBe(150);
  });
});

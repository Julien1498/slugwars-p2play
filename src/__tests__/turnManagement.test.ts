import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { randomizeWind } from '../core/engine/turnManager';
import { PhaseManager } from '../core/engine/phaseManager';

describe('Turn Management, Team Rotation & Victory Conditions', () => {
  it('rotates turns between competing teams and updates activeSlugId', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 2 });
    engine.addTeam('team_red', 'Red Team', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue Team', '#3b82f6', '🐌', false);
    engine.startGame();

    // Place all 4 slugs
    for (let i = 0; i < 4; i++) {
      engine.placeSlug({ x: 300 + i * 150, y: 300 });
    }

    expect(engine.state.phase).toBe('AIMING');
    const firstTeamId = engine.state.activeTeamId;
    const firstSlugId = engine.state.activeSlugId;

    // End current turn -> switches to team_blue
    engine.endTurn();
    expect(engine.state.activeTeamId).not.toBe(firstTeamId);

    // End team_blue turn -> switches back to team_red, selecting the 2nd slug in team_red
    engine.endTurn();
    expect(engine.state.activeTeamId).toBe(firstTeamId);
    expect(engine.state.activeSlugId).not.toBe(firstSlugId);
  });

  it('randomizes wind within valid configuration bounds', () => {
    const engine = new SlugWarsEngine({ windEnabled: true });
    for (let i = 0; i < 20; i++) {
      randomizeWind(engine.state);
      expect(engine.state.wind).toBeGreaterThanOrEqual(-5);
      expect(engine.state.wind).toBeLessThanOrEqual(5);
    }

    // Wind disabled should always be 0
    engine.state.config.windEnabled = false;
    randomizeWind(engine.state);
    expect(engine.state.wind).toBe(0);
  });

  it('declares GAME_OVER and crowns surviving team as winner', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();

    // Place both slugs
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    expect(engine.state.phase).toBe('AIMING');

    const blueSlug = engine.state.slugs.find((s) => s.teamId === 'team_blue')!;
    blueSlug.isAlive = false;
    blueSlug.hp = 0;

    // Check game condition on next turn transition
    engine.endTurn();

    expect(engine.state.phase).toBe('GAME_OVER');
    expect(engine.state.winnerTeamId).toBe('team_red');
  });

  it('prevents turn resolution and remains in RESOLVING while a slug is airborne high above map (y < 0)', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const initialActiveTeamId = engine.state.activeTeamId;

    // Launch slug high into the stratosphere (negative Y)
    activeSlug.y = -350;
    activeSlug.vy = -15; // Moving upwards in outer atmosphere
    activeSlug.vx = 2;

    // Switch to RESOLVING
    engine.state.phase = 'RESOLVING';
    engine.state.phaseTimer = 5.0;
    engine.state.settleTimer = 0; // Settle delay is finished

    // World should NOT be at rest because slug is in the stratosphere
    expect(engine.isWorldAtRest()).toBe(false);

    // Run engine tick
    engine.tick();

    // Phase MUST remain RESOLVING, and activeTeam MUST NOT change!
    expect(engine.state.phase).toBe('RESOLVING');
    expect(engine.state.activeTeamId).toBe(initialActiveTeamId);
  });

  it('resolves turn only after high airborne slug falls back down and stabilizes on ground', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, slugHp: 250 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    // Allow initial placement to settle on terrain
    for (let i = 0; i < 20; i++) {
      engine.tick();
      engine.state.floatingDamages = [];
    }

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const initialActiveTeamId = engine.state.activeTeamId;
    activeSlug.hp = 200;

    // Launch high above map into negative Y (stratosphere)
    activeSlug.y = -100;
    activeSlug.vy = 5; // Falling back down
    activeSlug.vx = 0;

    PhaseManager.startResolving(engine.state, { settleTimer: 0, phaseTimeout: 25.0 });

    // While in the air, world is NOT at rest and phase stays RESOLVING
    expect(engine.isWorldAtRest()).toBe(false);

    // Simulate falling and landing
    let landed = false;
    for (let i = 0; i < 150; i++) {
      engine.tick();
      // Clear floating damages so they don't block test resolution
      engine.state.floatingDamages = [];
      if ((engine.state.phase as string) === 'AIMING') {
        landed = true;
        break;
      }
    }

    expect(landed).toBe(true);
    expect((engine.state.phase as string)).toBe('AIMING');
    expect(engine.state.activeTeamId).not.toBe(initialActiveTeamId);
  });

  it('transitions to RESOLVING when turn timer reaches 0 and waits for world at rest', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    expect(engine.state.phase).toBe('AIMING');

    // Simulate timer expiring
    engine.state.turnTimer = 0.04;
    engine.tick();

    // Must transition to RESOLVING rather than abruptly jumping turns
    expect(engine.state.phase).toBe('RESOLVING');
  });

  it('PhaseManager manages state machine transitions cleanly without side effects', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    expect(engine.state.phase).toBe('AIMING');

    // Manually trigger resolving
    PhaseManager.startResolving(engine.state, { settleTimer: 0.5, phaseTimeout: 10.0 });
    expect(engine.state.phase).toBe('RESOLVING');
    expect(engine.state.settleTimer).toBe(0.5);
    expect(engine.state.phaseTimer).toBe(10.0);
  });

  it('safely places slug outside solid walls when exiting helicopter near terrain', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;

    // Create helicopter close to a solid wall on its right
    const heli = engine.state.helicopters[0];
    heli.x = 400;
    heli.y = 200;
    heli.facing = 'right';
    heli.pilotSlugId = activeSlug.id;
    activeSlug.inVehicleId = heli.id;

    // Make the right side of the helicopter solid rock
    for (let y = 180; y <= 220; y++) {
      for (let x = 420; x <= 450; x++) {
        engine.terrain.data.grid[y * engine.terrain.data.width + x] = 1;
      }
    }

    // Exit vehicle
    engine.exitVehicle();

    // Slug should NOT be placed inside the solid wall
    expect(activeSlug.inVehicleId).toBeNull();
    expect(engine.terrain.isSolid(activeSlug.x, activeSlug.y)).toBe(false);
  });

  it('resolves turn promptly when active slug is piloting a stationary helicopter', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('team_red', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('team_blue', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    for (let i = 0; i < 20; i++) {
      engine.tick();
      engine.state.floatingDamages = [];
    }

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const heli = engine.state.helicopters[0];
    heli.pilotSlugId = activeSlug.id;
    heli.vx = 0;
    heli.vy = 0;
    activeSlug.inVehicleId = heli.id;

    // A stationary helicopter with a pilot MUST report isWorldAtRest as true
    expect(engine.isWorldAtRest()).toBe(true);

    // End turn -> should advance cleanly
    engine.endTurn();
    expect((engine.state.phase as string)).toBe('AIMING');
  });
});

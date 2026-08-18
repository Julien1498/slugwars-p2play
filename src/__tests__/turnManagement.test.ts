import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { randomizeWind } from '../core/engine/turnManager';

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
});

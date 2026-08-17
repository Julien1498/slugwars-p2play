import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { GameConfig } from '../core/types';

function createTestEngine(): SlugWarsEngine {
  const config: Partial<GameConfig> = {
    turnDuration: 45,
    slugsPerTeam: 2,
    slugHp: 100,
    weaponSetId: 'CLASSIC',
  };
  const engine = new SlugWarsEngine(config);
  engine.addTeam('team_red', 'Équipe Rouge', '#ef4444', '🐌', true);
  engine.addTeam('team_blue', 'Équipe Bleue', '#3b82f6', '🐌', false);
  return engine;
}

describe('GameEngine: Rules, Turns & Weapons', () => {
  it('initializes teams, starts game, and spawns placed slugs', () => {
    const engine = createTestEngine();
    expect(engine.state.phase).toBe('LOBBY');

    engine.startGame();
    expect(['PLACEMENT', 'TURN_START', 'AIMING']).toContain(engine.state.phase);
    expect(engine.state.slugs.length).toBe(4); // 2 slugs x 2 teams
    expect(engine.state.teams.length).toBe(2);
  });

  it('allows weapon selection and consumes ammo on firing', () => {
    const engine = createTestEngine();
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;

    // Ensure grenade has initial ammo
    activeTeam.inventory['grenade'] = 5;
    engine.selectWeapon('grenade');
    expect(activeSlug.selectedWeaponId).toBe('grenade');

    // Fire weapon
    engine.fireWeapon();
    expect(activeTeam.inventory['grenade']).toBe(4);
    expect(engine.state.projectiles.length).toBe(1);
    expect(engine.state.phase).toBe('RETREAT'); // Bouncing timer weapons trigger retreat phase!
  });

  it('configures custom fuse timer (1s to 5s) and transfers it to active projectile', () => {
    const engine = createTestEngine();
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    engine.selectWeapon('dynamite');

    // Set fuse to 2 seconds
    engine.setFuseTimer(activeSlug.id, 2);
    expect(activeSlug.fuseTimerSec).toBe(2);

    // Fire dynamite
    engine.fireWeapon();
    expect(engine.state.projectiles.length).toBe(1);
    const proj = engine.state.projectiles[0];
    expect(proj.weaponId).toBe('dynamite');
    expect(proj.fuseTimerMs).toBe(2000); // 2s * 1000ms
  });

  it('automatically falls back to bazooka when ammo is exhausted', () => {
    const engine = createTestEngine();
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;

    // Set holy_grenade ammo to 1
    activeTeam.inventory['holy_grenade'] = 1;
    engine.selectWeapon('holy_grenade');
    expect(activeSlug.selectedWeaponId).toBe('holy_grenade');

    // Fire holy grenade (uses last ammo)
    engine.fireWeapon();
    expect(activeTeam.inventory['holy_grenade']).toBe(0);
    // Should fallback to default unlimited bazooka
    expect(activeSlug.selectedWeaponId).toBe('bazooka');
  });
});

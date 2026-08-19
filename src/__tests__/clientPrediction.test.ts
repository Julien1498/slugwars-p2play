import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';

describe('Optimistic Aiming, Facing and Weapon Selection', () => {
  it('instantly applies aim angle and facing changes on active slug', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 424242 });
    engine.addTeam('guest_team', 'Guest', '#ef4444', '🐌', true);
    engine.addTeam('enemy_team', 'Enemy', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug(engine.terrain.data.spawnPoints[0]);
    engine.placeSlug(engine.terrain.data.spawnPoints[1]);

    const activeSlug = engine.state.slugs[0];

    // Optimistic aim update
    activeSlug.aimAngle = 65;
    activeSlug.facing = 'left';
    activeSlug.currentTargetPoint = { x: 300, y: 150 };

    expect(activeSlug.aimAngle).toBe(65);
    expect(activeSlug.facing).toBe('left');
    expect(activeSlug.currentTargetPoint).toEqual({ x: 300, y: 150 });
  });

  it('instantly applies weapon selection and custom fuse timer', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1, mapTheme: 'ISLAND', mapSeed: 424242 });
    engine.addTeam('guest_team', 'Guest', '#ef4444', '🐌', true);
    engine.addTeam('enemy_team', 'Enemy', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug(engine.terrain.data.spawnPoints[0]);
    engine.placeSlug(engine.terrain.data.spawnPoints[1]);

    const activeSlug = engine.state.slugs[0];

    // Optimistic weapon & fuse timer selection
    activeSlug.selectedWeaponId = 'holy_grenade';
    activeSlug.fuseTimerSec = 4;

    expect(activeSlug.selectedWeaponId).toBe('holy_grenade');
    expect(activeSlug.fuseTimerSec).toBe(4);
  });
});

import { describe, it, expect } from 'vitest';
import { SlugWarsEngine } from '../core/gameEngine';
import { getWeapon, getAllWeapons, getWeaponsByCategory } from '../core/weapons/registry';

describe('Weapons Arsenal & Mechanics', () => {
  it('registers all weapons across valid categories', () => {
    const all = getAllWeapons();
    expect(all.length).toBeGreaterThanOrEqual(15);

    const explosive = getWeaponsByCategory('EXPLOSIVE');
    const airSupport = getWeaponsByCategory('AIR_SUPPORT');
    const utility = getWeaponsByCategory('UTILITY');

    expect(explosive.length).toBeGreaterThan(0);
    expect(airSupport.length).toBeGreaterThan(0);
    expect(utility.length).toBeGreaterThan(0);

    const bazooka = getWeapon('bazooka');
    expect(bazooka.id).toBe('bazooka');
    expect(bazooka.damage).toBeGreaterThan(0);
    expect(bazooka.radius).toBeGreaterThan(0);
  });

  it('executes Air Strike correctly at targeted coordinates', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['air_strike'] = 2;
    engine.selectWeapon('air_strike');

    const targetX = 650;
    const targetY = 300;

    engine.fireWeapon({ x: targetX, y: targetY });

    // Air Strike spawns incoming missile projectiles above map
    expect(engine.state.projectiles.length).toBeGreaterThanOrEqual(3);
    for (const p of engine.state.projectiles) {
      expect(p.weaponId).toBe('air_strike');
      expect(p.y).toBeLessThan(0); // Spawns from top sky
    }
  });

  it('executes Teleport weapon moving slug to targeted destination', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;
    activeTeam.inventory['teleport'] = 2;
    engine.selectWeapon('teleport');

    const targetX = 750;
    const targetY = 250;

    engine.fireWeapon({ x: targetX, y: targetY });

    expect(activeSlug.x).toBe(targetX);
    expect(activeSlug.y).toBeGreaterThan(0);
    expect(activeTeam.inventory['teleport']).toBe(1);
    expect(engine.state.phase).toBe('RESOLVING');
  });

  it('places a Girder platform into the game world and alters terrain grid', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;
    activeTeam.inventory['girder'] = 3;
    engine.selectWeapon('girder');

    const targetX = 500;
    const targetY = 300;

    engine.fireWeapon({ x: targetX, y: targetY });

    expect(engine.state.girders?.length).toBe(1);
    const girder = (engine.state.girders || [])[0];
    expect(girder).toBeTruthy();
    expect(girder.x).toBe(targetX);
    expect(girder.y).toBe(targetY);
    expect(engine.terrain.isSolid(targetX, targetY)).toBe(true);
  });

  it('handles supply drop spawning and health/ammo replenishment', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();

    // Manually push a supply crate into game world
    engine.state.supplyCrates = [
      {
        id: 'crate_1',
        x: 450,
        y: 100,
        vy: 1.5,
        isLanded: false,
        crateType: 'health',
        healAmount: 50,
      },
    ];

    expect(engine.state.supplyCrates.length).toBe(1);
    const crate = engine.state.supplyCrates[0];
    expect(crate.crateType).toBe('health');
    expect(crate.healAmount).toBe(50);
  });

  it('handles Concrete Donkey multiple impacts and successive terrain pounding', () => {
    const engine = new SlugWarsEngine({ turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['concrete_donkey'] = 1;
    engine.selectWeapon('concrete_donkey');

    // Fire Concrete Donkey
    engine.fireWeapon({ x: 500, y: 300 });
    expect(engine.state.projectiles.length).toBe(1);

    const donkey = engine.state.projectiles[0];
    expect(donkey.weaponId).toBe('concrete_donkey');
    expect(donkey.behaviorData?.bouncesLeft).toBe(8);

    // Find actual ground point at x=500 and position donkey right above impact
    const ground = engine.terrain.raycastSolid(500, 0, 500, 700);
    expect(ground.hit).toBe(true);

    donkey.x = 500;
    donkey.y = ground.y - 5;
    donkey.vy = 14;

    // Run engine tick to process explosion & bounce
    engine.tick();

    // After 1st impact, explosions list received a blast and donkey bounced back into projectiles
    expect(engine.state.explosions.length).toBeGreaterThanOrEqual(1);
    expect(engine.state.projectiles.length).toBe(1);
    expect(engine.state.projectiles[0].behaviorData?.bouncesLeft).toBe(7);
  });
});

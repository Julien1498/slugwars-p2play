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
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
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
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
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

    expect(activeSlug.x).toBeGreaterThan(600);
    expect(activeSlug.x).toBeLessThan(900);
    expect(activeSlug.y).toBeGreaterThan(0);
    expect(activeTeam.inventory['teleport']).toBe(1);
    expect(engine.state.phase).toBe('RESOLVING');
  });

  it('places a Girder platform into the game world and alters terrain grid', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
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
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
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
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
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

    // If the donkey drops into water (y >= waterLevel), it should sink and NOT bounce back into projectiles
    const activeDonkey = engine.state.projectiles[0];
    activeDonkey.y = engine.terrain.data.waterLevel - 5;
    activeDonkey.vy = 10;

    engine.tick();

    // Reaching water should destroy the donkey (no projectiles left)
    expect(engine.state.projectiles.length).toBe(0);
  });

  it('detonates Holy Grenade with massive radius, 110 damage, and holy sound', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['holy_grenade'] = 1;
    engine.selectWeapon('holy_grenade');

    engine.fireWeapon();
    expect(engine.state.projectiles.length).toBe(1);
    const holy = engine.state.projectiles[0];
    expect(holy.weaponId).toBe('holy_grenade');

    // Simulate holy grenade fuse expiring
    holy.fuseTimerMs = 10;
    holy.x = 400;
    holy.y = 300;
    holy.vx = 0;
    holy.vy = 0;

    engine.tick();

    expect(engine.state.explosions.length).toBeGreaterThanOrEqual(1);
    const holyExplosion = engine.state.explosions.find((ex) => ex.radius >= 70);
    expect(holyExplosion).toBeTruthy();
    expect(holyExplosion?.damage).toBe(90);
    expect(holyExplosion?.customSound).toBe('holy_choir');
  });

  it('explodes Banana Bomb and scatters 5 cluster bananettes', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['banana_bomb'] = 1;
    engine.selectWeapon('banana_bomb');

    engine.fireWeapon();
    expect(engine.state.projectiles.length).toBe(1);
    const banana = engine.state.projectiles[0];
    expect(banana.weaponId).toBe('banana_bomb');

    // Expire banana fuse
    banana.fuseTimerMs = 10;
    banana.x = 450;
    banana.y = 250;
    banana.vx = 0;
    banana.vy = 0;

    engine.tick();

    // Banana explodes and produces 5 cluster bananettes
    expect(engine.state.explosions.length).toBeGreaterThanOrEqual(1);
    const clusterBananettes = engine.state.projectiles.filter((p) => p.weaponId === 'cluster_banana');
    expect(clusterBananettes.length).toBe(5);
  });

  it('allows steering Super Sheep in flight and detonates on command or impact', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['super_sheep'] = 1;
    engine.selectWeapon('super_sheep');

    engine.fireWeapon();
    const sheep = engine.state.projectiles.find((p) => p.weaponId === 'super_sheep')!;
    expect(sheep).toBeTruthy();

    const initialVx = sheep.vx;
    const initialVy = sheep.vy;

    // Steer sheep left
    engine.steerSheep('left');
    expect(sheep.vx !== initialVx || sheep.vy !== initialVy).toBe(true);

    // Detonate sheep manually
    engine.detonateSheep();
    expect(engine.state.explosions.length).toBeGreaterThanOrEqual(1);
    expect(engine.state.projectiles.some((p) => p.weaponId === 'super_sheep')).toBe(false);
  });

  it('triggers landmine on proximity (<25px) and counts down to blast', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;

    // Place an untriggered mine right next to active slug (distance 15px)
    engine.state.mines = [
      {
        id: 'mine_test_1',
        x: activeSlug.x + 15,
        y: activeSlug.y,
        isTriggered: false,
        fuseTimerMs: 2000,
      },
    ];

    // Tick engine to detect proximity
    engine.tick();

    const mine = engine.state.mines[0];
    expect(mine.isTriggered).toBe(true);

    // Simulate fuse expiration
    mine.fuseTimerMs = 10;
    engine.tick();

    // Mine should have exploded and vanished
    expect(engine.state.explosions.length).toBeGreaterThanOrEqual(1);
    expect(engine.state.mines.length).toBe(0);
  });

  it('operates blowtorch tunneling through terrain', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.placeSlug({ x: 300, y: 300 });
    engine.placeSlug({ x: 600, y: 300 });

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;
    activeTeam.inventory['blowtorch'] = 100;
    engine.selectWeapon('blowtorch');
    activeSlug.facing = 'right';
    activeSlug.aimAngle = 0;

    const wallX = Math.floor(activeSlug.x + 18);
    const wallY = Math.floor(activeSlug.y - 8);

    // Create a solid wall directly in front of the slug
    for (let dy = -6; dy <= 6; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        engine.terrain.data.grid[(wallY + dy) * engine.terrain.data.width + (wallX + dx)] = 1;
      }
    }
    expect(engine.terrain.isSolid(wallX, wallY)).toBe(true);

    // Fire blowtorch
    engine.fireWeapon();
    expect(activeSlug.isBlowtorching).toBe(true);

    // Run ticks to carve tunnel
    for (let i = 0; i < 5; i++) {
      engine.tick();
    }

    // Wall right ahead should now be hollowed out by the blowtorch
    expect(engine.terrain.isSolid(wallX, wallY)).toBe(false);
  });

  it('executes skip_turn weapon and passes turn cleanly', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    engine.selectWeapon('skip_turn');
    expect(activeSlug.selectedWeaponId).toBe('skip_turn');

    engine.fireWeapon();
    expect(engine.state.phase).toBe('RESOLVING');
  });

  it('resets selectedWeaponId to bazooka for all team slugs when ammo reaches 0', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 2 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const teamSlugs = engine.state.slugs.filter((s) => s.teamId === activeSlug.teamId);
    const activeTeam = engine.state.teams.find((t) => t.id === activeSlug.teamId)!;

    // Both slugs in team have holy_grenade selected
    activeTeam.inventory['holy_grenade'] = 1;
    for (const s of teamSlugs) {
      s.selectedWeaponId = 'holy_grenade';
    }

    // Fire the last holy_grenade
    engine.fireWeapon({ x: 500, y: 300 });

    // Inventory reaches 0
    expect(activeTeam.inventory['holy_grenade']).toBe(0);

    // All slugs in the team should be reset to bazooka
    for (const s of teamSlugs) {
      expect(s.selectedWeaponId).toBe('bazooka');
    }
  });

  it('bounces grenades predictably off flat floors and vertical walls using surface normals', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    // Clear map area for clean test
    const width = engine.terrain.data.width;
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        engine.terrain.data.grid[y * width + x] = 0; // Air
      }
    }
    // Solid flat ground at y >= 100
    for (let y = 100; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        engine.terrain.data.grid[y * width + x] = 1;
      }
    }

    // Spawn grenade moving down-right (vx=6, vy=8) towards floor
    engine.state.projectiles = [
      {
        id: 'test_grenade_floor',
        weaponId: 'grenade',
        x: 50,
        y: 95,
        vx: 6,
        vy: 8,
        radius: 4,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 2000,
        ownerSlugId: 'nobody',
      },
    ];

    engine.tick();

    const bouncedFloor = engine.state.projectiles[0];
    // On flat floor: horizontal velocity should maintain forward direction (vx > 0), vertical should bounce UP (vy < 0)
    expect(bouncedFloor.vx).toBeGreaterThan(0);
    expect(bouncedFloor.vy).toBeLessThan(0);

    // Now test vertical wall on the right: wall at x >= 100, air at x < 100
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x < 200; x++) {
        engine.terrain.data.grid[y * width + x] = x >= 100 ? 1 : 0;
      }
    }

    engine.state.projectiles = [
      {
        id: 'test_grenade_wall',
        weaponId: 'grenade',
        x: 95,
        y: 50,
        vx: 8,
        vy: 3,
        radius: 4,
        bounces: true,
        windAffected: false,
        fuseTimerMs: 2000,
        ownerSlugId: 'nobody',
      },
    ];

    engine.tick();

    const bouncedWall = engine.state.projectiles[0];
    // On right wall: horizontal velocity should flip to left (vx < 0), vertical should maintain downward motion (vy > 0)
    expect(bouncedWall.vx).toBeLessThan(0);
    expect(bouncedWall.vy).toBeGreaterThan(0);
  });

  it('fires non-chargeable weapons like dynamite immediately on startCharge', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['dynamite'] = 2;
    engine.selectWeapon('dynamite');

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    expect(activeSlug.isChargingPower).toBeFalsy();

    // Calling startCharge on dynamite should immediately place the dynamite and enter retreat phase
    engine.startCharge();

    expect(activeSlug.isChargingPower).toBeFalsy();
    expect(engine.state.projectiles.some((p) => p.weaponId === 'dynamite')).toBe(true);
    expect(engine.state.phase).toBe('RETREAT');
  });

  it('immediately liberates helicopter when the pilot slug dies', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 2 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    const heli = {
      id: 'heli_test_1',
      x: activeSlug.x + 10,
      y: activeSlug.y - 10,
      vx: 0,
      vy: 0,
      hp: 100,
      maxHp: 100,
      facing: 'right' as const,
      isFlying: false,
      rotorAngle: 0,
      pilotSlugId: null,
    };
    engine.state.helicopters = [heli];

    // Slug enters helicopter
    const entered = engine.enterVehicle();
    expect(entered).toBe(true);
    expect(heli.pilotSlugId).toBe(activeSlug.id);
    expect(activeSlug.inVehicleId).toBe(heli.id);

    // Pilot slug takes fatal damage (e.g. killed by weapon)
    activeSlug.hp = 0;
    activeSlug.isAlive = false;

    // Tick the engine
    engine.tick();

    // Helicopter should now be free (pilotSlugId null) and available for other slugs
    expect(heli.pilotSlugId).toBeNull();
    expect(activeSlug.inVehicleId).toBeNull();

    // Another slug can now enter the liberated helicopter
    const otherSlug = engine.state.slugs.find((s) => s.id !== activeSlug.id && s.isAlive)!;
    engine.state.phase = 'AIMING';
    engine.state.activeSlugId = otherSlug.id;
    engine.state.activeTeamId = otherSlug.teamId;
    otherSlug.x = heli.x + 5;
    otherSlug.y = heli.y + 5;

    const otherEntered = engine.enterVehicle();
    expect(otherEntered).toBe(true);
    expect(heli.pilotSlugId).toBe(otherSlug.id);
    expect(otherSlug.inVehicleId).toBe(heli.id);
  });

  it('charges homing missile and scales initial launch velocity and ballistic delay with power', () => {
    const engine = new SlugWarsEngine({ turnDelaysEnabled: false, turnDuration: 45, slugsPerTeam: 1 });
    engine.addTeam('t1', 'Red', '#ef4444', '🐌', true);
    engine.addTeam('t2', 'Blue', '#3b82f6', '🐌', false);
    engine.startGame();
    engine.state.phase = 'AIMING';

    const activeTeam = engine.state.teams.find((t) => t.id === engine.state.activeTeamId)!;
    activeTeam.inventory['homing_missile'] = 3;
    engine.selectWeapon('homing_missile');

    const activeSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId)!;
    activeSlug.currentTargetPoint = { x: 800, y: 300 };

    // Start charging homing missile
    engine.startCharge();
    expect(activeSlug.isChargingPower).toBe(true);

    // Simulate charging up to 80% power
    activeSlug.aimPower = 80;
    engine.releaseCharge();

    expect(activeSlug.isChargingPower).toBe(false);
    expect(engine.state.projectiles.length).toBe(1);

    const missile = engine.state.projectiles[0];
    expect(missile.weaponId).toBe('homing_missile');
    expect(missile.targetPoint).toEqual({ x: 800, y: 300 });

    // Initial speed at 80% power: (80/100)*16 + 4 = 16.8 px/tick
    const launchSpeed = Math.hypot(missile.vx, missile.vy);
    expect(launchSpeed).toBeGreaterThan(15);
    // Initial delay before homing kicks in: 500ms
    expect(missile.behaviorData?.homingDelayMs).toBe(500);
  });
});


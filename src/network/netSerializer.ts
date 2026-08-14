import { GameState, Slug, Landmine, HelicopterVehicle, ActiveProjectile, ExplosionEvent, FloatingDamage, Particle, PlacedGirder, SupplyCrate } from '../core/types';

export function quantizeFloat(val: number | undefined | null, decimals: number = 2): number {
  if (val === undefined || val === null || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

export interface CompactRopeDelta {
  hx: number;
  hy: number;
  l: number;
  a: number;
  w: number;
}

export interface CompactSlugDelta {
  i: string; // id
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  hp?: number;
  f?: 'left' | 'right';
  a?: number; // aimAngle
  p?: number; // aimPower
  c?: boolean; // isChargingPower
  w?: string; // selectedWeaponId
  al?: boolean; // isAlive
  pl?: boolean; // isPlaced
  v?: string | null; // inVehicleId
  tp?: { x: number; y: number }; // currentTargetPoint
  rs?: CompactRopeDelta | null; // ropeState
}

export interface CompactStateDelta {
  phase?: string;
  activeTeamId?: string;
  activeSlugId?: string;
  turnTimer?: number;
  retreatTimer?: number;
  wind?: number;
  slugs?: CompactSlugDelta[];
  helicopters?: Partial<HelicopterVehicle>[];
  mines?: Partial<Landmine>[];
  projectiles?: Partial<ActiveProjectile>[];
  explosions?: Partial<ExplosionEvent>[];
  floatingDamages?: FloatingDamage[];
  particles?: Partial<Particle>[];
  supplyCrates?: Partial<SupplyCrate>[];
  girders?: PlacedGirder[];
}

export function buildStateDelta(prevState: GameState | null, currentState: GameState): CompactStateDelta {
  const delta: CompactStateDelta = {};

  if (!prevState || prevState.phase !== currentState.phase) delta.phase = currentState.phase;
  if (!prevState || prevState.activeTeamId !== currentState.activeTeamId) delta.activeTeamId = currentState.activeTeamId;
  if (!prevState || prevState.activeSlugId !== currentState.activeSlugId) delta.activeSlugId = currentState.activeSlugId;
  if (!prevState || Math.abs(prevState.turnTimer - currentState.turnTimer) > 0.1) delta.turnTimer = quantizeFloat(currentState.turnTimer, 1);
  if (currentState.retreatTimer !== undefined && (!prevState || Math.abs((prevState.retreatTimer ?? 0) - currentState.retreatTimer) > 0.1)) {
    delta.retreatTimer = quantizeFloat(currentState.retreatTimer, 1);
  }
  if (!prevState || prevState.wind !== currentState.wind) delta.wind = currentState.wind;

  // Slug Deltas
  const slugDeltas: CompactSlugDelta[] = [];
  for (const slug of currentState.slugs) {
    const prevSlug = prevState?.slugs.find((s) => s.id === slug.id);
    const sDelta: CompactSlugDelta = { i: slug.id };
    let hasChange = false;

    if (!prevSlug || Math.abs(prevSlug.x - slug.x) > 0.05) { sDelta.x = quantizeFloat(slug.x, 2); hasChange = true; }
    if (!prevSlug || Math.abs(prevSlug.y - slug.y) > 0.05) { sDelta.y = quantizeFloat(slug.y, 2); hasChange = true; }
    if (!prevSlug || Math.abs(prevSlug.vx - slug.vx) > 0.05) { sDelta.vx = quantizeFloat(slug.vx, 2); hasChange = true; }
    if (!prevSlug || Math.abs(prevSlug.vy - slug.vy) > 0.05) { sDelta.vy = quantizeFloat(slug.vy, 2); hasChange = true; }
    if (!prevSlug || prevSlug.hp !== slug.hp) { sDelta.hp = slug.hp; hasChange = true; }
    if (!prevSlug || prevSlug.facing !== slug.facing) { sDelta.f = slug.facing; hasChange = true; }
    if (!prevSlug || prevSlug.aimAngle !== slug.aimAngle) { sDelta.a = slug.aimAngle; hasChange = true; }
    if (!prevSlug || Math.abs(prevSlug.aimPower - slug.aimPower) > 0.1) { sDelta.p = quantizeFloat(slug.aimPower, 1); hasChange = true; }
    if (!prevSlug || prevSlug.isChargingPower !== slug.isChargingPower) { sDelta.c = slug.isChargingPower; hasChange = true; }
    if (!prevSlug || prevSlug.selectedWeaponId !== slug.selectedWeaponId) { sDelta.w = slug.selectedWeaponId; hasChange = true; }
    if (!prevSlug || prevSlug.isAlive !== slug.isAlive) { sDelta.al = slug.isAlive; hasChange = true; }
    if (!prevSlug || prevSlug.isPlaced !== slug.isPlaced) { sDelta.pl = slug.isPlaced; hasChange = true; }
    if (!prevSlug || prevSlug.inVehicleId !== slug.inVehicleId) { sDelta.v = slug.inVehicleId; hasChange = true; }
    if (!prevSlug || prevSlug.currentTargetPoint !== slug.currentTargetPoint) {
      sDelta.tp = slug.currentTargetPoint ? { x: quantizeFloat(slug.currentTargetPoint.x, 1), y: quantizeFloat(slug.currentTargetPoint.y, 1) } : undefined;
      hasChange = true;
    }

    // Ninja Rope State Sync
    if (slug.ropeState) {
      sDelta.rs = {
        hx: quantizeFloat(slug.ropeState.hookX, 1),
        hy: quantizeFloat(slug.ropeState.hookY, 1),
        l: quantizeFloat(slug.ropeState.length, 1),
        a: quantizeFloat(slug.ropeState.angleRad, 3),
        w: quantizeFloat(slug.ropeState.angularVelocity, 3),
      };
      hasChange = true;
    } else if (prevSlug?.ropeState) {
      sDelta.rs = null;
      hasChange = true;
    }

    if (hasChange) slugDeltas.push(sDelta);
  }
  if (slugDeltas.length > 0) delta.slugs = slugDeltas;

  // Projectiles (Always synchronized every tick so Guest is 100% in sync with Host!)
  delta.projectiles = currentState.projectiles.map((p) => ({
    id: p.id,
    weaponId: p.weaponId,
    x: quantizeFloat(p.x, 2),
    y: quantizeFloat(p.y, 2),
    vx: quantizeFloat(p.vx, 2),
    vy: quantizeFloat(p.vy, 2),
    radius: p.radius,
    fuseTimerMs: p.fuseTimerMs,
    bounces: p.bounces,
    windAffected: p.windAffected,
    ownerSlugId: p.ownerSlugId,
    targetPoint: p.targetPoint ? { x: quantizeFloat(p.targetPoint.x, 2), y: quantizeFloat(p.targetPoint.y, 2) } : undefined,
    behaviorData: p.behaviorData ? JSON.parse(JSON.stringify(p.behaviorData)) : undefined,
  }));

  // Girders Sync
  if (currentState.girders && currentState.girders.length > 0) {
    delta.girders = currentState.girders;
  }

  // Supply Crates Sync
  if (currentState.supplyCrates && currentState.supplyCrates.length > 0) {
    delta.supplyCrates = currentState.supplyCrates.map((c) => ({
      id: c.id,
      x: quantizeFloat(c.x, 2),
      y: quantizeFloat(c.y, 2),
      vy: quantizeFloat(c.vy, 2),
      isLanded: c.isLanded,
      crateType: c.crateType,
      healAmount: c.healAmount,
    }));
  } else if (prevState && prevState.supplyCrates && prevState.supplyCrates.length > 0) {
    delta.supplyCrates = [];
  }

  // Explosions (Crater Carving & Shockwave VFX)
  if (currentState.explosions.length > 0) {
    delta.explosions = currentState.explosions.map((ex) => ({
      id: ex.id,
      x: quantizeFloat(ex.x, 2),
      y: quantizeFloat(ex.y, 2),
      radius: ex.radius,
      damage: ex.damage,
      createdAt: ex.createdAt,
    }));
  } else if (prevState && prevState.explosions.length > 0) {
    delta.explosions = [];
  }

  // Floating Damages
  if (currentState.floatingDamages && currentState.floatingDamages.length > 0) {
    delta.floatingDamages = currentState.floatingDamages;
  } else if (prevState && prevState.floatingDamages && prevState.floatingDamages.length > 0) {
    delta.floatingDamages = [];
  }

  // Particles
  if (currentState.particles && currentState.particles.length > 0) {
    delta.particles = currentState.particles.map((p) => ({
      x: quantizeFloat(p.x, 1),
      y: quantizeFloat(p.y, 1),
      vx: quantizeFloat(p.vx, 1),
      vy: quantizeFloat(p.vy, 1),
      color: p.color,
      size: p.size,
      life: quantizeFloat(p.life, 2),
    }));
  } else if (prevState && prevState.particles && prevState.particles.length > 0) {
    delta.particles = [];
  }

  // Mines
  if (currentState.mines && currentState.mines.length > 0) {
    delta.mines = currentState.mines.map((m) => ({
      id: m.id,
      x: m.x,
      y: m.y,
      isTriggered: m.isTriggered,
      fuseTimerMs: m.fuseTimerMs,
    }));
  }

  // Helicopters
  if (currentState.helicopters && currentState.helicopters.length > 0) {
    delta.helicopters = currentState.helicopters.map((h) => ({
      id: h.id,
      x: quantizeFloat(h.x, 2),
      y: quantizeFloat(h.y, 2),
      hp: h.hp,
      facing: h.facing,
      pilotSlugId: h.pilotSlugId,
    }));
  }

  return delta;
}

export function applyStateDelta(localState: GameState, delta: CompactStateDelta): void {
  if (delta.phase) localState.phase = delta.phase as any;
  if (delta.activeTeamId) localState.activeTeamId = delta.activeTeamId;
  if (delta.activeSlugId) localState.activeSlugId = delta.activeSlugId;
  if (delta.turnTimer !== undefined) localState.turnTimer = delta.turnTimer;
  if (delta.retreatTimer !== undefined) localState.retreatTimer = delta.retreatTimer;
  if (delta.wind !== undefined) localState.wind = delta.wind;

  if (delta.slugs) {
    for (const dSlug of delta.slugs) {
      const slug = localState.slugs.find((s) => s.id === dSlug.i);
      if (slug) {
        if (dSlug.x !== undefined) slug.x = dSlug.x;
        if (dSlug.y !== undefined) slug.y = dSlug.y;
        if (dSlug.vx !== undefined) slug.vx = dSlug.vx;
        if (dSlug.vy !== undefined) slug.vy = dSlug.vy;
        if (dSlug.hp !== undefined) slug.hp = dSlug.hp;
        if (dSlug.f !== undefined) slug.facing = dSlug.f;
        if (dSlug.a !== undefined) slug.aimAngle = dSlug.a;
        if (dSlug.p !== undefined) slug.aimPower = dSlug.p;
        if (dSlug.c !== undefined) slug.isChargingPower = dSlug.c;
        if (dSlug.w !== undefined) slug.selectedWeaponId = dSlug.w;
        if (dSlug.al !== undefined) slug.isAlive = dSlug.al;
        if (dSlug.pl !== undefined) slug.isPlaced = dSlug.pl;
        if (dSlug.v !== undefined) slug.inVehicleId = dSlug.v;
        if (dSlug.tp !== undefined) slug.currentTargetPoint = dSlug.tp;

        // Apply Ninja Rope State
        if (dSlug.rs === null) {
          slug.ropeState = null;
        } else if (dSlug.rs) {
          slug.ropeState = {
            hookX: dSlug.rs.hx,
            hookY: dSlug.rs.hy,
            length: dSlug.rs.l,
            angleRad: dSlug.rs.a,
            angularVelocity: dSlug.rs.w,
          };
        }
      }
    }
  }

  if (delta.projectiles !== undefined) {
    localState.projectiles = delta.projectiles as any;
  }

  if (delta.girders !== undefined) {
    localState.girders = delta.girders;
  }

  if (delta.supplyCrates !== undefined) {
    localState.supplyCrates = delta.supplyCrates as any;
  }

  if (delta.explosions !== undefined) {
    localState.explosions = delta.explosions as any;
  }

  if (delta.floatingDamages !== undefined) {
    localState.floatingDamages = delta.floatingDamages as any;
  }

  if (delta.particles !== undefined) {
    localState.particles = delta.particles as any;
  }

  if (delta.mines !== undefined) {
    localState.mines = delta.mines as any;
  }

  if (delta.helicopters !== undefined) {
    for (const dHeli of delta.helicopters) {
      const heli = localState.helicopters?.find((h) => h.id === dHeli.id);
      if (heli) {
        if (dHeli.x !== undefined) heli.x = dHeli.x;
        if (dHeli.y !== undefined) heli.y = dHeli.y;
        if (dHeli.hp !== undefined) heli.hp = dHeli.hp;
        if (dHeli.facing !== undefined) heli.facing = dHeli.facing;
        if (dHeli.pilotSlugId !== undefined) heli.pilotSlugId = dHeli.pilotSlugId;
      }
    }
  }
}

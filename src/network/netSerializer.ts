import { GameState, Slug, Landmine, HelicopterVehicle, ActiveProjectile, ExplosionEvent } from '../core/types';

export function quantizeFloat(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
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
  w?: string; // selectedWeaponId
  al?: boolean; // isAlive
  pl?: boolean; // isPlaced
  v?: string | null; // inVehicleId
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
    if (!prevSlug || prevSlug.aimPower !== slug.aimPower) { sDelta.p = slug.aimPower; hasChange = true; }
    if (!prevSlug || prevSlug.selectedWeaponId !== slug.selectedWeaponId) { sDelta.w = slug.selectedWeaponId; hasChange = true; }
    if (!prevSlug || prevSlug.isAlive !== slug.isAlive) { sDelta.al = slug.isAlive; hasChange = true; }
    if (!prevSlug || prevSlug.isPlaced !== slug.isPlaced) { sDelta.pl = slug.isPlaced; hasChange = true; }
    if (!prevSlug || prevSlug.inVehicleId !== slug.inVehicleId) { sDelta.v = slug.inVehicleId; hasChange = true; }

    if (hasChange) slugDeltas.push(sDelta);
  }
  if (slugDeltas.length > 0) delta.slugs = slugDeltas;

  // Projectiles
  if (currentState.projectiles.length > 0 || (prevState && prevState.projectiles.length > 0)) {
    delta.projectiles = currentState.projectiles.map((p) => ({
      id: p.id,
      x: quantizeFloat(p.x, 2),
      y: quantizeFloat(p.y, 2),
      vx: quantizeFloat(p.vx, 2),
      vy: quantizeFloat(p.vy, 2),
      radius: p.radius,
      weaponId: p.weaponId,
      fuseTimerMs: p.fuseTimerMs,
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
        if (dSlug.w !== undefined) slug.selectedWeaponId = dSlug.w;
        if (dSlug.al !== undefined) slug.isAlive = dSlug.al;
        if (dSlug.pl !== undefined) slug.isPlaced = dSlug.pl;
        if (dSlug.v !== undefined) slug.inVehicleId = dSlug.v;
      }
    }
  }

  if (delta.projectiles !== undefined) {
    localState.projectiles = delta.projectiles as any;
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

import { GameState, Slug, Landmine, HelicopterVehicle, ActiveProjectile, ExplosionEvent, Particle, PlacedGirder, SupplyCrate, CraterRecord } from '../core/types';

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
  i?: string; // id (optional fallback)
  idx?: number; // 0-based slug index (1 byte instead of 43-character UUID string!)
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
  ft?: number; // fuseTimerSec (1 to 5)
  bt?: boolean; // isBlowtorching
}

export interface CompactTeamDelta {
  id: string;
  kills?: number;
  deaths?: number;
  damageDealt?: number;
  damageTaken?: number;
  inventory?: Record<string, number>;
}

export interface CompactStateDelta {
  phase?: string;
  winnerTeamId?: string | null;
  activeTeamId?: string;
  activeSlugId?: string;
  turnTimer?: number;
  retreatTimer?: number | null;
  wind?: number;
  waterLevel?: number;
  teams?: CompactTeamDelta[];
  slugs?: CompactSlugDelta[];
  helicopters?: Partial<HelicopterVehicle>[];
  mines?: Partial<Landmine>[];
  projectiles?: Partial<ActiveProjectile>[];
  explosions?: Partial<ExplosionEvent>[];
  supplyCrates?: Partial<SupplyCrate>[];
  girders?: PlacedGirder[];
  craters?: CraterRecord[];
  journal?: GameState['journal'];
}

export function buildStateDelta(prevState: GameState | null, currentState: GameState): CompactStateDelta {
  const delta: CompactStateDelta = {};

  const isPhaseChanged = !prevState || prevState.phase !== currentState.phase;
  const isTurnChanged = !prevState || prevState.activeTeamId !== currentState.activeTeamId || prevState.activeSlugId !== currentState.activeSlugId;

  if (isPhaseChanged) delta.phase = currentState.phase;
  if (isTurnChanged) {
    delta.activeTeamId = currentState.activeTeamId;
    delta.activeSlugId = currentState.activeSlugId;
  }

  // Broadcast turnTimer only on whole second tick (1 Hz) or phase/turn change to eliminate idle network churn
  const prevSec = prevState ? Math.floor(prevState.turnTimer) : -1;
  const curSec = Math.floor(currentState.turnTimer);

  if (isPhaseChanged || isTurnChanged || prevSec !== curSec || currentState.turnTimer <= 5) {
    delta.turnTimer = quantizeFloat(currentState.turnTimer, 1);
  }

  // Retreat timer sync
  if (currentState.retreatTimer !== undefined && currentState.retreatTimer !== null) {
    const prevRetreatSec = prevState?.retreatTimer !== undefined && prevState?.retreatTimer !== null ? Math.floor(prevState.retreatTimer) : -1;
    const curRetreatSec = Math.floor(currentState.retreatTimer);
    if (isPhaseChanged || prevRetreatSec !== curRetreatSec || currentState.retreatTimer <= 3) {
      delta.retreatTimer = quantizeFloat(currentState.retreatTimer, 1);
    }
  } else if (prevState && prevState.retreatTimer !== undefined && prevState.retreatTimer !== null) {
    delta.retreatTimer = null;
  }

  if (currentState.winnerTeamId !== undefined && (!prevState || prevState.winnerTeamId !== currentState.winnerTeamId)) {
    delta.winnerTeamId = currentState.winnerTeamId;
  }

  // Water level sync (Montée des Eaux)
  if (currentState.waterLevel !== undefined && (!prevState || prevState.waterLevel !== currentState.waterLevel)) {
    delta.waterLevel = quantizeFloat(currentState.waterLevel, 1);
  }

  // Team stats & inventory delta (sync kills, deaths, damageDealt, damageTaken & ammo inventory in real-time!)
  const teamDeltas: CompactTeamDelta[] = [];
  for (const team of currentState.teams) {
    const prevTeam = prevState?.teams.find((t) => t.id === team.id);
    const hasStatsChanged = !prevTeam ||
      prevTeam.stats?.kills !== team.stats?.kills ||
      prevTeam.stats?.deaths !== team.stats?.deaths ||
      prevTeam.stats?.damageDealt !== team.stats?.damageDealt ||
      prevTeam.stats?.damageTaken !== team.stats?.damageTaken;

    let hasInventoryChanged = false;
    if (!prevTeam || !prevTeam.inventory) {
      hasInventoryChanged = true;
    } else {
      const curInv = team.inventory || {};
      const prevInv = prevTeam.inventory || {};
      const curKeys = Object.keys(curInv);
      const prevKeys = Object.keys(prevInv);
      if (curKeys.length !== prevKeys.length) {
        hasInventoryChanged = true;
      } else {
        for (const k of curKeys) {
          if (curInv[k] !== prevInv[k]) {
            hasInventoryChanged = true;
            break;
          }
        }
      }
    }

    if (hasStatsChanged || hasInventoryChanged) {
      const tDelta: CompactTeamDelta = { id: team.id };
      if (team.stats) {
        tDelta.kills = team.stats.kills;
        tDelta.deaths = team.stats.deaths;
        tDelta.damageDealt = team.stats.damageDealt;
        tDelta.damageTaken = team.stats.damageTaken;
      }
      if (hasInventoryChanged && team.inventory) {
        tDelta.inventory = { ...team.inventory };
      }
      teamDeltas.push(tDelta);
    }
  }
  if (teamDeltas.length > 0) delta.teams = teamDeltas;

  if (!prevState || prevState.wind !== currentState.wind) {
    delta.wind = currentState.wind;
  }

  // Slug Deltas (only changed fields + ultra-compact 1-byte integer index)
  const slugDeltas: CompactSlugDelta[] = [];
  for (let sIdx = 0; sIdx < currentState.slugs.length; sIdx++) {
    const slug = currentState.slugs[sIdx];
    const prevSlug = prevState?.slugs.find((s) => s.id === slug.id);
    const sDelta: CompactSlugDelta = { idx: sIdx };
    let hasChange = false;

    if (!prevSlug) {
      sDelta.i = slug.id; // Include string UUID only on initial spawn
      hasChange = true;
    }

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

    if (!prevSlug || prevSlug.fuseTimerSec !== slug.fuseTimerSec) {
      sDelta.ft = slug.fuseTimerSec;
      hasChange = true;
    }

    if (!prevSlug || prevSlug.isBlowtorching !== slug.isBlowtorching) {
      sDelta.bt = slug.isBlowtorching;
      hasChange = true;
    }

    if (hasChange) slugDeltas.push(sDelta);
  }
  if (slugDeltas.length > 0) delta.slugs = slugDeltas;

  // Projectiles: only sync when active projectiles exist or when clearing previously flying projectiles
  if (currentState.projectiles.length > 0) {
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
  } else if (prevState && prevState.projectiles.length > 0) {
    delta.projectiles = [];
  }

  // Point 1: Girders Sync - ONLY when new girders are placed
  const curGirders = currentState.girders || [];
  const prevGirders = prevState?.girders || [];
  if (curGirders.length !== prevGirders.length) {
    delta.girders = curGirders;
  }

  // Point 4: Supply Crates Sync - while falling, when landing state changes, or when crates count changes
  const curCrates = currentState.supplyCrates || [];
  const prevCrates = prevState?.supplyCrates || [];
  const hasFallingCrate = curCrates.some((c) => !c.isLanded);
  const anyLandingStateChanged = curCrates.some((c) => {
    const pc = prevCrates.find((p) => p.id === c.id);
    return !pc || pc.isLanded !== c.isLanded || Math.abs(pc.y - c.y) > 0.5;
  });
  if (curCrates.length !== prevCrates.length || hasFallingCrate || anyLandingStateChanged) {
    if (curCrates.length > 0) {
      delta.supplyCrates = curCrates.map((c) => ({
        id: c.id,
        x: quantizeFloat(c.x, 2),
        y: quantizeFloat(c.y, 2),
        vy: quantizeFloat(c.vy, 2),
        isLanded: c.isLanded,
        crateType: c.crateType,
        healAmount: c.healAmount,
      }));
    } else {
      delta.supplyCrates = [];
    }
  }

  // Point 2: Mines Sync - ONLY when a mine state changes (trigger, countdown, explosion) or when count changes
  const curMines = currentState.mines || [];
  const prevMines = prevState?.mines || [];
  const minesCountChanged = curMines.length !== prevMines.length;
  const anyMineChanged = curMines.some((m) => {
    const pm = prevMines.find((p) => p.id === m.id);
    return !pm || pm.isTriggered !== m.isTriggered || pm.fuseTimerMs !== m.fuseTimerMs;
  });

  if (minesCountChanged || anyMineChanged) {
    delta.mines = curMines.map((m) => ({
      id: m.id,
      x: quantizeFloat(m.x, 2),
      y: quantizeFloat(m.y, 2),
      isTriggered: m.isTriggered,
      fuseTimerMs: m.fuseTimerMs !== undefined ? Math.round(m.fuseTimerMs) : undefined,
    }));
  }

  // Point 5: Explosions Sync (compact - animations & debris are 100% client-side)
  if (currentState.explosions.length > 0) {
    delta.explosions = currentState.explosions.map((ex) => ({
      id: ex.id,
      x: quantizeFloat(ex.x, 2),
      y: quantizeFloat(ex.y, 2),
      radius: ex.radius,
    }));
  } else if (prevState && prevState.explosions.length > 0) {
    delta.explosions = [];
  }

  // Persistent Craters Sync - ONLY when new craters are carved into the terrain
  const curCraters = currentState.craters || [];
  const prevCraters = prevState?.craters || [];
  if (curCraters.length !== prevCraters.length) {
    delta.craters = curCraters;
  }

  // Helicopters: strictly sync only changed fields (don't resend static hp, facing, pilotId every tick)
  const curHelis = currentState.helicopters || [];
  const prevHelis = prevState?.helicopters || [];
  const heliCountChanged = curHelis.length !== prevHelis.length;

  const changedHelis: typeof curHelis = [];
  for (const h of curHelis) {
    const prevH = prevHelis.find((p) => p.id === h.id);
    const threshold = h.pilotSlugId ? 0.2 : 0.8;
    const hasMoved = !prevH || Math.abs(prevH.x - h.x) > threshold || Math.abs(prevH.y - h.y) > threshold;
    const hasStatusChanged = !prevH || prevH.hp !== h.hp || prevH.pilotSlugId !== h.pilotSlugId || prevH.facing !== h.facing || Math.abs((prevH.vx || 0) - (h.vx || 0)) > 0.05;

    if (hasMoved || hasStatusChanged) {
      changedHelis.push(h);
    }
  }

  if (heliCountChanged || changedHelis.length > 0) {
    delta.helicopters = changedHelis.map((h) => {
      const prevH = prevHelis.find((p) => p.id === h.id);
      const hDelta: Partial<HelicopterVehicle> = { id: h.id };
      if (!prevH || Math.abs(prevH.x - h.x) > 0.1) hDelta.x = quantizeFloat(h.x, 2);
      if (!prevH || Math.abs(prevH.y - h.y) > 0.1) hDelta.y = quantizeFloat(h.y, 2);
      if (!prevH || Math.abs((prevH.vx || 0) - (h.vx || 0)) > 0.05) hDelta.vx = quantizeFloat(h.vx || 0, 2);
      if (!prevH || Math.abs((prevH.vy || 0) - (h.vy || 0)) > 0.05) hDelta.vy = quantizeFloat(h.vy || 0, 2);
      if (!prevH || prevH.hp !== h.hp) hDelta.hp = h.hp;
      if (!prevH || prevH.facing !== h.facing) hDelta.facing = h.facing;
      if (!prevH || prevH.pilotSlugId !== h.pilotSlugId) hDelta.pilotSlugId = h.pilotSlugId;
      return hDelta;
    });
  } else if (prevState && prevState.helicopters && prevState.helicopters.length > 0 && curHelis.length === 0) {
    delta.helicopters = [];
  }

  // Journal Combat Log Sync (instant real-time combat log entries)
  const curJournal = currentState.journal || [];
  const prevJournal = prevState?.journal || [];
  if (curJournal.length > 0 && curJournal[0]?.id !== prevJournal[0]?.id) {
    delta.journal = curJournal.slice(0, 5);
  }

  return delta;
}

export function applyStateDelta(localState: GameState, delta: CompactStateDelta): void {
  if (delta.journal && delta.journal.length > 0) {
    if (!localState.journal) localState.journal = [];
    for (const newEntry of delta.journal) {
      if (!localState.journal.some((j) => j.id === newEntry.id)) {
        localState.journal.unshift(newEntry);
      }
    }
    if (localState.journal.length > 50) localState.journal.splice(50);
  }

  if (delta.phase) {
    localState.phase = delta.phase as any;
    if (delta.phase !== 'RETREAT') {
      localState.retreatTimer = undefined;
    }
  }
  if (delta.winnerTeamId !== undefined) {
    localState.winnerTeamId = delta.winnerTeamId === null ? undefined : delta.winnerTeamId;
  }
  if (delta.activeTeamId) localState.activeTeamId = delta.activeTeamId;
  if (delta.activeSlugId) localState.activeSlugId = delta.activeSlugId;
  if (delta.turnTimer !== undefined) localState.turnTimer = delta.turnTimer;
  if (delta.retreatTimer !== undefined) {
    localState.retreatTimer = delta.retreatTimer === null ? undefined : delta.retreatTimer;
  }
  if (delta.wind !== undefined) localState.wind = delta.wind;
  if (delta.waterLevel !== undefined) localState.waterLevel = delta.waterLevel;

  if (delta.teams) {
    for (const dTeam of delta.teams) {
      const team = localState.teams.find((t) => t.id === dTeam.id);
      if (team) {
        if (!team.stats) team.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
        if (dTeam.kills !== undefined) team.stats.kills = dTeam.kills;
        if (dTeam.deaths !== undefined) team.stats.deaths = dTeam.deaths;
        if (dTeam.damageDealt !== undefined) team.stats.damageDealt = dTeam.damageDealt;
        if (dTeam.damageTaken !== undefined) team.stats.damageTaken = dTeam.damageTaken;
        if (dTeam.inventory !== undefined) {
          team.inventory = { ...dTeam.inventory };
        }
      }
    }
  }

  if (delta.slugs) {
    for (const dSlug of delta.slugs) {
      const slug = dSlug.idx !== undefined 
        ? localState.slugs[dSlug.idx] 
        : localState.slugs.find((s) => s.id === dSlug.i);
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
        if (dSlug.ft !== undefined) slug.fuseTimerSec = dSlug.ft;
        if (dSlug.bt !== undefined) slug.isBlowtorching = dSlug.bt;

        // Apply Ninja Rope State
        if (dSlug.rs === null || ('rs' in dSlug && !dSlug.rs)) {
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

  if (delta.craters !== undefined) {
    localState.craters = delta.craters;
  }

  if (delta.supplyCrates !== undefined) {
    localState.supplyCrates = delta.supplyCrates as any;
  }

  if (delta.explosions !== undefined) {
    localState.explosions = delta.explosions as any;
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
        if (dHeli.vx !== undefined) heli.vx = dHeli.vx;
        if (dHeli.vy !== undefined) heli.vy = dHeli.vy;
        if (dHeli.hp !== undefined) heli.hp = dHeli.hp;
        if (dHeli.facing !== undefined) heli.facing = dHeli.facing;
        if (dHeli.pilotSlugId !== undefined) heli.pilotSlugId = dHeli.pilotSlugId;
      }
    }
  }
}

/**
 * Checks if a delta contains zero state modifications (true idle state).
 * Used to avoid transmitting empty packets over WebRTC.
 */
export function isDeltaEmpty(delta: CompactStateDelta): boolean {
  return (
    delta.phase === undefined &&
    delta.winnerTeamId === undefined &&
    delta.activeTeamId === undefined &&
    delta.activeSlugId === undefined &&
    delta.turnTimer === undefined &&
    delta.retreatTimer === undefined &&
    delta.wind === undefined &&
    (!delta.teams || delta.teams.length === 0) &&
    (!delta.slugs || delta.slugs.length === 0) &&
    (!delta.projectiles || delta.projectiles.length === 0) &&
    (!delta.explosions || delta.explosions.length === 0) &&
    (!delta.girders || delta.girders.length === 0) &&
    (!delta.craters || delta.craters.length === 0) &&
    (!delta.supplyCrates || delta.supplyCrates.length === 0) &&
    (!delta.mines || delta.mines.length === 0) &&
    (!delta.helicopters || delta.helicopters.length === 0) &&
    (!delta.journal || delta.journal.length === 0)
  );
}


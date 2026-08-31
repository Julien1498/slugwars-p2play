import {
  GameState,
  HelicopterVehicle,
} from '../../core/types';
import {
  CompactStateDelta,
  CompactTeamDelta,
  CompactSlugDelta,
  quantizeFloat,
} from './netSerializerTypes';

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

  if (currentState.isTimerFrozen !== prevState?.isTimerFrozen) delta.isTimerFrozen = currentState.isTimerFrozen;
  if (currentState.godModeEnabled !== prevState?.godModeEnabled) delta.godModeEnabled = currentState.godModeEnabled;
  if (currentState.solidProps && currentState.solidProps.length !== (prevState?.solidProps?.length ?? 0)) {
    delta.solidProps = currentState.solidProps;
  }

  // Team stats & inventory delta
  const teamDeltas: CompactTeamDelta[] = [];
  for (const team of currentState.teams) {
    const prevTeam = prevState?.teams.find((t) => t.id === team.id);
    const hasStatsChanged = !prevTeam || prevTeam.stats?.kills !== team.stats?.kills || prevTeam.stats?.deaths !== team.stats?.deaths || prevTeam.stats?.damageDealt !== team.stats?.damageDealt || prevTeam.stats?.damageTaken !== team.stats?.damageTaken;
    const curInv = team.inventory || {};
    const prevInv = prevTeam?.inventory || {};
    const hasInventoryChanged = !prevTeam || JSON.stringify(curInv) !== JSON.stringify(prevInv);

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

  // Projectiles
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

  // Girders Sync
  const curGirders = currentState.girders || [];
  const prevGirders = prevState?.girders || [];
  if (curGirders.length !== prevGirders.length) {
    delta.girders = curGirders;
  }

  // Supply Crates Sync
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
        weaponId: c.weaponId,
        weaponCount: c.weaponCount,
      }));
    } else {
      delta.supplyCrates = [];
    }
  }

  // Mines Sync
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

  // Explosions Sync
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

  // Persistent Craters & Terrain Builds Sync
  const curCraters = currentState.craters || [];
  if (curCraters.length !== (prevState?.craters || []).length) delta.craters = curCraters;

  const curBuilds = currentState.terrainBuilds || [];
  if (curBuilds.length !== (prevState?.terrainBuilds || []).length) delta.terrainBuilds = curBuilds;

  // Helicopters
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

  // Journal Combat Log Sync
  const curJournal = currentState.journal || [];
  const prevJournal = prevState?.journal || [];
  if (curJournal.length > 0 && curJournal[0]?.id !== prevJournal[0]?.id) {
    delta.journal = curJournal.slice(0, 5);
  }

  // Floating Damages / Combat Text VFX Sync
  const curFloating = currentState.floatingDamages || [];
  const prevFloating = prevState?.floatingDamages || [];
  if (
    curFloating.length > 0 &&
    (prevFloating.length === 0 ||
      curFloating[curFloating.length - 1]?.id !== prevFloating[prevFloating.length - 1]?.id ||
      curFloating.length !== prevFloating.length)
  ) {
    delta.floatingDamages = curFloating.slice(-5);
  }

  return delta;
}

import { GameState } from '../../core/types';
import { CompactStateDelta } from './netSerializerTypes';

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

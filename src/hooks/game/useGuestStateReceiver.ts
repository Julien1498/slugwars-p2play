import { useEffect, useRef, MutableRefObject } from 'react';
import { SlugWarsEngine } from '../../core/gameEngine';
import { GameState, PlacedGirder } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { applyStateDelta } from '../../network/netSerializer';
import { sfx } from '../../core/audio';
import { netMetrics } from '../../core/networkMetrics';
import { PeerManagerLike } from 'p2play-core';
import { unwrapGameState, unwrapDeltaState } from '../../network/payloadNormalizer';
import { getIsLocalPlayerTurn, isPlayablePhase } from '../../core/turnAuthority';

function stampGirderToTerrain(terrain: DestructibleTerrain, g: PlacedGirder): void {
  const rad = (g.angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfL = g.length / 2;
  const halfT = g.thickness / 2;
  const w = terrain.data.width;
  const h = terrain.data.height;

  for (let dl = -halfL; dl <= halfL; dl++) {
    for (let dt = -halfT; dt <= halfT; dt++) {
      const px = Math.round(g.x + dl * cos - dt * sin);
      const py = Math.round(g.y + dl * sin + dt * cos);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        terrain.data.grid[py * w + px] = 1;
      }
    }
  }
}

export function useGuestStateReceiver(
  engineRef: MutableRefObject<SlugWarsEngine>,
  isHost: boolean,
  peerManager: PeerManagerLike,
  setGameState: (state: GameState, force?: boolean) => void,
  myPeerId?: string
) {
  const knownProjIdsRef = useRef<Set<string>>(new Set());
  const knownExplosionIdsRef = useRef<Set<string>>(new Set());
  const knownGirderIdsRef = useRef<Set<string>>(new Set());
  const knownCraterIdsRef = useRef<Set<string>>(new Set());
  const knownBuildIdsRef = useRef<Set<string>>(new Set());
  const knownCrateIdsRef = useRef<Set<string>>(new Set());
  const knownMineTriggerIdsRef = useRef<Set<string>>(new Set());
  const prevPhaseRef = useRef<string>('LOBBY');
  const prevMapKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (isHost) return;
    peerManager.onStateReceived = (payload: any) => {
      if (!payload) return;
      const engine = engineRef.current;
      if (!engine) return;

      const delta = unwrapDeltaState(payload);

      netMetrics.recordDownload(payload, delta || payload);

      if (delta) {
        // Sound effects for Guest on incoming new projectiles or bounces
        if (delta.projectiles && Array.isArray(delta.projectiles)) {
          for (const p of delta.projectiles) {
            if (p.id && !knownProjIdsRef.current.has(p.id)) {
              knownProjIdsRef.current.add(p.id);
              if (p.weaponId === 'super_sheep') {
                sfx.play('baah');
              } else if (p.weaponId === 'baseball_bat') {
                sfx.play('melee');
              } else if (p.weaponId !== 'teleport') {
                sfx.play('fire');
              }
            } else if (p.id && p.bounces) {
              const existing = engine.state.projectiles.find((ep) => ep.id === p.id);
              if (existing && p.vx !== undefined && Math.sign(p.vx) !== Math.sign(existing.vx) && Math.abs(p.vx - existing.vx) > 1.5) {
                sfx.play('bounce');
              }
            }
          }
        }

        // Sound effects for Guest on incoming explosions
        if (delta.explosions && Array.isArray(delta.explosions)) {
          for (const ex of delta.explosions) {
            if (ex.id && !knownExplosionIdsRef.current.has(ex.id)) {
              knownExplosionIdsRef.current.add(ex.id);
              sfx.play('explosion');
            }
          }
        }

        // Sound effects for Guest on Supply Crates dropped
        if (delta.supplyCrates && Array.isArray(delta.supplyCrates)) {
          for (const c of delta.supplyCrates) {
            if (c.id && !knownCrateIdsRef.current.has(c.id)) {
              knownCrateIdsRef.current.add(c.id);
              sfx.play('airdrop');
            }
          }
        }

        // Sound effect for Guest on Crate Pickup VFX
        if (delta.floatingDamages && Array.isArray(delta.floatingDamages)) {
          for (const fd of delta.floatingDamages) {
            if (fd.id && (fd.id.startsWith('weap_') || fd.id.startsWith('heal_'))) {
              sfx.play('airdrop');
            }
          }
        }

        // Sound effects for Guest on Mines triggered
        if (delta.mines && Array.isArray(delta.mines)) {
          for (const m of delta.mines) {
            if (m.id && m.isTriggered && !knownMineTriggerIdsRef.current.has(m.id)) {
              knownMineTriggerIdsRef.current.add(m.id);
              sfx.play('tick');
            }
          }
        }

        // Sound effects for Guest on Slugs (Placement, Jump, Teleport, Rope, Splash)
        if (delta.slugs && Array.isArray(delta.slugs)) {
          const waterLevel = engine.terrain.data.waterLevel;
          for (const dSlug of delta.slugs) {
            const slug = dSlug.idx !== undefined ? engine.state.slugs[dSlug.idx] : engine.state.slugs.find((s) => s.id === dSlug.i);
            if (slug) {
              if (dSlug.pl && !slug.isPlaced) {
                sfx.play('jump');
              }
              if (dSlug.rs && !slug.ropeState) {
                sfx.play('rope_shoot');
              }
              if (dSlug.vy !== undefined && dSlug.vy < -3 && Math.abs(slug.vy) < 0.5 && !slug.inVehicleId) {
                sfx.play('jump');
              }
              if (dSlug.x !== undefined && Math.hypot(dSlug.x - slug.x, (dSlug.y || slug.y) - slug.y) > 120) {
                sfx.play('teleport');
              }
              if (dSlug.y !== undefined && dSlug.y >= waterLevel && slug.y < waterLevel) {
                sfx.play('splash');
              }
            }
          }
        }

        // Before applying delta, if this guest is the currently active player, preserve active aim & weapon selection to avoid rubberbanding
        const isMyActiveTurn = myPeerId && engine.state.activeTeamId === myPeerId && (engine.state.phase === 'AIMING' || engine.state.phase === 'TURN_TIME' || engine.state.phase === 'RETREAT');
        const myActiveSlug = isMyActiveTurn ? engine.state.slugs.find((s) => s.id === engine.state.activeSlugId) : null;
        const preservedAim = myActiveSlug
          ? {
              aimAngle: myActiveSlug.aimAngle,
              facing: myActiveSlug.facing,
              selectedWeaponId: myActiveSlug.selectedWeaponId,
              currentTargetPoint: myActiveSlug.currentTargetPoint,
              fuseTimerSec: myActiveSlug.fuseTimerSec,
            }
          : null;

        applyStateDelta(engine.state, delta);

        // Victory sound on Game Over & Fresh Terrain Reset on Match Start
        if (delta.phase && delta.phase !== prevPhaseRef.current) {
          if (delta.phase === 'GAME_OVER') {
            sfx.play('victory');
          }
          if (delta.phase === 'PLACEMENT' && prevPhaseRef.current === 'LOBBY') {
            engine.initTerrain();
            knownGirderIdsRef.current.clear();
            knownCraterIdsRef.current.clear();
            knownBuildIdsRef.current.clear();
            knownProjIdsRef.current.clear();
            knownExplosionIdsRef.current.clear();
          }
          prevPhaseRef.current = delta.phase;
        }

        if (preservedAim && myActiveSlug) {
          myActiveSlug.aimAngle = preservedAim.aimAngle;
          myActiveSlug.facing = preservedAim.facing;
          myActiveSlug.selectedWeaponId = preservedAim.selectedWeaponId;
          myActiveSlug.currentTargetPoint = preservedAim.currentTargetPoint;
          myActiveSlug.fuseTimerSec = preservedAim.fuseTimerSec;
        }

        if (engine.state.girders && engine.state.girders.length > 0) {
          for (const g of engine.state.girders) {
            if (!knownGirderIdsRef.current.has(g.id)) {
              knownGirderIdsRef.current.add(g.id);
              stampGirderToTerrain(engine.terrain, g);
              sfx.play('girder');
            }
          }
        }

        if (engine.state.craters && engine.state.craters.length > 0) {
          for (const c of engine.state.craters) {
            if (!knownCraterIdsRef.current.has(c.id)) {
              knownCraterIdsRef.current.add(c.id);
              engine.terrain.carveExplosion(c.x, c.y, c.radius);
            }
          }
        }

        if (engine.state.explosions && engine.state.explosions.length > 0) {
          for (const ex of engine.state.explosions) {
            engine.terrain.carveExplosion(ex.x, ex.y, ex.radius);
          }
        }

        const hasActiveDynamics =
          (engine.state.projectiles?.length ?? 0) > 0 ||
          (engine.state.explosions?.length ?? 0) > 0 ||
          (engine.state.floatingDamages?.length ?? 0) > 0 ||
          (engine.state.supplyCrates?.some((c) => !c.isLanded) ?? false);
        setGameState(engine.state, hasActiveDynamics);
      } else {
        const newState = unwrapGameState(payload);
        if (newState) {
          const isNewMatch = (newState.phase === 'PLACEMENT' && (prevPhaseRef.current === 'LOBBY' || prevPhaseRef.current === 'GAME_OVER')) ||
            prevMapKeyRef.current !== `${newState.config.mapSeed}_${newState.config.mapTheme}`;
          prevPhaseRef.current = newState.phase;

          const isAimingPhase =
            !isNewMatch &&
            (newState.phase === 'AIMING' || newState.phase === 'TURN_TIME' || newState.phase === 'RETREAT');
          const isMyActiveTurn = isAimingPhase && getIsLocalPlayerTurn(newState, myPeerId, false);
          const prevActiveSlug = isMyActiveTurn ? engine.state.slugs.find((s) => s.id === engine.state.activeSlugId) : null;
          const preservedAim = prevActiveSlug
            ? {
                aimAngle: prevActiveSlug.aimAngle,
                facing: prevActiveSlug.facing,
                selectedWeaponId: prevActiveSlug.selectedWeaponId,
                currentTargetPoint: prevActiveSlug.currentTargetPoint,
                fuseTimerSec: prevActiveSlug.fuseTimerSec,
              }
            : null;

          engine.state = newState;
          if (isNewMatch) {
            prevMapKeyRef.current = `${newState.config.mapSeed}_${newState.config.mapTheme}`;
            engine.initTerrain();
            knownGirderIdsRef.current.clear();
            knownCraterIdsRef.current.clear();
            knownBuildIdsRef.current.clear();
            knownProjIdsRef.current.clear();
            knownExplosionIdsRef.current.clear();
          }
          if (preservedAim) {
            const newActiveSlug = engine.state.slugs.find((s) => s.id === engine.state.activeSlugId);
            if (newActiveSlug) {
              newActiveSlug.aimAngle = preservedAim.aimAngle;
              newActiveSlug.facing = preservedAim.facing;
              newActiveSlug.selectedWeaponId = preservedAim.selectedWeaponId;
              newActiveSlug.currentTargetPoint = preservedAim.currentTargetPoint;
              newActiveSlug.fuseTimerSec = preservedAim.fuseTimerSec;
            }
          }

          if (newState.girders && newState.girders.length > 0) {
            for (const g of newState.girders) {
              if (!knownGirderIdsRef.current.has(g.id)) {
                knownGirderIdsRef.current.add(g.id);
                stampGirderToTerrain(engine.terrain, g);
              }
            }
          }

          if (newState.craters && newState.craters.length > 0) {
            for (const c of newState.craters) {
              if (!knownCraterIdsRef.current.has(c.id)) {
                knownCraterIdsRef.current.add(c.id);
                engine.terrain.carveExplosion(c.x, c.y, c.radius);
              }
            }
          }

          if (newState.terrainBuilds && newState.terrainBuilds.length > 0) {
            for (const b of newState.terrainBuilds) {
              if (!knownBuildIdsRef.current.has(b.id)) {
                knownBuildIdsRef.current.add(b.id);
                engine.terrain.buildTerrain(b.x, b.y, b.radius, 1);
              }
            }
          }

          if (newState.explosions && newState.explosions.length > 0) {
            for (const ex of newState.explosions) {
              engine.terrain.carveExplosion(ex.x, ex.y, ex.radius);
            }
          }

          setGameState(engine.state, true);
        }
      }
    };
  }, [isHost, peerManager, engineRef, setGameState, myPeerId]);
}

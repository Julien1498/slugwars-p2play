import { GameState, JournalEntry } from '../../types';
import { DestructibleTerrain } from '../../terrain';
import { isWorldAtRest } from '../turnManager';
import { isSlugGrounded } from '../../physics';
import { sfx } from '../../audio';
import {
  startAiming,
  startResolving,
  startProjectileActive,
} from './phaseTransitions';

export function updatePhaseTick(
  state: GameState,
  terrain: DestructibleTerrain,
  dt: number,
  callbacks: {
    addLog: (msg: string, type?: JournalEntry['type']) => void;
    advanceToNextTurn: () => void;
  }
): void {
  switch (state.phase) {
    case 'TURN_START': {
      if (state.phaseTimer !== undefined) {
        state.phaseTimer -= dt;
        if (state.phaseTimer <= 0) {
          startAiming(state);
        }
      }
      break;
    }

    case 'AIMING': {
      if (!state.isTimerFrozen) {
        state.turnTimer -= dt;
      }
      if (state.turnTimer <= 0) {
        state.turnTimer = 0;
        const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
        startResolving(state, {
          settleTimer: 1.0,
          phaseTimeout: 30.0,
          reason: `⏱️ Temps écoulé pour ${activeSlug?.name || 'la limace'} !`,
          addLog: callbacks.addLog,
        });
      }
      break;
    }

    case 'RETREAT': {
      if (state.retreatTimer !== undefined) {
        const prevSec = Math.ceil(state.retreatTimer);
        state.retreatTimer -= dt;
        const newSec = Math.ceil(state.retreatTimer);
        if (newSec < prevSec && newSec > 0) {
          sfx.play('tick');
        }
        if (state.retreatTimer <= 0) {
          state.retreatTimer = 0;
          const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
          if (activeSlug) {
            activeSlug.movingDir = null;
            activeSlug.vx = 0;
          }
          if (state.projectiles && state.projectiles.length > 0) {
            startProjectileActive(state);
          } else {
            startResolving(state, { settleTimer: 0.8, phaseTimeout: 30.0 });
          }
        }
      }
      break;
    }

    case 'PROJECTILE_ACTIVE': {
      if (!state.projectiles || state.projectiles.length === 0) {
        startResolving(state, { settleTimer: 1.0, phaseTimeout: 30.0 });
      }
      break;
    }

    case 'RESOLVING': {
      if (state.phaseTimer === undefined) {
        state.phaseTimer = 30.0;
        state.settleTimer = 1.0;
      } else {
        state.phaseTimer -= dt;
        if (state.settleTimer !== undefined) {
          state.settleTimer -= dt;
        }
      }

      const isMinTimeElapsed = (state.settleTimer ?? 0) <= 0;
      const atRest = isMinTimeElapsed && isWorldAtRest(state, terrain);

      // Standard exit: world is completely at rest and minimum settle delay elapsed
      if (atRest) {
        callbacks.advanceToNextTurn();
        break;
      }

      // Emergency timeout: only trigger if stuck for >30s AND no living slugs are moving or airborne
      if (state.phaseTimer <= 0) {
        const hasAirborneSlugs = state.slugs.some(
          (s) =>
            s.isAlive &&
            s.isPlaced !== false &&
            !s.inVehicleId &&
            (s.y < 0 ||
              Math.abs(s.vx) > 0.05 ||
              Math.abs(s.vy) > 0.05 ||
              !isSlugGrounded(s, terrain, state.slugs))
        );
        if (!hasAirborneSlugs) {
          state.projectiles = [];
          state.explosions = [];
          callbacks.advanceToNextTurn();
        }
      }
      break;
    }

    default:
      break;
  }
}

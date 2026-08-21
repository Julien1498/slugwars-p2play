import { GameState, JournalEntry, GamePhase } from '../types';
import { DestructibleTerrain } from '../terrain';
import { isWorldAtRest } from './turnManager';
import { isSlugGrounded } from '../physics';
import { sfx } from '../audio';

export class PhaseManager {
  /**
   * Internal helper called when exiting a phase to clean up temporary states
   */
  private static onExitPhase(state: GameState, oldPhase: GamePhase) {
    if (oldPhase === 'AIMING') {
      const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
      if (activeSlug) {
        activeSlug.movingDir = null;
        activeSlug.steeringDir = null;
        activeSlug.isChargingPower = false;
        activeSlug.isBlowtorching = false;
        activeSlug.currentTargetPoint = undefined;
      }
    }
  }

  /**
   * Transition to LOBBY
   */
  public static startLobby(state: GameState): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'LOBBY';
    state.turnTimer = 0;
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;
  }

  /**
   * Transition to PLACEMENT
   */
  public static startPlacement(state: GameState): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'PLACEMENT';
    if (state.teams.length > 1) {
      // Shuffle teams once at the start of the match (defines the fixed turn order for the entire game, exactly like Worms)
      for (let i = state.teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.teams[i], state.teams[j]] = [state.teams[j], state.teams[i]];
      }
    }
    state.activeTeamId = state.teams[0]?.id || '';
    const firstSlug = state.slugs.find((s) => s.teamId === state.activeTeamId && !s.isPlaced);
    state.activeSlugId = firstSlug ? firstSlug.id : (state.slugs[0]?.id || '');
    state.turnTimer = 30;
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;
  }

  /**
   * Transition to TURN_START (brief camera focus / intro before AIMING)
   */
  public static startTurnStart(state: GameState, durationSec = 0.8): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'TURN_START';
    state.phaseTimer = durationSec;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;
  }

  /**
   * Transition to AIMING (active player control)
   */
  public static startAiming(state: GameState, durationSec?: number): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'AIMING';
    state.turnTimer = durationSec !== undefined ? durationSec : (state.config.turnDuration || 45);
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;

    const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
    if (activeSlug && activeSlug.isAlive) {
      activeSlug.movingDir = null;
      activeSlug.steeringDir = null;
      activeSlug.isChargingPower = false;
      activeSlug.isBlowtorching = false;
      activeSlug.aimPower = 5;

      // Verify weapon ammo
      const team = state.teams.find((t) => t.id === activeSlug.teamId);
      if (team) {
        const ammo = team.inventory[activeSlug.selectedWeaponId] ?? -1;
        if (ammo === 0) {
          activeSlug.selectedWeaponId = 'bazooka';
        }
      }
    }
  }

  /**
   * Transition to RETREAT (timed flee window after placing delay weapons)
   */
  public static startRetreat(
    state: GameState,
    durationSec = 4.0,
    addLog?: (msg: string, type?: JournalEntry['type']) => void
  ): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'RETREAT';
    state.retreatTimer = durationSec;
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    addLog?.(`🏃 TEMPS DE FUITE (RETREAT) ! ${Math.round(durationSec)}s pour vous mettre à l'abri !`, 'info');
  }

  /**
   * Transition to PROJECTILE_ACTIVE (flying bullets/missiles/grenades)
   */
  public static startProjectileActive(state: GameState): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'PROJECTILE_ACTIVE';
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;
  }

  /**
   * Transition to RESOLVING (physics settling, damage resolution, craters)
   */
  public static startResolving(
    state: GameState,
    options: {
      settleTimer?: number;
      phaseTimeout?: number;
      reason?: string;
      addLog?: (msg: string, type?: JournalEntry['type']) => void;
    } = {}
  ): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'RESOLVING';
    state.settleTimer = options.settleTimer ?? 1.0;
    state.phaseTimer = options.phaseTimeout ?? 30.0;
    state.retreatTimer = undefined;

    // Disconnect active ropes
    for (const slug of state.slugs) {
      if (slug.ropeState) slug.ropeState = null;
    }

    if (options.reason && options.addLog) {
      options.addLog(options.reason, 'combat');
    }
  }

  /**
   * Transition to GAME_OVER
   */
  public static startGameOver(
    state: GameState,
    winnerTeamId?: string,
    addLog?: (msg: string, type?: JournalEntry['type']) => void
  ): void {
    this.onExitPhase(state, state.phase);
    state.phase = 'GAME_OVER';
    state.winnerTeamId = winnerTeamId;
    state.turnTimer = 0;
    state.phaseTimer = undefined;
    state.settleTimer = undefined;
    state.retreatTimer = undefined;

    if (winnerTeamId) {
      const winnerTeam = state.teams.find((t) => t.id === winnerTeamId);
      addLog?.(`Victoire de l'équipe ${winnerTeam?.name || winnerTeamId} ! 🎉`, 'info');
    } else {
      addLog?.('Match nul ! Toutes les équipes ont péri ! 💀', 'info');
    }
  }

  /**
   * Advance to the next alive team and slug, apply water rising, and transition to turn start
   */
  public static advanceToNextTurn(
    state: GameState,
    terrain: DestructibleTerrain,
    callbacks: {
      addLog: (msg: string, type?: JournalEntry['type']) => void;
      randomizeWind: (state: GameState) => void;
      getNextSlugForTeam: (teamId: string) => string;
      checkWinner: () => void;
    }
  ): void {
    // 1. Reset all slug input flags and power
    for (const slug of state.slugs) {
      slug.isChargingPower = false;
      slug.aimPower = 5;
      slug.movingDir = null;
      slug.steeringDir = null;
      slug.vx = 0;
      if (slug.hp <= 0) {
        slug.hp = 0;
        slug.isAlive = false;
      }
    }

    // 2. Check if a winner already emerged
    callbacks.checkWinner();
    if (state.phase === 'GAME_OVER') return;

    // 3. Find alive teams
    const aliveTeams = state.teams.filter((t) =>
      state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
    );
    if (aliveTeams.length <= 1) {
      callbacks.checkWinner();
      return;
    }

    // 4. Select next team and slug
    const currentIdx = aliveTeams.findIndex((t) => t.id === state.activeTeamId);
    const nextIdx = (currentIdx + 1) % aliveTeams.length;
    const isRoundCycleCompleted = nextIdx === 0;
    const nextTeam = aliveTeams[nextIdx];
    state.activeTeamId = nextTeam.id;

    const nextSlugId = callbacks.getNextSlugForTeam(nextTeam.id);
    if (!nextSlugId) {
      const fallbackSlug = state.slugs.find((s) => s.isAlive && s.hp > 0 && s.isPlaced);
      if (fallbackSlug) {
        state.activeTeamId = fallbackSlug.teamId;
        state.activeSlugId = fallbackSlug.id;
      } else {
        callbacks.checkWinner();
        return;
      }
    } else {
      state.activeSlugId = nextSlugId;
    }

    // 5. Handle Water Rising Mechanic
    const waterSpeed = state.config.waterRiseSpeed;
    const waterFreq = state.config.waterRiseFreq || 'EVERY_TURN';
    const shouldRise = waterSpeed && waterSpeed !== 'OFF' && (waterFreq === 'EVERY_TURN' || isRoundCycleCompleted);

    if (shouldRise) {
      let risePx = 0;
      if (waterFreq === 'EVERY_TURN') {
        const perTurnMap: Record<string, number> = { SLOW: 5, NORMAL: 12, FAST: 24 };
        risePx = perTurnMap[waterSpeed] || 12;
      } else {
        const perRoundMap: Record<string, number> = { SLOW: 16, NORMAL: 36, FAST: 68 };
        risePx = perRoundMap[waterSpeed] || 36;
      }

      const minWaterY = Math.max(120, Math.floor(terrain.data.height * 0.18));
      const currentWaterY = state.waterLevel ?? terrain.data.waterLevel;
      const newWaterY = Math.max(minWaterY, currentWaterY - risePx);

      if (newWaterY !== currentWaterY) {
        state.waterLevel = newWaterY;
        terrain.data.waterLevel = newWaterY;
        const roundPrefix = waterFreq === 'ROUND_CYCLE' ? '⏱️ Fin de cycle : ' : '';
        callbacks.addLog(`🌊 ${roundPrefix}Le niveau de l'eau monte (+${risePx} px) ! Attention à la submersion !`, 'combat');

        for (const s of state.slugs) {
          if (s.isAlive && s.y >= newWaterY) {
            s.hp = 0;
            s.isAlive = false;
            const victimTeam = state.teams.find((t) => t.id === s.teamId);
            if (victimTeam) {
              if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
              victimTeam.stats.deaths++;
            }
            callbacks.addLog(`🌊 ${s.name} a été englouti par les flots montants !`, 'death');
          }
        }
      }
    }

    // 6. Randomize wind & start aiming
    callbacks.randomizeWind(state);
    this.startAiming(state);
  }

  /**
   * Main per-tick update loop for phase timers and automatic state transitions
   */
  public static updatePhaseTick(
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
            this.startAiming(state);
          }
        }
        break;
      }

      case 'AIMING': {
        state.turnTimer -= dt;
        if (state.turnTimer <= 0) {
          state.turnTimer = 0;
          const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
          this.startResolving(state, {
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
              this.startProjectileActive(state);
            } else {
              this.startResolving(state, { settleTimer: 0.8, phaseTimeout: 30.0 });
            }
          }
        }
        break;
      }

      case 'PROJECTILE_ACTIVE': {
        if (!state.projectiles || state.projectiles.length === 0) {
          this.startResolving(state, { settleTimer: 1.0, phaseTimeout: 30.0 });
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
}

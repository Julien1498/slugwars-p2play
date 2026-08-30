import { GameState, JournalEntry, GamePhase } from '../../types';

export function onExitPhase(state: GameState, oldPhase: GamePhase): void {
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

export function startLobby(state: GameState): void {
  onExitPhase(state, state.phase);
  state.phase = 'LOBBY';
  state.turnTimer = 0;
  state.phaseTimer = undefined;
  state.settleTimer = undefined;
  state.retreatTimer = undefined;
}

export function startPlacement(state: GameState): void {
  onExitPhase(state, state.phase);
  state.phase = 'PLACEMENT';
  if (state.teams.length > 1) {
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

export function startTurnStart(state: GameState, durationSec = 0.8): void {
  onExitPhase(state, state.phase);
  state.phase = 'TURN_START';
  state.phaseTimer = durationSec;
  state.settleTimer = undefined;
  state.retreatTimer = undefined;
}

export function startAiming(state: GameState, durationSec?: number): void {
  onExitPhase(state, state.phase);
  state.phase = 'AIMING';
  state.turnTimer = durationSec !== undefined ? durationSec : (state.config.turnDuration || 45);
  state.phaseTimer = undefined;
  state.settleTimer = undefined;
  state.retreatTimer = undefined;
  if (!state.turnCount || state.turnCount < 1) {
    state.turnCount = 1;
  }

  const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
  if (activeSlug && activeSlug.isAlive) {
    activeSlug.movingDir = null;
    activeSlug.steeringDir = null;
    activeSlug.isChargingPower = false;
    activeSlug.isBlowtorching = false;
    activeSlug.aimPower = 5;

    // Verify weapon ammo for all slugs in the active team
    const team = state.teams.find((t) => t.id === activeSlug.teamId);
    if (team) {
      for (const s of state.slugs) {
        if (s.teamId === team.id) {
          const ammo = team.inventory[s.selectedWeaponId] ?? -1;
          if (ammo === 0) {
            s.selectedWeaponId = 'bazooka';
          }
        }
      }
    }
  }
}

export function startRetreat(
  state: GameState,
  durationSec = 4.0,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): void {
  onExitPhase(state, state.phase);
  state.phase = 'RETREAT';
  state.retreatTimer = durationSec;
  state.phaseTimer = undefined;
  state.settleTimer = undefined;
  addLog?.(`🏃 TEMPS DE FUITE (RETREAT) ! ${Math.round(durationSec)}s pour vous mettre à l'abri !`, 'info');
}

export function startProjectileActive(state: GameState): void {
  onExitPhase(state, state.phase);
  state.phase = 'PROJECTILE_ACTIVE';
  state.phaseTimer = undefined;
  state.settleTimer = undefined;
  state.retreatTimer = undefined;
}

export function startResolving(
  state: GameState,
  options: {
    settleTimer?: number;
    phaseTimeout?: number;
    reason?: string;
    addLog?: (msg: string, type?: JournalEntry['type']) => void;
  } = {}
): void {
  onExitPhase(state, state.phase);
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

export function startGameOver(
  state: GameState,
  winnerTeamId?: string,
  addLog?: (msg: string, type?: JournalEntry['type']) => void
): void {
  onExitPhase(state, state.phase);
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

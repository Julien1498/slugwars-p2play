import { GameState, TeamId, SlugId, JournalEntry } from './types';

export class TurnManager {
  public static initTurnState(state: GameState): void {
    state.phase = 'PLACEMENT';
    state.activeTeamId = state.teams[0].id;
    const firstSlug = state.slugs.find((s) => s.teamId === state.activeTeamId && !s.isPlaced);
    state.activeSlugId = firstSlug ? firstSlug.id : state.slugs[0].id;
    state.turnTimer = 30;
  }

  public static randomizeWind(state: GameState): void {
    if (state.config.windEnabled) {
      state.wind = Math.floor(Math.random() * 11) - 5;
    } else {
      state.wind = 0;
    }
  }

  public static getNextSlugForTeam(state: GameState, teamId: TeamId): SlugId | null {
    const teamSlugs = state.slugs.filter((s) => s.teamId === teamId && s.isAlive && s.isPlaced);
    if (teamSlugs.length === 0) return null;
    const currentActiveIdx = teamSlugs.findIndex((s) => s.id === state.activeSlugId);
    return teamSlugs[(currentActiveIdx + 1) % teamSlugs.length].id;
  }

  public static checkWinner(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): void {
    const aliveTeams = state.teams.filter((t) =>
      state.slugs.some((s) => s.teamId === t.id && s.isAlive)
    );
    if (aliveTeams.length === 1) {
      state.phase = 'GAME_OVER';
      state.winnerTeamId = aliveTeams[0].id;
      addLog(`Victoire de l'équipe ${aliveTeams[0].name} ! 🎉`, 'info');
    } else if (aliveTeams.length === 0) {
      state.phase = 'GAME_OVER';
      addLog(`Égalité parfaite ! Toutes les limaces sont éliminées.`, 'info');
    }
  }

  public static endTurn(state: GameState, addLog: (msg: string, type?: JournalEntry['type']) => void): void {
    const activeSlug = state.slugs.find((s) => s.id === state.activeSlugId);
    if (activeSlug) {
      activeSlug.movingDir = null;
      activeSlug.steeringDir = null;
      activeSlug.isChargingPower = false;
      activeSlug.isBlowtorching = false;
      activeSlug.currentTargetPoint = undefined;
    }

    if (state.phase !== 'RESOLVE' && state.phase !== 'CASUALTIES' && state.phase !== 'INTERTURN') {
      state.phase = 'RESOLVE';
      state.phaseTimer = 1.0;
      return;
    }

    for (const slug of state.slugs) {
      if (slug.hp <= 0) {
        slug.hp = 0;
        slug.isAlive = false;
      }
    }

    this.checkWinner(state, addLog);
    if ((state.phase as string) === 'GAME_OVER') return;

    const aliveTeams = state.teams.filter((t) =>
      state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
    );
    if (aliveTeams.length <= 1) {
      this.checkWinner(state, addLog);
      return;
    }

    const currentIdx = aliveTeams.findIndex((t) => t.id === state.activeTeamId);
    const nextTeam = aliveTeams[(currentIdx + 1) % aliveTeams.length];
    state.activeTeamId = nextTeam.id;

    const nextSlugId = this.getNextSlugForTeam(state, nextTeam.id);
    if (!nextSlugId) {
      const fallbackSlug = state.slugs.find((s) => s.isAlive && s.hp > 0 && s.isPlaced);
      if (fallbackSlug) {
        state.activeTeamId = fallbackSlug.teamId;
        state.activeSlugId = fallbackSlug.id;
      } else {
        this.checkWinner(state, addLog);
        return;
      }
    } else {
      state.activeSlugId = nextSlugId;
    }

    state.turnTimer = state.config.turnDuration;
    state.phase = 'TURN_START';
    state.phaseTimer = 1.5;
    this.randomizeWind(state);
  }
}

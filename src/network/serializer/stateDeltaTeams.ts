import { GameState } from '../../core/types';
import { CompactStateDelta, CompactTeamDelta } from './netSerializerTypes';

/**
 * Builds compact team deltas and detects metadata changes (such as cosmetics/hat, avatar, color).
 */
export function buildTeamDeltas(
  prevState: GameState | null,
  currentState: GameState,
  delta: CompactStateDelta
): void {
  // Team meta (hat, avatar, color) or team count delta
  const teamMetaChanged = currentState.teams.some((t) => {
    const p = prevState?.teams.find((pt) => pt.id === t.id);
    return !p || p.hat !== t.hat || p.avatar !== t.avatar || p.color !== t.color;
  });

  if (currentState.teams.length !== (prevState?.teams.length ?? 0) || teamMetaChanged) {
    delta.fullTeams = currentState.teams;
  }

  const teamDeltas: CompactTeamDelta[] = [];
  for (const team of currentState.teams) {
    const prevTeam = prevState?.teams.find((t) => t.id === team.id);
    const hasStatsChanged =
      !prevTeam ||
      prevTeam.stats?.kills !== team.stats?.kills ||
      prevTeam.stats?.deaths !== team.stats?.deaths ||
      prevTeam.stats?.damageDealt !== team.stats?.damageDealt ||
      prevTeam.stats?.damageTaken !== team.stats?.damageTaken;

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

  if (teamDeltas.length > 0) {
    delta.teams = teamDeltas;
  }
}

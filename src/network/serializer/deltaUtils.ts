import { CompactStateDelta } from './netSerializerTypes';

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
    (!delta.fullTeams || delta.fullTeams.length === 0) &&
    (!delta.slugs || delta.slugs.length === 0) &&
    (!delta.fullSlugs || delta.fullSlugs.length === 0) &&
    (!delta.projectiles || delta.projectiles.length === 0) &&
    (!delta.explosions || delta.explosions.length === 0) &&
    (!delta.girders || delta.girders.length === 0) &&
    (!delta.craters || delta.craters.length === 0) &&
    (!delta.terrainBuilds || delta.terrainBuilds.length === 0) &&
    (!delta.supplyCrates || delta.supplyCrates.length === 0) &&
    (!delta.mines || delta.mines.length === 0) &&
    (!delta.helicopters || delta.helicopters.length === 0) &&
    (!delta.journal || delta.journal.length === 0) &&
    (!delta.floatingDamages || delta.floatingDamages.length === 0) &&
    (!delta.solidProps || delta.solidProps.length === 0) &&
    delta.isTimerFrozen === undefined &&
    delta.godModeEnabled === undefined &&
    delta.isDevHost === undefined
  );
}

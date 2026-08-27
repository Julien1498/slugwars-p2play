import { GameState, GamePhase } from '../../../core/types';

export interface TurnHeaderProps {
  gameState: GameState;
  hostPeerId: string;
  isMyTurn: boolean;
  isHost?: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenWeaponPicker: () => void;
  onSetFuseTimer?: (seconds: number) => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
}

export function computeTeamStats(gameState: GameState) {
  return gameState.teams.map((team) => {
    const teamSlugs = gameState.slugs.filter((s) => s.teamId === team.id);
    const aliveSlugs = teamSlugs.filter((s) => s.isAlive).length;
    const totalHp = teamSlugs.reduce((acc, s) => acc + (s.isAlive ? s.hp : 0), 0);
    const maxHp = gameState.config.slugsPerTeam * gameState.config.slugHp;
    const hpPercent = Math.max(0, Math.min(1, totalHp / (maxHp || 1)));
    const isActive = team.id === gameState.activeTeamId;
    return { team, totalHp, hpPercent, isActive, aliveSlugs, totalSlugs: teamSlugs.length };
  });
}

export function isTurnTimeUrgent(turnTimer: number, phase: GamePhase): boolean {
  const turnTime = Math.max(0, Math.ceil(turnTimer));
  return turnTime <= 5 && phase === 'AIMING';
}

export function getWaterRiseBadgeText(waterRiseSpeed?: string, waterRiseFreq?: string): string | null {
  if (!waterRiseSpeed || waterRiseSpeed === 'OFF') return null;
  if (waterRiseFreq === 'ROUND_CYCLE') {
    return waterRiseSpeed === 'SLOW' ? '+16px' : waterRiseSpeed === 'NORMAL' ? '+36px' : '+68px';
  }
  return waterRiseSpeed === 'SLOW' ? '+5px' : waterRiseSpeed === 'NORMAL' ? '+12px' : '+24px';
}

export function turnHeaderPropsAreEqual(
  prev: Readonly<TurnHeaderProps>,
  next: Readonly<TurnHeaderProps>
): boolean {
  if (prev.isMyTurn !== next.isMyTurn) return false;
  if (prev.isHost !== next.isHost) return false;
  if (prev.hostPeerId !== next.hostPeerId) return false;
  if (prev.showHitboxes !== next.showHitboxes) return false;

  const pState = prev.gameState;
  const nState = next.gameState;
  if (pState === nState) return true;

  if (pState.phase !== nState.phase) return false;
  if (Math.ceil(pState.turnTimer) !== Math.ceil(nState.turnTimer)) return false;
  if (Math.ceil(pState.retreatTimer ?? 0) !== Math.ceil(nState.retreatTimer ?? 0)) return false;
  if (pState.activeTeamId !== nState.activeTeamId) return false;
  if (pState.activeSlugId !== nState.activeSlugId) return false;
  if (pState.wind !== nState.wind) return false;
  if (pState.teams !== nState.teams && pState.teams.length !== nState.teams.length) return false;

  const pActiveSlug = pState.slugs.find((s) => s.id === pState.activeSlugId);
  const nActiveSlug = nState.slugs.find((s) => s.id === nState.activeSlugId);
  if (pActiveSlug?.selectedWeaponId !== nActiveSlug?.selectedWeaponId) return false;
  if (pActiveSlug?.name !== nActiveSlug?.name) return false;
  if (pActiveSlug?.fuseTimerSec !== nActiveSlug?.fuseTimerSec) return false;

  if (pState.slugs !== nState.slugs) {
    if (pState.slugs.length !== nState.slugs.length) return false;
    for (let i = 0; i < pState.slugs.length; i++) {
      const ps = pState.slugs[i];
      const ns = nState.slugs[i];
      if (ps.hp !== ns.hp || ps.isAlive !== ns.isAlive || ps.teamId !== ns.teamId) {
        return false;
      }
    }
  }

  return true;
}

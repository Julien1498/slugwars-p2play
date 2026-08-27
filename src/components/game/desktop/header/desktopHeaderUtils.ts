import { GameState, GamePhase } from '../../../../core/types';

export interface DesktopTopHeaderProps {
  gameState: GameState;
  hostPeerId?: string;
  isMyTurn: boolean;
  isHost: boolean;
  showHitboxes?: boolean;
  onToggleHitboxes?: () => void;
  onOpenRules: () => void;
  onOpenMetrics?: () => void;
  onRestartGame?: () => void;
  onExit?: () => void;
}

export function computeDesktopTeamStats(gameState: GameState) {
  return gameState.teams.map((t) => {
    const teamSlugs = gameState.slugs.filter((s) => s.teamId === t.id);
    const aliveSlugs = teamSlugs.filter((s) => s.isAlive && s.hp > 0);
    const totalHp = aliveSlugs.reduce((sum, s) => sum + s.hp, 0);
    const maxHp = (gameState.config.slugsPerTeam || 2) * (gameState.config.slugHp || 100);
    const hpPercent = Math.max(0, Math.min(1, totalHp / Math.max(1, maxHp)));
    return {
      team: t,
      totalHp,
      maxHp,
      hpPercent,
      aliveSlugs: aliveSlugs.length,
      totalSlugs: teamSlugs.length,
      isActive: t.id === gameState.activeTeamId,
    };
  });
}

export function isDesktopTurnTimeUrgent(turnTimer: number | undefined, phase: GamePhase): boolean {
  const turnTime = Math.max(0, Math.ceil(turnTimer ?? 0));
  return turnTime <= 10 && turnTime > 0 && phase === 'AIMING';
}

export function getSlugHpColor(hpPercent: number): string {
  return hpPercent > 0.5 ? '#10b981' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444';
}

export function desktopTopHeaderPropsAreEqual(
  prev: Readonly<DesktopTopHeaderProps>,
  next: Readonly<DesktopTopHeaderProps>
): boolean {
  if (prev.isMyTurn !== next.isMyTurn) return false;
  if (prev.isHost !== next.isHost) return false;
  if (prev.hostPeerId !== next.hostPeerId) return false;
  if (prev.showHitboxes !== next.showHitboxes) return false;

  const pState = prev.gameState;
  const nState = next.gameState;
  if (pState === nState) return true;

  if (pState.phase !== nState.phase) return false;
  if (Math.ceil(pState.turnTimer ?? 0) !== Math.ceil(nState.turnTimer ?? 0)) return false;
  if (Math.ceil(pState.retreatTimer ?? 0) !== Math.ceil(nState.retreatTimer ?? 0)) return false;
  if (pState.activeTeamId !== nState.activeTeamId) return false;
  if (pState.activeSlugId !== nState.activeSlugId) return false;
  if (pState.wind !== nState.wind) return false;

  if (pState.teams.length !== nState.teams.length) return false;
  for (let i = 0; i < pState.teams.length; i++) {
    if (
      pState.teams[i].id !== nState.teams[i].id ||
      pState.teams[i].name !== nState.teams[i].name ||
      pState.teams[i].color !== nState.teams[i].color
    ) {
      return false;
    }
  }

  const pActiveSlug = pState.slugs.find((s) => s.id === pState.activeSlugId);
  const nActiveSlug = nState.slugs.find((s) => s.id === nState.activeSlugId);
  if (pActiveSlug?.selectedWeaponId !== nActiveSlug?.selectedWeaponId) return false;
  if (pActiveSlug?.name !== nActiveSlug?.name) return false;
  if (pActiveSlug?.hp !== nActiveSlug?.hp) return false;

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

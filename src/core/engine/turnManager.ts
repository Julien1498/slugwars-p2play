import { GameState, Slug, Vector2D, JournalEntry } from '../types';
import { DestructibleTerrain } from '../terrain';
import { isSlugGrounded } from '../physics';

export function getNextSlugForTeam(
  state: GameState,
  teamId: string,
  teamLastPlayedSlugId: Record<string, string>
): string {
  const allSlugs = state.slugs.filter((s) => s.teamId === teamId);
  if (allSlugs.length === 0) return '';

  const lastId = teamLastPlayedSlugId[teamId];
  const lastIdx = lastId ? allSlugs.findIndex((s) => s.id === lastId) : -1;

  for (let step = 1; step <= allSlugs.length; step++) {
    const candidateIdx = (lastIdx + step) % allSlugs.length;
    const candidate = allSlugs[candidateIdx];
    if (candidate && candidate.isAlive && candidate.hp > 0 && candidate.isPlaced) {
      teamLastPlayedSlugId[teamId] = candidate.id;
      return candidate.id;
    }
  }

  return '';
}

export function randomizeWind(state: GameState) {
  if (state.config.windEnabled) {
    state.wind = Math.floor(Math.random() * 11) - 5;
  } else {
    state.wind = 0;
  }
}

export function findSafePlacementPoint(
  terrain: DestructibleTerrain,
  targetX: number,
  targetY: number,
  existingSlugs: Slug[] = []
): Vector2D {
  const width = terrain.data.width;
  const waterLevel = terrain.data.waterLevel;
  const safeX = Math.max(20, Math.min(width - 20, Math.round(targetX)));
  const safeY = Math.max(25, Math.min(waterLevel - 15, Math.round(targetY)));

  // Helper: test if (x, y) has full open air for slug body & head (no ceiling rock clipping!)
  const hasClearAir = (x: number, y: number): boolean => {
    if (x < 15 || x > width - 15 || y < 20 || y >= waterLevel - 5) return false;
    for (let check = 0; check <= 18; check++) {
      if (
        terrain.isSolid(x, y - check) ||
        terrain.isSolid(x - 4, y - check) ||
        terrain.isSolid(x + 4, y - check)
      ) {
        return false;
      }
    }
    return true;
  };

  // 1. If clicked point ALREADY has clear open air (player can place in the air anywhere, slug falls down!):
  if (hasClearAir(safeX, safeY)) {
    const overlapSlug = existingSlugs.find(
      (s) => s.isAlive && s.isPlaced && Math.hypot(s.x - safeX, s.y - safeY) < 16
    );
    if (overlapSlug) {
      const offset = safeX >= overlapSlug.x ? 20 : -20;
      const testX = Math.max(20, Math.min(width - 20, safeX + offset));
      if (hasClearAir(testX, safeY)) {
        return { x: testX, y: safeY };
      }
    }
    return { x: safeX, y: safeY };
  }

  // 2. If clicked near ceiling or inside solid rock, scan downward to find the first open air spot with headroom
  for (let testY = safeY; testY < waterLevel - 15; testY += 2) {
    if (hasClearAir(safeX, testY)) {
      return { x: safeX, y: testY };
    }
  }

  // 3. Fallback: Search NEAREST open air pixel with clear headroom (nearest to user click, not top-left corner!)
  let bestPoint: Vector2D | null = null;
  let minDistSq = Infinity;

  for (let testY = 25; testY < waterLevel - 15; testY += 6) {
    for (let testX = 25; testX < width - 25; testX += 6) {
      if (hasClearAir(testX, testY)) {
        const distSq = (testX - safeX) ** 2 + (testY - safeY) ** 2;
        if (distSq < minDistSq) {
          minDistSq = distSq;
          bestPoint = { x: testX, y: testY };
        }
      }
    }
  }

  return bestPoint || terrain.data.spawnPoints[0] || { x: 500, y: 150 };
}

export function findSafeTeleportPoint(
  terrain: DestructibleTerrain,
  targetX: number,
  targetY: number,
  existingSlugs: Slug[] = []
): Vector2D {
  return findSafePlacementPoint(terrain, targetX, targetY, existingSlugs);
}

export function isWorldAtRest(state: GameState, terrain: DestructibleTerrain): boolean {
  // 1. Any active flying projectiles?
  if (state.projectiles && state.projectiles.length > 0) return false;

  // 2. Any active explosions or moving helicopters?
  if (state.explosions && state.explosions.length > 0) return false;
  if (state.helicopters && state.helicopters.some((h) => Math.hypot(h.vx, h.vy) > 0.15)) return false;

  // 3. Any floating damage numbers still displaying?
  if (state.floatingDamages && state.floatingDamages.length > 0) return false;

  // 4. Any triggered mines counting down?
  if (
    state.mines &&
    state.mines.some((m) => m.isTriggered && m.fuseTimerMs !== undefined && m.fuseTimerMs > 0)
  ) {
    return false;
  }

  // 5. Any unlanded supply crates falling?
  if (state.supplyCrates && state.supplyCrates.some((c) => !c.isLanded)) return false;

  // 6. Any slugs flying / bouncing / sliding / falling / roping in the air / off-map?
  for (const slug of state.slugs) {
    if (!slug.isAlive || slug.isPlaced === false || slug.inVehicleId) continue;
    if (slug.ropeState) return false;
    // Slugs projected above map ceiling are in high-altitude flight and not at rest
    if (slug.y < 0) return false;
    // Check velocity threshold: any velocity > 0.05 px/tick means slug is still moving
    if (Math.abs(slug.vx) > 0.05 || Math.abs(slug.vy) > 0.05) return false;
    // Check if grounded on solid terrain or on another slug
    if (!isSlugGrounded(slug, terrain, state.slugs)) return false;
  }

  return true;
}

export function checkWinner(
  state: GameState,
  addLog?: (msg: string, type: JournalEntry['type']) => void
): void {
  // VIP Hunt Rule: If a team's VIP is dead, all remaining squad members are eliminated
  if (state.config?.gameMode === 'VIP_HUNT') {
    for (const team of state.teams) {
      const vipSlug = state.slugs.find((s) => s.teamId === team.id && s.isVip);
      if (vipSlug && (!vipSlug.isAlive || vipSlug.hp <= 0)) {
        let wipedAny = false;
        for (const s of state.slugs) {
          if (s.teamId === team.id && s.isAlive) {
            s.hp = 0;
            s.isAlive = false;
            wipedAny = true;
          }
        }
        if (wipedAny) {
          addLog?.(`💀 Le Général ${vipSlug.name} a péri ! L'escouade ${team.name} est anéantie !`, 'death');
        }
      }
    }
  }

  const aliveTeams = state.teams.filter((t) =>
    state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
  );

  if (aliveTeams.length === 1) {
    state.phase = 'GAME_OVER';
    state.winnerTeamId = aliveTeams[0].id;
    addLog?.(`Victoire de l'équipe ${aliveTeams[0].name} ! 🎉`, 'info');
  } else if (aliveTeams.length === 0) {
    state.phase = 'GAME_OVER';
    addLog?.('Égalité parfaite ! Toutes les limaces sont éliminées.', 'info');
  }
}

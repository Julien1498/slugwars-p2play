import { GameState, Vector2D, Slug, SupplyCrate } from '../core/types';

/**
 * Shortest-arc angle linear interpolation that correctly wraps around -PI and +PI.
 */
export function shortestArcAngleLerp(currentAngle: number, targetAngle: number, alpha: number): number {
  if (!Number.isFinite(targetAngle) || !Number.isFinite(currentAngle)) return currentAngle;
  let angleDiff = targetAngle - currentAngle;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  return currentAngle + angleDiff * alpha;
}

/**
 * Smooth position interpolation with snap-distance threshold.
 */
export function interpolatePosition(
  current: Vector2D,
  target: Vector2D,
  alpha: number,
  maxSnapDist: number = 64
): Vector2D {
  const dist = Math.hypot(target.x - current.x, target.y - current.y);
  if (dist > maxSnapDist) {
    return { x: target.x, y: target.y };
  }
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
  };
}

export interface InterpolationCache {
  visualSlugPositions: Map<string, { x: number; y: number }>;
  visualCratePositions: Map<string, { x: number; y: number }>;
  visualProjectilePositions: Map<string, { x: number; y: number; angle: number }>;
  renderedSlugsCache: Slug[];
  renderedCratesCache: SupplyCrate[];
  renderedProjectilesCache: any[];
}

export function createInterpolationCache(): InterpolationCache {
  return {
    visualSlugPositions: new Map(),
    visualCratePositions: new Map(),
    visualProjectilePositions: new Map(),
    renderedSlugsCache: [],
    renderedCratesCache: [],
    renderedProjectilesCache: [],
  };
}

/**
 * Frame-rate independent visual interpolation for buttery smooth 60/144/240 FPS rendering
 * (Zero GC allocations per frame, with shortest-arc angle smoothing and dead entity pruning).
 */
export function interpolateVisualState(
  curState: GameState,
  cache: InterpolationCache,
  alpha: number
): GameState {
  // 1. Interpolate Slugs
  const renderedSlugs = cache.renderedSlugsCache;
  renderedSlugs.length = curState.slugs.length;
  for (let i = 0; i < curState.slugs.length; i++) {
    const slug = curState.slugs[i];
    let visualPos = cache.visualSlugPositions.get(slug.id);
    if (!visualPos) {
      visualPos = { x: slug.x, y: slug.y };
      cache.visualSlugPositions.set(slug.id, visualPos);
    } else {
      const next = interpolatePosition(visualPos, { x: slug.x, y: slug.y }, alpha, 64);
      visualPos.x = next.x;
      visualPos.y = next.y;
    }
    renderedSlugs[i] = {
      ...slug,
      x: visualPos.x,
      y: visualPos.y,
    };
  }

  // 2. Interpolate Supply Crates
  const renderedCrates = cache.renderedCratesCache;
  const rawCrates = curState.supplyCrates || [];
  renderedCrates.length = rawCrates.length;
  for (let i = 0; i < rawCrates.length; i++) {
    const crate = rawCrates[i];
    let visualPos = cache.visualCratePositions.get(crate.id);
    if (!visualPos) {
      visualPos = { x: crate.x, y: crate.y };
      cache.visualCratePositions.set(crate.id, visualPos);
    } else {
      const next = interpolatePosition(visualPos, { x: crate.x, y: crate.y }, alpha, 64);
      visualPos.x = next.x;
      visualPos.y = next.y;
    }
    renderedCrates[i] = {
      ...crate,
      x: visualPos.x,
      y: visualPos.y,
    };
  }

  // 3. Interpolate Projectiles (Position + Shortest Arc Angle)
  const rawProjectiles = curState.projectiles || [];
  const renderedProjectiles = cache.renderedProjectilesCache;
  renderedProjectiles.length = rawProjectiles.length;
  const currentProjIds = new Set<string>();

  for (let i = 0; i < rawProjectiles.length; i++) {
    const proj = rawProjectiles[i];
    currentProjIds.add(proj.id);
    let visualPos = cache.visualProjectilePositions.get(proj.id);
    const targetAngle = Math.atan2(proj.vy, proj.vx);

    if (!visualPos) {
      visualPos = { x: proj.x, y: proj.y, angle: Number.isFinite(targetAngle) ? targetAngle : 0 };
      cache.visualProjectilePositions.set(proj.id, visualPos);
    } else {
      const nextPos = interpolatePosition(visualPos, { x: proj.x, y: proj.y }, alpha, 90);
      visualPos.x = nextPos.x;
      visualPos.y = nextPos.y;

      if (Number.isFinite(targetAngle)) {
        visualPos.angle = shortestArcAngleLerp(visualPos.angle, targetAngle, alpha);
      }
    }

    renderedProjectiles[i] = {
      ...proj,
      x: visualPos.x,
      y: visualPos.y,
      interpolatedAngle: visualPos.angle,
    };
  }

  // 4. Memory Cleanup for dead projectiles
  for (const id of cache.visualProjectilePositions.keys()) {
    if (!currentProjIds.has(id)) {
      cache.visualProjectilePositions.delete(id);
    }
  }

  return {
    ...curState,
    slugs: renderedSlugs,
    supplyCrates: renderedCrates,
    projectiles: renderedProjectiles,
  };
}

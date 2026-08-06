import { Slug, ActiveProjectile, Vector2D } from './types';
import { DestructibleTerrain } from './terrain';

export const GRAVITY = 0.35;
export const FRICTION = 0.96;

export function updateProjectilePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  wind: number
): { exploded: boolean; collisionPoint?: Vector2D } {
  if (proj.windAffected) {
    proj.vx += wind * 0.02;
  }
  proj.vy += GRAVITY;

  const nextX = proj.x + proj.vx;
  const nextY = proj.y + proj.vy;

  const ray = terrain.raycastSolid(proj.x, proj.y, nextX, nextY);

  if (ray.hit) {
    if (proj.bounces) {
      proj.x = ray.x;
      proj.y = ray.y;
      proj.vx *= -0.6;
      proj.vy *= -0.6;
      return { exploded: false };
    } else {
      return { exploded: true, collisionPoint: { x: ray.x, y: ray.y } };
    }
  }

  proj.x = nextX;
  proj.y = nextY;

  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
  }

  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 16;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  return { exploded: false };
}

export function applyExplosionToSlugs(
  exX: number,
  exY: number,
  radius: number,
  maxDamage: number,
  slugs: Slug[],
  terrain: DestructibleTerrain
): { hitCount: number; killedCount: number } {
  let hitCount = 0;
  let killedCount = 0;

  for (const slug of slugs) {
    if (!slug.isAlive) continue;

    const dx = slug.x - exX;
    const dy = slug.y - exY;
    const dist = Math.hypot(dx, dy);

    if (dist <= radius + 15) {
      hitCount++;
      const falloff = 1 - Math.min(1, dist / (radius + 15));
      const damage = Math.round(maxDamage * falloff);

      slug.hp = Math.max(0, slug.hp - damage);
      if (slug.hp === 0) {
        slug.isAlive = false;
        killedCount++;
      }

      const angle = Math.atan2(dy, dx);
      const force = (radius / (dist + 5)) * 14;
      slug.vx += Math.cos(angle) * force;
      slug.vy += Math.sin(angle) * force - 2;
    }
  }

  return { hitCount, killedCount };
}

export function updateSlugPhysics(slug: Slug, terrain: DestructibleTerrain): void {
  if (!slug.isAlive) return;

  slug.vy += GRAVITY;
  slug.vx *= FRICTION;

  const nextX = slug.x + slug.vx;
  const nextY = slug.y + slug.vy;

  if (terrain.isSolid(nextX, nextY + 12)) {
    slug.vy = 0;
    slug.vx *= 0.7;
  } else {
    slug.y = nextY;
  }

  if (!terrain.isSolid(nextX, slug.y)) {
    slug.x = nextX;
  } else {
    slug.vx = 0;
  }

  if (slug.y >= terrain.data.waterLevel) {
    slug.hp = 0;
    slug.isAlive = false;
  }
}

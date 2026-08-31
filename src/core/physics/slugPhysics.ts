import { Slug } from '../types';
import { DestructibleTerrain } from '../terrain';

export const GRAVITY = 0.4;
export const FRICTION = 0.85;

export function isSlugGrounded(slug: Slug, terrain: DestructibleTerrain, slugs: Slug[] = []): boolean {
  // A slug moving upwards is airborne and cannot be grounded
  if (slug.vy < -0.1) return false;

  const feetY1 = Math.floor(slug.y + 1);
  const feetY2 = Math.floor(slug.y + 2);
  const leftX = Math.floor(slug.x - 4);
  const centerX = Math.floor(slug.x);
  const rightX = Math.floor(slug.x + 4);

  if (
    terrain.isSolid(centerX, feetY1) ||
    terrain.isSolid(leftX, feetY1) ||
    terrain.isSolid(rightX, feetY1) ||
    terrain.isSolid(centerX, feetY2) ||
    terrain.isSolid(leftX, feetY2) ||
    terrain.isSolid(rightX, feetY2)
  ) {
    return true;
  }

  for (const other of slugs) {
    if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
    if (Math.abs(slug.x - other.x) < 14 && Math.abs(slug.y - (other.y - 16)) <= 3) {
      return true;
    }
  }

  return false;
}

export function updateSlugPhysics(
  slug: Slug,
  terrain: DestructibleTerrain,
  slugs: Slug[] = []
): { fallDamage?: number } {
  if (slug.hp <= 0) {
    slug.hp = 0;
    slug.isAlive = false;
  }
  if (!slug.isAlive || slug.isPlaced === false) return {};
  if (slug.ropeState || slug.inVehicleId) {
    slug.fallStartY = undefined;
    return {};
  }

  const result: { fallDamage?: number } = {};

  const grounded = isSlugGrounded(slug, terrain, slugs);
  if (!grounded) {
    if (slug.fallStartY === undefined) {
      slug.fallStartY = slug.y;
    }
  } else if (slug.fallStartY !== undefined) {
    const fallDist = slug.y - slug.fallStartY;
    if (fallDist > 90) {
      const fallDamage = Math.min(65, Math.round((fallDist - 90) * 0.35));
      if (fallDamage > 0 && !slug.isGodMode) {
        slug.hp = Math.max(0, slug.hp - fallDamage);
        if (slug.hp === 0) {
          slug.isAlive = false;
        }
        result.fallDamage = fallDamage;
      }
    }
    slug.fallStartY = undefined;
  }

  slug.vy += GRAVITY;
  slug.vx *= FRICTION;

  const totalSpeed = Math.hypot(slug.vx, slug.vy);
  const maxStepSize = 2.0;
  const subSteps = Math.max(1, Math.min(16, Math.ceil(totalSpeed / maxStepSize)));

  const stepVx = slug.vx / subSteps;
  let stepVy = slug.vy / subSteps;

  for (let s = 0; s < subSteps; s++) {
    // 1. Vertical Sub-step
    if (Math.abs(stepVy) > 0.001) {
      if (stepVy > 0) {
        let landedOnSlug = false;
        for (const other of slugs) {
          if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
          const dx = Math.abs(slug.x - other.x);
          if (dx < 14 && slug.y <= other.y - 14 && slug.y + stepVy >= other.y - 16) {
            slug.y = other.y - 16;
            slug.vy = 0;
            stepVy = 0;
            landedOnSlug = true;
            break;
          }
        }

        if (!landedOnSlug) {
          const feetY = Math.floor(slug.y + stepVy + 1);
          if (
            terrain.isSolid(Math.floor(slug.x), feetY) ||
            terrain.isSolid(Math.floor(slug.x - 4), feetY) ||
            terrain.isSolid(Math.floor(slug.x + 4), feetY)
          ) {
            slug.vy = 0;
            stepVy = 0;
            let snapY = Math.floor(slug.y);
            for (let dy = 0; dy <= 6; dy++) {
              if (
                terrain.isSolid(Math.floor(slug.x), snapY + dy + 1) ||
                terrain.isSolid(Math.floor(slug.x - 4), snapY + dy + 1) ||
                terrain.isSolid(Math.floor(slug.x + 4), snapY + dy + 1)
              ) {
                slug.y = snapY + dy;
                break;
              }
            }
          } else {
            slug.y += stepVy;
          }
        }
      } else {
        let hitSlugCeiling = false;
        for (const other of slugs) {
          if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
          const dx = Math.abs(slug.x - other.x);
          if (dx < 14 && slug.y >= other.y && slug.y + stepVy <= other.y + 4) {
            slug.vy = 0;
            stepVy = 0;
            hitSlugCeiling = true;
            break;
          }
        }

        if (!hitSlugCeiling) {
          const headY = Math.floor(slug.y + stepVy - 16);
          if (terrain.isSolid(Math.floor(slug.x), headY)) {
            slug.vy = 0;
            stepVy = 0;
          } else {
            slug.y += stepVy;
          }
        }
      }
    }

    // 2. Horizontal Sub-step
    if (Math.abs(stepVx) > 0.001) {
      const targetX = Math.max(10, Math.min(terrain.data.width - 10, slug.x + stepVx));

      let hitOtherSlug = false;
      for (const other of slugs) {
        if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
        const curDx = slug.x - other.x;
        const newDx = targetX - other.x;
        const dy = (slug.y - 8) - (other.y - 8);
        const curDist = Math.hypot(curDx, dy);
        const newDist = Math.hypot(newDx, dy);

        if (newDist < 14 && newDist < curDist) {
          hitOtherSlug = true;
          break;
        }
      }

      if (hitOtherSlug) {
        slug.vx = 0;
        break;
      } else {
        let stepped = false;
        const stepCandidates = [0, -1, -2, -3, -4, -5, -6, 1, 2, 3, 4, 5];
        for (const step of stepCandidates) {
          const checkY = Math.floor(slug.y + step);
          if (
            !terrain.isSolid(Math.floor(targetX), checkY) &&
            !terrain.isSolid(Math.floor(targetX), checkY - 8) &&
            !terrain.isSolid(Math.floor(targetX), checkY - 14)
          ) {
            if (step > 0 && !terrain.isSolid(Math.floor(targetX), checkY + 1)) {
              continue;
            }
            slug.x = targetX;
            slug.y = checkY;
            stepped = true;
            break;
          }
        }

        if (!stepped) {
          slug.vx = 0;
          break;
        }
      }
    }
  }

  // 3. Soft Slug Repulsion
  for (const other of slugs) {
    if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
    const dx = slug.x - other.x;
    const dy = (slug.y - 8) - (other.y - 8);
    const dist = Math.hypot(dx, dy);
    if (dist < 14 && dist > 0.001) {
      const pushDir = Math.sign(dx) || (slug.id > other.id ? 1 : -1);
      const pushAmount = Math.min(1.5, (14 - dist) * 0.5);
      const testX = slug.x + pushDir * pushAmount;
      if (!terrain.isSolid(Math.floor(testX), Math.floor(slug.y - 4)) && !terrain.isSolid(Math.floor(testX), Math.floor(slug.y - 12))) {
        slug.x = testX;
      }
    }
  }

  // De-penetration Safety
  if (
    !terrain.isSolid(Math.floor(slug.x), Math.floor(slug.y - 18)) &&
    !terrain.isSolid(Math.floor(slug.x - 4), Math.floor(slug.y - 18)) &&
    !terrain.isSolid(Math.floor(slug.x + 4), Math.floor(slug.y - 18))
  ) {
    let dePen = 0;
    while (
      dePen < 8 &&
      (terrain.isSolid(Math.floor(slug.x), Math.floor(slug.y - 2)) ||
        terrain.isSolid(Math.floor(slug.x), Math.floor(slug.y - 6)))
    ) {
      slug.y -= 1;
      dePen++;
    }
  }

  if (slug.y >= terrain.data.waterLevel) {
    slug.hp = 0;
    slug.isAlive = false;
  }

  return result;
}

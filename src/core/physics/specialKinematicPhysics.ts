import { ActiveProjectile, Slug } from '../types';
import { DestructibleTerrain } from '../terrain';

const GRAVITY = 0.28;

export interface SpecialKinematicResult {
  exploded: boolean;
  collisionPoint?: { x: number; y: number };
  carveStep?: { x: number; y: number; radius: number };
  landAsMine?: { x: number; y: number };
}

export function updateParachuteMinePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  wind: number,
  slugs: Slug[]
): SpecialKinematicResult {
  if (proj.windAffected) {
    proj.vx += wind * 0.015;
  }
  proj.vy = Math.min(4.5, proj.vy + GRAVITY * 0.4);

  const nextX = proj.x + proj.vx;
  const nextY = proj.y + proj.vy;

  for (const slug of slugs) {
    if (slug.isAlive && slug.isPlaced !== false) {
      if (Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 16) {
        return { exploded: true, collisionPoint: { x: slug.x, y: slug.y - 8 } };
      }
    }
  }

  if (nextY >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: nextX, y: terrain.data.waterLevel } };
  }

  const ray = terrain.raycastSolid(proj.x, proj.y, nextX, nextY);
  if (ray.hit) {
    return {
      exploded: false,
      landAsMine: { x: ray.x, y: ray.y - 2 },
    };
  }

  proj.x = nextX;
  proj.y = nextY;
  return { exploded: false };
}

export function updateBurrowingBusterPhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  slugs: Slug[]
): SpecialKinematicResult {
  for (const slug of slugs) {
    if (slug.isAlive && slug.isPlaced !== false) {
      if (Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 16) {
        return { exploded: true, collisionPoint: { x: slug.x, y: slug.y - 8 } };
      }
    }
  }

  const isSolid = terrain.isSolid(Math.round(proj.x), Math.round(proj.y));
  if (isSolid) {
    proj.vy = Math.min(proj.vy, 4.5);
    proj.behaviorData!.isBurrowing = true;
    proj.behaviorData!.burrowRemaining -= Math.abs(proj.vy);
    proj.y += proj.vy;
    if (proj.behaviorData!.burrowRemaining <= 0 || proj.y >= terrain.data.waterLevel) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y }, carveStep: { x: proj.x, y: proj.y, radius: 14 } };
    }
    return { exploded: false, carveStep: { x: proj.x, y: proj.y, radius: 12 } };
  }

  if (proj.behaviorData?.isBurrowing) {
    proj.vy = Math.min(14, proj.vy + GRAVITY * 2);
  }
  proj.y += proj.vy;
  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
  }
  return { exploded: false };
}

export function updateKamikazePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  slugs: Slug[]
): SpecialKinematicResult {
  const owner = slugs.find((s) => s.id === proj.ownerSlugId);
  if (owner && owner.isAlive) {
    owner.x = proj.x;
    owner.y = proj.y;
  }

  for (const slug of slugs) {
    if (slug.isAlive && slug.isPlaced !== false && slug.id !== proj.ownerSlugId) {
      if (Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 18) {
        if (owner) {
          owner.hp = 0;
          owner.isAlive = false;
        }
        return { exploded: true, collisionPoint: { x: slug.x, y: slug.y - 8 }, carveStep: { x: proj.x, y: proj.y, radius: 16 } };
      }
    }
  }

  proj.x += proj.vx;
  proj.y += proj.vy;
  if (owner && owner.isAlive) {
    owner.x = proj.x;
    owner.y = proj.y;
  }

  proj.behaviorData!.traveled = (proj.behaviorData!.traveled || 0) + Math.hypot(proj.vx, proj.vy);
  if (proj.behaviorData!.traveled >= proj.behaviorData!.maxDistance || proj.y >= terrain.data.waterLevel) {
    if (owner) {
      owner.hp = 0;
      owner.isAlive = false;
    }
    return { exploded: true, collisionPoint: { x: proj.x, y: proj.y }, carveStep: { x: proj.x, y: proj.y, radius: 16 } };
  }
  return { exploded: false, carveStep: { x: proj.x, y: proj.y, radius: 16 } };
}

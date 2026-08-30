import { ActiveProjectile, Slug, ProjectileImpactBehavior } from '../types';
import { DestructibleTerrain } from '../terrain';
import { updateWalkingEntityPhysics } from './walkingEntityPhysics';

export const GRAVITY = 0.28;

export interface ProjectilePhysicsResult {
  exploded: boolean;
  collisionPoint?: { x: number; y: number };
  carveStep?: { x: number; y: number; radius: number };
}

export function updateProjectilePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  arg3?: number | Slug[],
  arg4?: number | Slug[]
): ProjectilePhysicsResult {
  const wind: number = typeof arg3 === 'number' ? arg3 : typeof arg4 === 'number' ? arg4 : 0;
  const slugs: Slug[] = Array.isArray(arg3) ? arg3 : Array.isArray(arg4) ? arg4 : [];

  // Delegate autonomous walking entities (Sheep, Old Lady)
  if (proj.behaviorData?.walkerType) {
    return updateWalkingEntityPhysics(proj, terrain);
  }

  // Burrowing Penetrator (Bunker Buster)
  if (proj.behaviorData?.burrowRemaining !== undefined) {
    // 1. Direct collision with slugs: detonates immediately on impact
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
      proj.behaviorData.isBurrowing = true;
      proj.behaviorData.burrowRemaining -= Math.abs(proj.vy);
      proj.y += proj.vy;
      if (proj.behaviorData.burrowRemaining <= 0 || proj.y >= terrain.data.waterLevel) {
        return { exploded: true, collisionPoint: { x: proj.x, y: proj.y }, carveStep: { x: proj.x, y: proj.y, radius: 14 } };
      }
      return { exploded: false, carveStep: { x: proj.x, y: proj.y, radius: 12 } };
    }

    // Exited a ceiling/rock into an open cavern: accelerates in free-fall
    if (proj.behaviorData.isBurrowing) {
      proj.vy = Math.min(14, proj.vy + GRAVITY * 2);
    }
    proj.y += proj.vy;
    if (proj.y >= terrain.data.waterLevel) {
      return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
    }
    return { exploded: false };
  }

  // Sacrificial Kinetic Rocket (Kamikaze)
  if (proj.behaviorData?.maxDistance !== undefined) {
    const owner = slugs.find((s) => s.id === proj.ownerSlugId);
    if (owner && owner.isAlive) {
      owner.x = proj.x;
      owner.y = proj.y;
    }

    // Direct collision with other slugs along trajectory: explodes immediately
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

    proj.behaviorData.traveled = (proj.behaviorData.traveled || 0) + Math.hypot(proj.vx, proj.vy);
    if (proj.behaviorData.traveled >= proj.behaviorData.maxDistance || proj.y >= terrain.data.waterLevel) {
      if (owner) {
        owner.hp = 0;
        owner.isAlive = false;
      }
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y }, carveStep: { x: proj.x, y: proj.y, radius: 16 } };
    }
    return { exploded: false, carveStep: { x: proj.x, y: proj.y, radius: 16 } };
  }

  // 1. Fuse Countdown
  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 50;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  // 2. Trajectory Dynamics (Homing Guidance or Ballistics with Gravity Scale)
  const homing = proj.homingConfig;

  if (homing && proj.targetPoint) {
    const dx = proj.targetPoint.x - proj.x;
    const dy = proj.targetPoint.y - proj.y;
    const dist = Math.hypot(dx, dy);

    if (dist < (homing.minTargetDist ?? 15)) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }

    const delay = proj.behaviorData?.homingDelayMs ?? homing.delayMs ?? 0;
    if (delay > 0) {
      if (!proj.behaviorData) proj.behaviorData = {};
      proj.behaviorData.homingDelayMs = delay - 50;
      if (proj.windAffected) {
        proj.vx += wind * (homing.windFactor ?? 0.02);
      }
      proj.vy += GRAVITY * (proj.gravityScale ?? 1);
    } else {
      const desiredAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(proj.vy, proj.vx) || desiredAngle;

      let angleDiff = desiredAngle - currentAngle;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

      const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), homing.turnSpeed);
      proj.vx = Math.cos(newAngle) * homing.speed + (proj.windAffected && homing.windFactor ? wind * homing.windFactor : 0);
      proj.vy = Math.sin(newAngle) * homing.speed;
    }
  } else {
    if (proj.windAffected) {
      proj.vx += wind * 0.02;
    }

    const gScale = proj.gravityScale ?? 1;
    if (gScale > 0) {
      const maxVy = proj.maxVelocityY ?? 100;
      proj.vy = Math.min(maxVy, proj.vy + GRAVITY * gScale);
    }
  }

  const nextX = proj.x + proj.vx;
  const nextY = proj.y + proj.vy;

  // Resolve impact mode from data
  const impact: ProjectileImpactBehavior =
    proj.impactBehavior || (proj.bounces ? 'BOUNCE' : 'EXPLODE');

  // 3. Collision with Slugs
  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;
    if (slug.id === proj.ownerSlugId && Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 14) {
      continue;
    }

    const slugRadius = 10;
    const slugCenterY = slug.y - 8;

    // Continuous segment-to-point collision to prevent tunneling on fast bullets
    const segDx = nextX - proj.x;
    const segDy = nextY - proj.y;
    const segLenSq = segDx * segDx + segDy * segDy;
    let distToSlug: number;
    if (segLenSq === 0) {
      distToSlug = Math.hypot(nextX - slug.x, nextY - slugCenterY);
    } else {
      const t = Math.max(0, Math.min(1, ((slug.x - proj.x) * segDx + (slugCenterY - proj.y) * segDy) / segLenSq));
      const closestX = proj.x + t * segDx;
      const closestY = proj.y + t * segDy;
      distToSlug = Math.hypot(closestX - slug.x, closestY - slugCenterY);
    }

    if (distToSlug <= proj.radius + slugRadius) {
      if (impact === 'REST') {
        proj.vx = 0;
        proj.vy = 0;
        return { exploded: false };
      } else if (impact === 'BOUNCE') {
        const dx = nextX - slug.x;
        const dy = nextY - slugCenterY;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;

        const dot = proj.vx * nx + proj.vy * ny;
        if (dot < 0) {
          const elasticity = 0.55;
          proj.vx = (proj.vx - 2 * dot * nx) * elasticity;
          proj.vy = (proj.vy - 2 * dot * ny) * elasticity;
        }

        const pushDist = proj.radius + slugRadius + 1;
        proj.x = slug.x + nx * pushDist;
        proj.y = slugCenterY + ny * pushDist;

        if (Math.hypot(proj.vx, proj.vy) < 0.3) {
          proj.vx = 0;
          proj.vy = 0;
        }

        return { exploded: false };
      } else {
        return { exploded: true, collisionPoint: { x: slug.x, y: slugCenterY } };
      }
    }
  }

  // 4. Collision with Terrain Surface
  const ray = terrain.raycastSolid(proj.x, proj.y, nextX, nextY);

  if (ray.hit) {
    if (impact === 'REST') {
      proj.x = ray.x;
      proj.y = ray.y - 2;
      proj.vx = 0;
      proj.vy = 0;
      return { exploded: false };
    } else if (impact === 'BOUNCE') {
      const normal = terrain.getSurfaceNormal(ray.x, ray.y, Math.max(3, Math.ceil(proj.radius)));
      const nx = normal.nx;
      const ny = normal.ny;

      const dot = proj.vx * nx + proj.vy * ny;
      if (dot < 0) {
        const vnX = dot * nx;
        const vnY = dot * ny;
        const vtX = proj.vx - vnX;
        const vtY = proj.vy - vnY;

        const elasticity = 0.65;
        const friction = 0.88;

        proj.vx = vtX * friction - vnX * elasticity;
        proj.vy = vtY * friction - vnY * elasticity;
      }

      if (Math.hypot(proj.vx, proj.vy) < 0.25) {
        proj.vx = 0;
        proj.vy = 0;
      }

      proj.x = ray.x + nx * (proj.radius + 1.2);
      proj.y = ray.y + ny * (proj.radius + 1.2);

      return { exploded: false };
    } else {
      return { exploded: true, collisionPoint: { x: ray.x, y: ray.y } };
    }
  }

  proj.x = nextX;
  proj.y = nextY;

  // 5. Water Level Boundary
  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
  }

  return { exploded: false };
}

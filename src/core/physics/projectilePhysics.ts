import { Slug, ActiveProjectile, Vector2D, HomingPhysicsConfig, ProjectileImpactBehavior } from '../types';
import { DestructibleTerrain } from '../terrain';
import { sfx } from '../audio';

export const GRAVITY = 0.4;

export function updateProjectilePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  wind: number,
  slugs: Slug[]
): { exploded: boolean; collisionPoint?: Vector2D } {
  // 1. Fuse Timer Expiration
  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 50;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  // 2. Trajectory Dynamics (Homing Guidance or Ballistics with Gravity Scale)
  const homing: HomingPhysicsConfig | undefined =
    proj.homingConfig ||
    (proj.weaponId === 'homing_pigeon'
      ? { speed: 7.5, turnSpeed: 0.22, minTargetDist: 15, windFactor: 0.015 }
      : proj.weaponId === 'homing_missile'
        ? { speed: 13, turnSpeed: 0.28, minTargetDist: 16, delayMs: 500, windFactor: 0.02 }
        : undefined);

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

    const gScale =
      proj.gravityScale !== undefined
        ? proj.gravityScale
        : proj.weaponId === 'super_sheep' || proj.weaponId === 'homing_pigeon' || proj.weaponId === 'homing_missile'
          ? 0
          : proj.weaponId === 'concrete_donkey'
            ? 1.5
            : 1;

    if (gScale > 0) {
      const maxVy = proj.maxVelocityY ?? (proj.weaponId === 'concrete_donkey' ? 18 : 100);
      proj.vy = Math.min(maxVy, proj.vy + GRAVITY * gScale);
    }
  }

  const nextX = proj.x + proj.vx;
  const nextY = proj.y + proj.vy;

  // Resolve impact mode
  const impact: ProjectileImpactBehavior =
    proj.impactBehavior ||
    (proj.weaponId === 'dynamite'
      ? 'REST'
      : proj.bounces && proj.weaponId !== 'concrete_donkey'
        ? 'BOUNCE'
        : 'EXPLODE');

  // 3. Collision with Slugs
  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;
    if (slug.id === proj.ownerSlugId && Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 14) {
      continue;
    }

    const slugCenterY = slug.y - 8;
    const slugRadius = 8;
    const distToSlug = Math.hypot(nextX - slug.x, nextY - slugCenterY);

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
          const elasticity = 0.65;
          const friction = 0.85;
          const vnX = dot * nx;
          const vnY = dot * ny;
          const vtX = proj.vx - vnX;
          const vtY = proj.vy - vnY;
          proj.vx = vtX * friction - vnX * elasticity;
          proj.vy = vtY * friction - vnY * elasticity;
        }

        proj.x = slug.x + nx * (proj.radius + slugRadius + 1.2);
        proj.y = slugCenterY + ny * (proj.radius + slugRadius + 1.2);

        sfx.play('bounce');
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
        const elasticity = 0.62;
        const friction = 0.85;
        const vnX = dot * nx;
        const vnY = dot * ny;
        const vtX = proj.vx - vnX;
        const vtY = proj.vy - vnY;
        proj.vx = vtX * friction - vnX * elasticity;
        proj.vy = vtY * friction - vnY * elasticity;
      }

      if (Math.hypot(proj.vx, proj.vy) < 0.25) {
        proj.vx = 0;
        proj.vy = 0;
      }

      proj.x = ray.x + nx * (proj.radius + 1.2);
      proj.y = ray.y + ny * (proj.radius + 1.2);

      sfx.play('bounce');
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

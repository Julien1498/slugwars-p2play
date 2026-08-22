import { Slug, ActiveProjectile, Vector2D } from '../types';
import { DestructibleTerrain } from '../terrain';
import { sfx } from '../audio';

export const GRAVITY = 0.4;

export function updateProjectilePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  wind: number,
  slugs: Slug[]
): { exploded: boolean; collisionPoint?: Vector2D } {
  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 50;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  if (proj.weaponId === 'homing_pigeon' && proj.targetPoint) {
    const dx = proj.targetPoint.x - proj.x;
    const dy = proj.targetPoint.y - proj.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 15) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }

    const desiredAngle = Math.atan2(dy, dx);
    const speed = 7.5;
    proj.vx = Math.cos(desiredAngle) * speed;
    proj.vy = Math.sin(desiredAngle) * speed;
  } else if (proj.weaponId === 'homing_missile') {
    if (proj.targetPoint) {
      const dx = proj.targetPoint.x - proj.x;
      const dy = proj.targetPoint.y - proj.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 16) {
        return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
      }

      const delay = proj.behaviorData?.homingDelayMs ?? 0;
      if (delay > 0) {
        if (!proj.behaviorData) proj.behaviorData = {};
        proj.behaviorData.homingDelayMs = delay - 50;
        proj.vy += GRAVITY * 0.5;
      } else {
        const desiredAngle = Math.atan2(dy, dx);
        const currentAngle = Math.atan2(proj.vy, proj.vx);

        let angleDiff = desiredAngle - currentAngle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

        const turnSpeed = 0.28;
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

        const speed = 13;
        proj.vx = Math.cos(newAngle) * speed;
        proj.vy = Math.sin(newAngle) * speed;
      }
    } else {
      proj.vy += GRAVITY;
    }
  } else if (proj.weaponId === 'concrete_donkey') {
    proj.vy = Math.min(18, proj.vy + GRAVITY * 1.5);
  } else {
    if (proj.windAffected) {
      proj.vx += wind * 0.02;
    }
    if (proj.weaponId !== 'super_sheep' && proj.weaponId !== 'homing_pigeon' && proj.weaponId !== 'homing_missile') {
      proj.vy += GRAVITY;
    }
  }

  const nextX = proj.x + proj.vx;
  const nextY = proj.y + proj.vy;

  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;
    if (slug.id === proj.ownerSlugId && Math.hypot(proj.x - slug.x, proj.y - (slug.y - 8)) < 14) {
      continue;
    }

    const slugCenterY = slug.y - 8;
    const slugRadius = 8;
    const distToSlug = Math.hypot(nextX - slug.x, nextY - slugCenterY);

    if (distToSlug <= proj.radius + slugRadius) {
      if (proj.weaponId === 'dynamite') {
        proj.vx = 0;
        proj.vy = 0;
        return { exploded: false };
      } else if (proj.weaponId === 'concrete_donkey') {
        return { exploded: true, collisionPoint: { x: slug.x, y: slugCenterY } };
      } else if (proj.bounces) {
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

  const ray = terrain.raycastSolid(proj.x, proj.y, nextX, nextY);

  if (ray.hit) {
    if (proj.weaponId === 'dynamite') {
      proj.x = ray.x;
      proj.y = ray.y - 2;
      proj.vx = 0;
      proj.vy = 0;
      return { exploded: false };
    } else if (proj.weaponId === 'concrete_donkey') {
      return { exploded: true, collisionPoint: { x: ray.x, y: ray.y } };
    } else if (proj.bounces) {
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

      // Rest threshold: if moving very slowly, stop jittering
      if (Math.hypot(proj.vx, proj.vy) < 0.25) {
        proj.vx = 0;
        proj.vy = 0;
      }

      // Position projectile cleanly on the surface along normal
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

  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
  }

  return { exploded: false };
}

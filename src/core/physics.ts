import { Slug, ActiveProjectile, Vector2D } from './types';
import { DestructibleTerrain } from './terrain';
import { sfx } from './audio';

export const GRAVITY = 0.4;
export const FRICTION = 0.85;

export function updateProjectilePhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain,
  wind: number,
  slugs: Slug[]
): { exploded: boolean; collisionPoint?: Vector2D } {
  // 1. Decrement Fuse Timer first on every 50ms engine tick
  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 50;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  // 2. Homing Pigeon & Homing Missile Steering & 0 Gravity
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

        const turnSpeed = 0.28; // Agile sharp homing turn!
        const newAngle = currentAngle + Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), turnSpeed);

        const speed = 13; // Crisp constant homing speed
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

  // 3. Solid Slug Impact Collision Check
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
        proj.vx *= -0.65;
        proj.vy *= -0.65;
        sfx.play('bounce');
        return { exploded: false };
      } else {
        return { exploded: true, collisionPoint: { x: slug.x, y: slugCenterY } };
      }
    }
  }

  // 4. Terrain Raycast Collision Check
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
      // Normal bouncing grenade physics
      proj.x = ray.x - Math.sign(proj.vx || 1) * 2;
      proj.y = ray.y - Math.sign(proj.vy || 1) * 2;
      proj.vx *= -0.65;
      proj.vy *= -0.65;

      sfx.play('bounce');
      return { exploded: false };
    } else {
      return { exploded: true, collisionPoint: { x: ray.x, y: ray.y } };
    }
  }

  proj.x = nextX;
  proj.y = nextY;

  // 5. Water Level Check
  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
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
): { hitCount: number; killedCount: number; damageEvents: Array<{ x: number; y: number; damage: number; slugId?: string }> } {
  let hitCount = 0;
  let killedCount = 0;
  const damageEvents: Array<{ x: number; y: number; damage: number; slugId?: string }> = [];

  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;

    const dx = slug.x - exX;
    const dy = slug.y - (exY - 8);
    const dist = Math.hypot(dx, dy);

    if (dist <= radius + 15) {
      hitCount++;
      const falloff = 1 - Math.min(1, dist / (radius + 15));
      const damage = Math.round(maxDamage * falloff);

      if (damage > 0) {
        slug.hp = Math.max(0, slug.hp - damage);
        if (slug.hp === 0) {
          slug.isAlive = false;
          killedCount++;
        }

        damageEvents.push({ x: slug.x, y: slug.y - 20, damage, slugId: slug.id });
      }

      const angle = Math.atan2(dy, dx);
      const force = (radius / (dist + 5)) * 14;
      slug.vx += Math.cos(angle) * force;
      slug.vy += Math.sin(angle) * force - 3;
    }
  }

  return { hitCount, killedCount, damageEvents };
}

export function isSlugGrounded(slug: Slug, terrain: DestructibleTerrain, slugs: Slug[] = []): boolean {
  const feetY = Math.floor(slug.y + 1);
  const leftX = Math.floor(slug.x - 4);
  const centerX = Math.floor(slug.x);
  const rightX = Math.floor(slug.x + 4);

  if (
    terrain.isSolid(centerX, feetY) ||
    terrain.isSolid(leftX, feetY) ||
    terrain.isSolid(rightX, feetY)
  ) {
    return true;
  }

  // Check if standing on top of another slug's head (y = other.y - 16)
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
  if (!slug.isAlive || slug.isPlaced === false) return {};

  const result: { fallDamage?: number } = {};

  // Track Fall Start Height & Calculate Fall Damage upon Landing
  const grounded = isSlugGrounded(slug, terrain, slugs);
  if (!grounded) {
    if (slug.fallStartY === undefined) {
      slug.fallStartY = slug.y;
    }
  } else if (slug.fallStartY !== undefined) {
    const fallDist = slug.y - slug.fallStartY;
    if (fallDist > 90) {
      const fallDamage = Math.min(65, Math.round((fallDist - 90) * 0.35));
      if (fallDamage > 0) {
        slug.hp = Math.max(0, slug.hp - fallDamage);
        if (slug.hp === 0) {
          slug.isAlive = false;
        }
        result.fallDamage = fallDamage;
      }
    }
    slug.fallStartY = undefined;
  }

  // Apply Gravity
  slug.vy += GRAVITY;

  // Apply Horizontal Friction
  slug.vx *= FRICTION;

  // Vertical Movement & Solid Collision (Terrain + Other Slugs!)
  if (slug.vy > 0) {
    // Falling Downwards
    let landedOnSlug = false;
    for (const other of slugs) {
      if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
      const dx = Math.abs(slug.x - other.x);
      // If landing on top of another slug's head
      if (dx < 14 && slug.y <= other.y - 14 && slug.y + slug.vy >= other.y - 16) {
        slug.y = other.y - 16;
        slug.vy = 0;
        landedOnSlug = true;
        break;
      }
    }

    if (!landedOnSlug) {
      const feetY = Math.floor(slug.y + slug.vy + 1);
      if (
        terrain.isSolid(Math.floor(slug.x), feetY) ||
        terrain.isSolid(Math.floor(slug.x - 4), feetY) ||
        terrain.isSolid(Math.floor(slug.x + 4), feetY)
      ) {
        slug.vy = 0;
        // Snap down ONLY if solid ground is within 6px (gentle slopes), NOT steep cliffs!
        let snapY = Math.floor(slug.y);
        let foundGround = false;
        for (let dy = 0; dy <= 6; dy++) {
          if (
            terrain.isSolid(Math.floor(slug.x), snapY + dy + 1) ||
            terrain.isSolid(Math.floor(slug.x - 4), snapY + dy + 1) ||
            terrain.isSolid(Math.floor(slug.x + 4), snapY + dy + 1)
          ) {
            slug.y = snapY + dy;
            foundGround = true;
            break;
          }
        }
        if (!foundGround) {
          slug.y += slug.vy;
        }
      } else {
        slug.y += slug.vy;
      }
    }
  } else if (slug.vy < 0) {
    // Jumping Upwards
    let hitSlugCeiling = false;
    for (const other of slugs) {
      if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
      const dx = Math.abs(slug.x - other.x);
      if (dx < 14 && slug.y >= other.y && slug.y + slug.vy <= other.y + 4) {
        slug.vy = 0;
        hitSlugCeiling = true;
        break;
      }
    }

    if (!hitSlugCeiling) {
      const headY = Math.floor(slug.y + slug.vy - 16);
      if (terrain.isSolid(Math.floor(slug.x), headY)) {
        slug.vy = 0;
      } else {
        slug.y += slug.vy;
      }
    }
  }

  // Horizontal Movement with Slug-to-Slug Solid Blocking & Terrain Slope Handling
  if (Math.abs(slug.vx) > 0.05) {
    const targetX = slug.x + slug.vx;

    // Check collision with other living placed slugs
    let hitOtherSlug = false;
    for (const other of slugs) {
      if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
      const dx = targetX - other.x;
      const dy = (slug.y - 8) - (other.y - 8);
      if (Math.hypot(dx, dy) < 14) {
        hitOtherSlug = true;
        break;
      }
    }

    if (hitOtherSlug) {
      slug.vx = 0;
    } else {
      let steppedUp = false;
      for (let step = 0; step <= 5; step++) {
        const checkY = Math.floor(slug.y - step);
        if (!terrain.isSolid(Math.floor(targetX), checkY) && !terrain.isSolid(Math.floor(targetX), checkY - 8)) {
          slug.x = targetX;
          slug.y = checkY;
          steppedUp = true;
          break;
        }
      }

      if (!steppedUp) {
        slug.vx = 0;
      }
    }
  }

  // Check Drowning
  if (slug.y >= terrain.data.waterLevel) {
    slug.hp = 0;
    slug.isAlive = false;
  }

  return result;
}

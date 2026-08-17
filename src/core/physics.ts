import { Slug, ActiveProjectile, Vector2D, HelicopterVehicle, Team } from './types';
import { DestructibleTerrain } from './terrain';
import { sfx } from './audio';

export const GRAVITY = 0.4;
export const FRICTION = 0.85;

export function updateHelicopterPhysics(
  heli: HelicopterVehicle,
  terrain: DestructibleTerrain,
  pilotSlug?: Slug
): { crashed?: boolean } {
  if (heli.pilotSlugId) {
    heli.rotorAngle = (heli.rotorAngle + 0.6) % (Math.PI * 2);
    heli.isFlying = true;
  } else {
    heli.rotorAngle = (heli.rotorAngle + 0.08) % (Math.PI * 2);
    heli.isFlying = false;
  }

  const W = terrain.data.width;

  // If piloted by active slug
  if (heli.pilotSlugId && pilotSlug) {
    heli.vx *= 0.92;
    heli.vy *= 0.92;

    // 1. Horizontal Movement & Solid Rock Wall Collision
    if (Math.abs(heli.vx) > 0.05) {
      const targetX = heli.x + heli.vx;
      const sideCheckX = Math.floor(targetX + Math.sign(heli.vx) * 16);

      const hitWall =
        terrain.isSolid(sideCheckX, Math.floor(heli.y - 8)) ||
        terrain.isSolid(sideCheckX, Math.floor(heli.y)) ||
        terrain.isSolid(sideCheckX, Math.floor(heli.y + 8));

      if (hitWall) {
        heli.vx = 0;
      } else {
        heli.x = targetX;
      }
    }

    // 2. Vertical Movement & Solid Ground / Ceiling Collision
    if (Math.abs(heli.vy) > 0.05) {
      const targetY = heli.y + heli.vy;

      if (heli.vy > 0) {
        // Flying downwards - check skids collision
        const skidY = Math.floor(targetY + 13);
        const hitGround =
          terrain.isSolid(Math.floor(heli.x - 12), skidY) ||
          terrain.isSolid(Math.floor(heli.x), skidY) ||
          terrain.isSolid(Math.floor(heli.x + 12), skidY);

        if (hitGround) {
          if (heli.vy > 10) {
            return { crashed: true };
          }
          // Snap skids to rest flat on top of solid ground
          let groundY = skidY;
          while (groundY > 0 && terrain.isSolid(Math.floor(heli.x), groundY)) {
            groundY--;
          }
          heli.y = groundY - 12;
          heli.vy = 0;
          heli.vx *= 0.75;
        } else {
          heli.y = targetY;
        }
      } else {
        // Flying upwards - check top rotor / ceiling collision
        const rotorY = Math.floor(targetY - 12);
        const hitCeiling =
          terrain.isSolid(Math.floor(heli.x - 12), rotorY) ||
          terrain.isSolid(Math.floor(heli.x), rotorY) ||
          terrain.isSolid(Math.floor(heli.x + 12), rotorY);

        if (hitCeiling) {
          heli.vy = 0;
        } else {
          heli.y = targetY;
        }
      }
    }
  } else {
    // Unpiloted helicopter: rest on solid ground or apply gravity
    const skidY = Math.floor(heli.y + 13);
    const isSolidBelow =
      terrain.isSolid(Math.floor(heli.x - 10), skidY) ||
      terrain.isSolid(Math.floor(heli.x), skidY) ||
      terrain.isSolid(Math.floor(heli.x + 10), skidY) ||
      terrain.isSolid(Math.floor(heli.x), skidY + 1);

    if (isSolidBelow) {
      heli.vx = 0;
      heli.vy = 0;
    } else {
      heli.vy = Math.min(10, heli.vy + 0.35);
      heli.vx *= 0.92;

      // Horizontal drift
      if (Math.abs(heli.vx) > 0.05) {
        const sideCheckX = Math.floor(heli.x + heli.vx + Math.sign(heli.vx) * 14);
        if (!terrain.isSolid(sideCheckX, Math.floor(heli.y))) {
          heli.x += heli.vx;
        } else {
          heli.vx = 0;
        }
      }

      // Vertical fall
      const newSkidY = Math.floor(heli.y + heli.vy + 13);
      const hitLanding =
        terrain.isSolid(Math.floor(heli.x - 10), newSkidY) ||
        terrain.isSolid(Math.floor(heli.x), newSkidY) ||
        terrain.isSolid(Math.floor(heli.x + 10), newSkidY);

      if (hitLanding) {
        let groundY = newSkidY;
        while (groundY > 0 && terrain.isSolid(Math.floor(heli.x), groundY)) {
          groundY--;
        }
        heli.y = groundY - 12;
        heli.vy = 0;
        heli.vx = 0;
      } else {
        heli.y += heli.vy;
      }
    }
  }

  // De-penetration safety: if helicopter body center is inside rock, push upward into open air
  let stuckCount = 0;
  while (stuckCount < 20 && terrain.isSolid(Math.floor(heli.x), Math.floor(heli.y))) {
    heli.y -= 2;
    stuckCount++;
  }

  // Strict map bounds clamping: helicopter can NEVER fly outside map limits (left, right, or top ceiling)
  if (heli.x < 35) {
    heli.x = 35;
    heli.vx = Math.max(0, heli.vx);
  }
  if (heli.x > W - 35) {
    heli.x = W - 35;
    heli.vx = Math.min(0, heli.vx);
  }

  // Ceiling boundary: helicopter cannot fly above top of the map
  if (heli.y < 25) {
    heli.y = 25;
    heli.vy = Math.max(0, heli.vy);
  }

  // Synchronize pilot slug position with clamped helicopter
  if (heli.pilotSlugId && pilotSlug) {
    pilotSlug.x = heli.x;
    pilotSlug.y = heli.y;
    pilotSlug.vx = heli.vx;
    pilotSlug.vy = heli.vy;
    pilotSlug.fallStartY = undefined;
  }

  if (heli.y >= terrain.data.waterLevel - 10) {
    return { crashed: true };
  }

  return {};
}

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
  terrain: DestructibleTerrain,
  teams: Team[] = [],
  attackerSlugId?: string
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
      // Detach ninja rope immediately if slug gets hit or blown away by explosion!
      if (slug.ropeState) {
        slug.ropeState = null;
      }
      const falloff = 1 - Math.min(1, dist / (radius + 15));
      const damage = Math.round(maxDamage * falloff);

      if (damage > 0) {
        const victimHpBefore = slug.hp;
        const actualDamage = Math.min(victimHpBefore, damage);
        slug.hp = Math.max(0, slug.hp - damage);

        // Update Victim Team Stats
        const victimTeam = teams.find((t) => t.id === slug.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.damageTaken += actualDamage;
        }

        // Update Attacker Team Stats
        if (attackerSlugId) {
          const attackerSlug = slugs.find((s) => s.id === attackerSlugId);
          if (attackerSlug && attackerSlug.teamId !== slug.teamId) {
            const attackerTeam = teams.find((t) => t.id === attackerSlug.teamId);
            if (attackerTeam) {
              if (!attackerTeam.stats) attackerTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
              attackerTeam.stats.damageDealt += actualDamage;
            }
          }
        }

        if (slug.hp === 0 && victimHpBefore > 0) {
          slug.isAlive = false;
          killedCount++;
          if (victimTeam) {
            if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
            victimTeam.stats.deaths++;
          }
          if (attackerSlugId) {
            const attackerSlug = slugs.find((s) => s.id === attackerSlugId);
            if (attackerSlug && attackerSlug.teamId !== slug.teamId) {
              const attackerTeam = teams.find((t) => t.id === attackerSlug.teamId);
              if (attackerTeam) {
                if (!attackerTeam.stats) attackerTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
                attackerTeam.stats.kills++;
              }
            }
          }
        }

        damageEvents.push({ x: slug.x, y: slug.y - 20, damage: actualDamage, slugId: slug.id });
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

  // Continuous Collision Detection (CCD): Sub-step physics when moving at speed to prevent tunneling through walls & terrain!
  const totalSpeed = Math.hypot(slug.vx, slug.vy);
  const maxStepSize = 2.0; // Maximum 2 pixels per sub-step
  const subSteps = Math.max(1, Math.min(16, Math.ceil(totalSpeed / maxStepSize)));

  const stepVx = slug.vx / subSteps;
  const stepVy = slug.vy / subSteps;

  for (let s = 0; s < subSteps; s++) {
    // 1. Vertical Sub-step
    if (Math.abs(stepVy) > 0.001) {
      if (stepVy > 0) {
        // Falling Downwards
        let landedOnSlug = false;
        for (const other of slugs) {
          if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
          const dx = Math.abs(slug.x - other.x);
          if (dx < 14 && slug.y <= other.y - 14 && slug.y + stepVy >= other.y - 16) {
            slug.y = other.y - 16;
            slug.vy = 0;
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
            // Snap down to ground surface
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
            // Stop further vertical sub-steps in this tick
            break;
          } else {
            slug.y += stepVy;
          }
        } else {
          break;
        }
      } else {
        // Jumping / Knockback Rising Upwards
        let hitSlugCeiling = false;
        for (const other of slugs) {
          if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
          const dx = Math.abs(slug.x - other.x);
          if (dx < 14 && slug.y >= other.y && slug.y + stepVy <= other.y + 4) {
            slug.vy = 0;
            hitSlugCeiling = true;
            break;
          }
        }

        if (!hitSlugCeiling) {
          const headY = Math.floor(slug.y + stepVy - 16);
          if (terrain.isSolid(Math.floor(slug.x), headY)) {
            slug.vy = 0;
            break;
          } else {
            slug.y += stepVy;
          }
        } else {
          break;
        }
      }
    }

    // 2. Horizontal Sub-step
    if (Math.abs(stepVx) > 0.001) {
      const targetX = slug.x + stepVx;

      let hitOtherSlug = false;
      for (const other of slugs) {
        if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
        const curDx = slug.x - other.x;
        const newDx = targetX - other.x;
        const dy = (slug.y - 8) - (other.y - 8);
        const curDist = Math.hypot(curDx, dy);
        const newDist = Math.hypot(newDx, dy);

        // Only block if we are within collision radius AND moving CLOSER to the other slug!
        // If moving AWAY (newDist >= curDist), allow the slug to walk freely to separate!
        if (newDist < 14 && newDist < curDist) {
          hitOtherSlug = true;
          break;
        }
      }

      if (hitOtherSlug) {
        slug.vx = 0;
        break;
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
          break;
        }
      }
    }
  }

  // 3. Slug-to-Slug Soft Repulsion / De-overlap (Gently separates overlapping slugs)
  for (const other of slugs) {
    if (other.id === slug.id || !other.isAlive || other.isPlaced === false) continue;
    const dx = slug.x - other.x;
    const dy = (slug.y - 8) - (other.y - 8);
    const dist = Math.hypot(dx, dy);
    if (dist < 14 && dist > 0.001) {
      // Slugs are overlapping! Push slug away from other slug gently
      const pushDir = Math.sign(dx) || (slug.id > other.id ? 1 : -1);
      const pushAmount = Math.min(1.5, (14 - dist) * 0.5);
      const testX = slug.x + pushDir * pushAmount;
      if (!terrain.isSolid(Math.floor(testX), Math.floor(slug.y - 4)) && !terrain.isSolid(Math.floor(testX), Math.floor(slug.y - 12))) {
        slug.x = testX;
      }
    }
  }

  // De-penetration Safety: If feet are slightly buried in solid earth (e.g. from explosion debris), push upward ONLY if clear open air exists above
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

  // Check Drowning
  if (slug.y >= terrain.data.waterLevel) {
    slug.hp = 0;
    slug.isAlive = false;
  }

  return result;
}

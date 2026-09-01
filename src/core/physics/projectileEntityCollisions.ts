import { ActiveProjectile, Slug, ProjectileImpactBehavior, HelicopterVehicle, ProjectilePhysicsResult } from '../types';

export function checkProjectileEntityCollisions(
  proj: ActiveProjectile,
  nextX: number,
  nextY: number,
  impact: ProjectileImpactBehavior,
  slugs: Slug[],
  helicopters?: HelicopterVehicle[]
): ProjectilePhysicsResult | null {
  const segDx = nextX - proj.x;
  const segDy = nextY - proj.y;
  const segLenSq = segDx * segDx + segDy * segDy;

  // 1. Collision with Slugs
  for (const slug of slugs) {
    if (!slug.isAlive || slug.isPlaced === false) continue;

    const slugRadius = 10;
    const slugCenterY = slug.y - 8;

    let distToSlug: number;
    if (segLenSq === 0) {
      distToSlug = Math.hypot(nextX - slug.x, nextY - slugCenterY);
    } else {
      const t = Math.max(0, Math.min(1, ((slug.x - proj.x) * segDx + (slugCenterY - proj.y) * segDy) / segLenSq));
      const closestX = proj.x + t * segDx;
      const closestY = proj.y + t * segDy;
      distToSlug = Math.hypot(closestX - slug.x, closestY - slugCenterY);
    }

    // Clearance for owner slug during launch
    if (slug.id === proj.ownerSlugId && distToSlug < Math.max(28, proj.radius + slugRadius + 8)) {
      continue;
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

  // 2. Collision with Helicopters
  if (helicopters && helicopters.length > 0) {
    for (const heli of helicopters) {
      if (heli.hp <= 0) continue;

      const heliRadius = 22;
      let distToHeli: number;
      let closestX = nextX;
      let closestY = nextY;
      if (segLenSq === 0) {
        distToHeli = Math.hypot(nextX - heli.x, nextY - heli.y);
      } else {
        const t = Math.max(0, Math.min(1, ((heli.x - proj.x) * segDx + (heli.y - proj.y) * segDy) / segLenSq));
        closestX = proj.x + t * segDx;
        closestY = proj.y + t * segDy;
        distToHeli = Math.hypot(closestX - heli.x, closestY - heli.y);
      }

      // Clearance for owner slug piloting this helicopter during launch
      if (heli.pilotSlugId === proj.ownerSlugId && distToHeli < Math.max(38, proj.radius + heliRadius + 12)) {
        continue;
      }

      if (distToHeli <= proj.radius + heliRadius) {
        if (impact === 'REST') {
          proj.vx = 0;
          proj.vy = 0;
          return { exploded: false };
        } else if (impact === 'BOUNCE') {
          const dx = nextX - heli.x;
          const dy = nextY - heli.y;
          const dist = Math.hypot(dx, dy) || 1;
          const nx = dx / dist;
          const ny = dy / dist;

          const dot = proj.vx * nx + proj.vy * ny;
          if (dot < 0) {
            const elasticity = 0.55;
            proj.vx = (proj.vx - 2 * dot * nx) * elasticity;
            proj.vy = (proj.vy - 2 * dot * ny) * elasticity;
          }

          const pushDist = proj.radius + heliRadius + 1;
          proj.x = heli.x + nx * pushDist;
          proj.y = heli.y + ny * pushDist;

          if (Math.hypot(proj.vx, proj.vy) < 0.3) {
            proj.vx = 0;
            proj.vy = 0;
          }

          return { exploded: false, collisionPoint: { x: closestX, y: closestY } };
        } else {
          return { exploded: true, collisionPoint: { x: closestX, y: closestY } };
        }
      }
    }
  }

  return null;
}

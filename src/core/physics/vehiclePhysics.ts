import { Slug, HelicopterVehicle } from '../types';
import { DestructibleTerrain } from '../terrain';

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

  if (heli.pilotSlugId && pilotSlug) {
    heli.vx *= 0.92;
    heli.vy *= 0.92;

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

    if (Math.abs(heli.vy) > 0.05) {
      const targetY = heli.y + heli.vy;

      if (heli.vy > 0) {
        const skidY = Math.floor(targetY + 13);
        const hitGround =
          terrain.isSolid(Math.floor(heli.x - 12), skidY) ||
          terrain.isSolid(Math.floor(heli.x), skidY) ||
          terrain.isSolid(Math.floor(heli.x + 12), skidY);

        if (hitGround) {
          if (heli.vy > 10) {
            return { crashed: true };
          }
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

      if (Math.abs(heli.vx) > 0.05) {
        const sideCheckX = Math.floor(heli.x + heli.vx + Math.sign(heli.vx) * 14);
        if (!terrain.isSolid(sideCheckX, Math.floor(heli.y))) {
          heli.x += heli.vx;
        } else {
          heli.vx = 0;
        }
      }

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

  let stuckCount = 0;
  while (stuckCount < 20 && terrain.isSolid(Math.floor(heli.x), Math.floor(heli.y))) {
    heli.y -= 2;
    stuckCount++;
  }

  if (heli.x < 35) {
    heli.x = 35;
    heli.vx = Math.max(0, heli.vx);
  }
  if (heli.x > W - 35) {
    heli.x = W - 35;
    heli.vx = Math.min(0, heli.vx);
  }

  if (heli.y < 25) {
    heli.y = 25;
    heli.vy = Math.max(0, heli.vy);
  }

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

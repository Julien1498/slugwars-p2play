import { ActiveProjectile } from '../types';
import { DestructibleTerrain } from '../terrain';

export interface WalkingPhysicsResult {
  exploded: boolean;
  collisionPoint?: { x: number; y: number };
}

export function updateWalkingEntityPhysics(
  proj: ActiveProjectile,
  terrain: DestructibleTerrain
): WalkingPhysicsResult {
  // 1. Fuse Countdown
  if (proj.fuseTimerMs !== undefined) {
    proj.fuseTimerMs -= 50;
    if (proj.fuseTimerMs <= 0) {
      return { exploded: true, collisionPoint: { x: proj.x, y: proj.y } };
    }
  }

  // 2. Water Boundary Check
  if (proj.y >= terrain.data.waterLevel) {
    return { exploded: true, collisionPoint: { x: proj.x, y: terrain.data.waterLevel } };
  }

  if (!proj.behaviorData) {
    proj.behaviorData = { facing: 'right', walkerType: 'sheep', jumpCooldown: 0 };
  }

  const bData = proj.behaviorData;
  const isSheep = bData.walkerType === 'sheep';
  const moveSpeed = isSheep ? 3.0 : 1.4;
  const facing = bData.facing === 'left' ? -1 : 1;

  if (bData.jumpCooldown > 0) {
    bData.jumpCooldown -= 50;
  }

  // 3. Gravity
  proj.vy = Math.min(12, proj.vy + 0.35);

  const nextY = proj.y + proj.vy;
  const isGrounded = terrain.isSolid(Math.round(proj.x), Math.round(nextY + 2));

  if (isGrounded && proj.vy >= 0) {
    // Snap to ground
    proj.vy = 0;
    let groundY = Math.round(nextY);
    while (terrain.isSolid(Math.round(proj.x), groundY) && groundY > 0) {
      groundY--;
    }
    proj.y = groundY;

    // Horizontal advancement
    const stepX = proj.x + facing * moveSpeed;
    const checkY = proj.y - 2;

    // Check forward obstacle
    const isWallAhead = terrain.isSolid(Math.round(stepX), checkY);
    if (isWallAhead) {
      // Try to slope climb up to 6px
      let climbed = false;
      for (let dy = 1; dy <= 6; dy++) {
        if (!terrain.isSolid(Math.round(stepX), checkY - dy)) {
          proj.x = stepX;
          proj.y -= dy;
          climbed = true;
          break;
        }
      }

      if (!climbed) {
        // High obstacle
        if (isSheep && bData.jumpCooldown <= 0) {
          // Sheep jumps over high obstacles!
          proj.vy = -5.2;
          proj.vx = facing * 2.5;
          bData.jumpCooldown = 600;
        } else {
          // Flip direction
          bData.facing = bData.facing === 'left' ? 'right' : 'left';
          proj.vx = 0;
        }
      }
    } else {
      proj.x = stepX;
    }
  } else {
    // In mid-air
    proj.y = nextY;
    proj.x += proj.vx;
  }

  // Check map horizontal boundaries
  if (proj.x < 15) {
    proj.x = 15;
    bData.facing = 'right';
  } else if (proj.x > terrain.data.width - 15) {
    proj.x = terrain.data.width - 15;
    bData.facing = 'left';
  }

  return { exploded: false };
}

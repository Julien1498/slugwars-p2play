import { GameState } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';
import { getWeapon } from '../core/weapons/registry';

export interface HitboxRenderContext {
  ctx: CanvasRenderingContext2D;
  gameState: GameState;
  terrain: DestructibleTerrain;
  terrainHitboxCanvas?: HTMLCanvasElement | null;
  waterLevel: number;
  width: number;
  height: number;
}

export function renderHitboxDebugOverlay(rc: HitboxRenderContext) {
  const { ctx, gameState, terrain, terrainHitboxCanvas, waterLevel, width, height } = rc;

  ctx.save();

  // 0. Solid Ground Terrain Exact Physical Collision Hull & Mask (Neon Emerald Border)
  if (terrainHitboxCanvas) {
    ctx.drawImage(terrainHitboxCanvas, 0, 0);
  }

  // 1. World Map Boundaries & Deep Sea Danger Water Level
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(0, 0, width, height);
  ctx.setLineDash([]);

  // Water Hazard Danger Line
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, waterLevel);
  ctx.lineTo(width, waterLevel);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`⚠️ NIVEAU DE L'EAU (NOYADE INSTANTANÉE: y=${waterLevel})`, 10, waterLevel - 6);

  // 2. Solid Destructible Decor Props Hitboxes
  const { solidProps } = terrain.data;
  if (solidProps) {
    for (const sprop of solidProps) {
      if (sprop.destroyed) continue;

      ctx.save();
      ctx.translate(sprop.x, sprop.y);
      if (sprop.angleRad) {
        ctx.rotate(sprop.angleRad);
      }

      // Ground Foundation Anchor Point
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-1.5, -1.5, 3, 3);

      ctx.setLineDash([2, 2]);
      if (sprop.type === 'tree') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-7, -45, 14, 45);
        ctx.beginPath();
        ctx.arc(0, -35, 18, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sprop.type === 'mushroom') {
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-6, -16, 12, 16);
        ctx.beginPath();
        ctx.ellipse(0, -21, 14, 8, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sprop.type === 'hedgehog') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(-2, -9, 14, 10, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sprop.type === 'chick') {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, -12, 14, 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sprop.type === 'flower') {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-2, -14, 4, 14);
        ctx.beginPath();
        ctx.arc(0, -16, 8, 0, Math.PI * 2);
        ctx.stroke();
      } else if (sprop.type === 'bunker') {
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-18, -26, 36, 26);
      } else if (sprop.type === 'totem') {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-12, -36, 24, 36);
      } else if (sprop.type === 'cactus') {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-11, -38, 22, 38);
      } else if (sprop.type === 'crystal') {
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-13, -26, 26, 26);
      } else if (sprop.type === 'oil_drum') {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-9, -24, 18, 24);
      } else if (sprop.type === 'lamppost') {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-7, -42, 14, 42);
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Prop:${sprop.type}`, 0, -4);

      ctx.restore();
    }
  }

  // 3. Vehicles (Helicopters) Hitboxes
  if (gameState.helicopters) {
    for (const heli of gameState.helicopters) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(heli.x - 22, heli.y - 11, 44, 22);

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(heli.x - 45, heli.y - 16);
      ctx.lineTo(heli.x + 45, heli.y - 16);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(heli.x, heli.y, 65, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#06b6d4';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🚁 Hélico (Zone: 65px)', heli.x, heli.y + 18);
    }
  }

  // 4. Supply Crates Hitboxes
  if (gameState.supplyCrates) {
    for (const crate of gameState.supplyCrates) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([2, 2]);
      ctx.strokeRect(crate.x - 9, crate.y - 9, 18, 18);

      if (!crate.isLanded) {
        ctx.strokeStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(crate.x, crate.y - 22, 16, Math.PI, 0);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('📦 Caisse 18x18', crate.x, crate.y - 12);
    }
  }

  // 5. Placed Steel Girders Hitboxes
  if (gameState.girders) {
    for (const g of gameState.girders) {
      if (!g) continue;
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate((g.angleDeg * Math.PI) / 180);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(-g.length / 2, -g.thickness / 2, g.length, g.thickness);
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Poutre ${g.length}x${g.thickness}`, 0, 3);
      ctx.restore();
    }
  }

  // 6. Landmines Hitboxes & Proximity Trigger Radii
  if (gameState.mines) {
    for (const m of gameState.mines) {
      if (!m) continue;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.arc(m.x, m.y - 8, 25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(m.x - 2, m.y - 2, 4, 4);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💣 Mine (r=25)', m.x, m.y - 16);
    }
  }

  // 7. Projectiles Hitboxes & Blast Radii
  if (gameState.projectiles) {
    for (const proj of gameState.projectiles) {
      if (!proj) continue;
      const weapon = getWeapon(proj.weaponId);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, proj.radius || 4, 0, Math.PI * 2);
      ctx.stroke();

      if (weapon && weapon.radius > 0) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, weapon.radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x + proj.vx * 3, proj.y + proj.vy * 3);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${proj.weaponId} (r=${proj.radius}, blast=${weapon?.radius || 0})`, proj.x, proj.y - 8);
    }
  }

  // 8. Slugs Hitboxes, Ground Sensors & Velocity Vectors
  for (const slug of gameState.slugs) {
    if (!slug.isAlive) continue;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(slug.x, slug.y - 8, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(slug.x - 4, slug.y + 1);
    ctx.lineTo(slug.x + 4, slug.y + 1);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(slug.x - 2, slug.y - 16, 4, 2);

    ctx.fillStyle = '#facc15';
    ctx.fillRect(slug.x - 1, slug.y - 8 - 1, 2, 2);

    if (Math.abs(slug.vx) > 0.1 || Math.abs(slug.vy) > 0.1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(slug.x, slug.y - 8);
      ctx.lineTo(slug.x + slug.vx * 3.5, slug.y - 8 + slug.vy * 3.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

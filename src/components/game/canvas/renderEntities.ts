import { GameState, Slug, Vector2D } from '../../../core/types';
import { TerrainData } from '../../../core/terrainGenerator';
import { getWeapon } from '../../../core/weapons/registry';

export function renderEntities(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  terrainData: TerrainData,
  animTime: number,
  isMyTurn: boolean,
  mousePos: Vector2D,
  showHitboxes: boolean
): void {
  const { width, height, waterLevel } = terrainData;
  const isDay = gameState.config.dayNightCycle === 'DAY';
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

  // 1. Draw Landmines
  if (gameState.mines) {
    for (const mine of gameState.mines) {
      ctx.save();
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(mine.x - 5, mine.y - 3, 10, 5);
      ctx.fillStyle = '#71717a';
      ctx.fillRect(mine.x - 3, mine.y - 5, 6, 2);

      const isBlinking = mine.isTriggered ? Math.floor(Date.now() / 100) % 2 === 0 : Math.floor(Date.now() / 500) % 2 === 0;
      ctx.fillStyle = isBlinking ? (mine.isTriggered ? '#ef4444' : '#eab308') : '#451a03';
      ctx.beginPath();
      ctx.arc(mine.x, mine.y - 5, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // 2. Draw Helicopters
  if (gameState.helicopters) {
    for (const heli of gameState.helicopters) {
      ctx.save();
      ctx.translate(heli.x, heli.y);
      if (heli.facing === 'left') ctx.scale(-1, 1);

      // Main Rotor Mast & Blade
      heli.rotorAngle = (heli.rotorAngle + 0.8) % (Math.PI * 2);
      const bladeWidth = Math.cos(heli.rotorAngle) * 38;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-bladeWidth, -16);
      ctx.lineTo(bladeWidth, -16);
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.fillRect(-2, -16, 4, 6);

      // Tail Boom & Rear Rotor
      ctx.fillStyle = '#334155';
      ctx.fillRect(-35, -5, 25, 6);
      ctx.fillRect(-35, -12, 4, 14);

      // Fuselage Body
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(0, -2, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glass Cockpit Canopy
      ctx.fillStyle = 'rgba(56, 189, 248, 0.65)';
      ctx.beginPath();
      ctx.ellipse(8, -4, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Skids
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, 10);
      ctx.lineTo(16, 10);
      ctx.moveTo(-6, 5);
      ctx.lineTo(-8, 10);
      ctx.moveTo(8, 5);
      ctx.lineTo(10, 10);
      ctx.stroke();

      ctx.restore();

      // Health Bar & Prompt
      const hpPct = Math.max(0, heli.hp / heli.maxHp);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(heli.x - 20, heli.y - 28, 40, 5);
      ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
      ctx.fillRect(heli.x - 20, heli.y - 28, 40 * hpPct, 5);

      if (isMyTurn && activeSlug && !activeSlug.inVehicleId) {
        const dist = Math.hypot(activeSlug.x - heli.x, activeSlug.y - heli.y);
        if (dist < 65) {
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'black 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🚁 Appuyez sur [E] pour Piloter', heli.x, heli.y - 36);
        }
      }
    }
  }

  // 3. Placement Ghost Preview
  if (gameState.phase === 'PLACEMENT' && isMyTurn) {
    const team = gameState.teams.find((t) => t.id === gameState.activeTeamId);
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = team?.color || '#a855f7';
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y - 8, 9, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(mousePos.x, mousePos.y - 8, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`📍 Placer ${activeSlug?.name || 'Limace'}`, mousePos.x, mousePos.y - 28);
  }

  // 4. Draw Slugs
  for (const slug of gameState.slugs) {
    if (!slug.isAlive || !slug.isPlaced) continue;
    const team = gameState.teams.find((t) => t.id === slug.teamId);
    const isActive = slug.id === gameState.activeSlugId;

    if (isActive) {
      const arrowBounce = Math.sin(animTime) * 3;
      const arrowY = slug.y - 48 + arrowBounce;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(slug.x, arrowY + 6);
      ctx.lineTo(slug.x - 5, arrowY);
      ctx.lineTo(slug.x + 5, arrowY);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.translate(slug.x, slug.y);

    // Slug Tail & Body
    ctx.fillStyle = team?.color || '#a855f7';
    ctx.beginPath();
    ctx.ellipse(0, -6, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    const tailDir = slug.facing === 'right' ? -1 : 1;
    ctx.ellipse(tailDir * 6, -3, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffsetX = slug.facing === 'right' ? 3 : -3;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeOffsetX, -10, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(eyeOffsetX + (slug.facing === 'right' ? 1 : -1), -10, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Name Tag & HP Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(slug.x - 22, slug.y - 32, 44, 12);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(slug.name.slice(0, 7), slug.x, slug.y - 23);

    const hpRatio = Math.max(0, slug.hp / slug.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(slug.x - 16, slug.y - 19, 32, 3);
    ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : hpRatio > 0.2 ? '#eab308' : '#ef4444';
    ctx.fillRect(slug.x - 16, slug.y - 19, 32 * hpRatio, 3);
  }

  // 5. Draw Projectiles
  for (const proj of gameState.projectiles) {
    ctx.save();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 6. Draw Particles & Damage Numbers
  if (gameState.particles) {
    for (const p of gameState.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  if (gameState.floatingDamages) {
    for (const fd of gameState.floatingDamages) {
      const age = Date.now() - fd.createdAt;
      const floatY = fd.y - (age / 1000) * 20;
      const alpha = Math.max(0, 1 - age / 1000);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ef4444';
      ctx.font = 'black 14px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`-${fd.damage}`, fd.x, floatY);
      ctx.restore();
    }
  }
}

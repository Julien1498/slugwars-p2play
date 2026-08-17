import { GameState, Vector2D } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

export function renderPlacementGhost(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  terrain: DestructibleTerrain,
  mousePos: Vector2D,
  isMyTurn: boolean,
  animTime: number
) {
  if (gameState.phase !== 'PLACEMENT' || !isMyTurn) return;

  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const team = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const width = terrain.data.width;
  const currentWaterLevel = terrain.data.waterLevel;
  const clampedX = Math.max(20, Math.min(width - 20, Math.round(mousePos.x)));
  let previewY = Math.max(25, Math.min(currentWaterLevel - 15, Math.round(mousePos.y)));

  const hasClearAir = (x: number, y: number): boolean => {
    if (x < 15 || x > width - 15 || y < 20 || y >= currentWaterLevel - 5) return false;
    for (let check = 0; check <= 18; check++) {
      if (
        terrain.isSolid(x, y - check) ||
        terrain.isSolid(x - 4, y - check) ||
        terrain.isSolid(x + 4, y - check)
      ) {
        return false;
      }
    }
    return true;
  };

  if (!hasClearAir(clampedX, previewY)) {
    for (let testY = previewY; testY < currentWaterLevel - 15; testY += 2) {
      if (hasClearAir(clampedX, testY)) {
        previewY = testY;
        break;
      }
    }
  }

  const isValidPos = hasClearAir(clampedX, previewY);

  ctx.save();
  ctx.translate(clampedX, previewY);

  // Pulsing Tactical Placement Ring
  const ringPulse = Math.sin(animTime * 6) * 2;
  ctx.strokeStyle = isValidPos ? '#4ade80' : '#f87171';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(0, -8, 16 + ringPulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Translucent Ghost Slug Body
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = team?.color || '#a855f7';
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(3, -10, 2.5, 0, Math.PI * 2);
  ctx.arc(-3, -10, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(3, -10, 1.2, 0, Math.PI * 2);
  ctx.arc(-3, -10, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Tactical Placement Tooltip Badge
  ctx.save();
  ctx.fillStyle = 'rgba(9, 9, 11, 0.90)';
  ctx.strokeStyle = isValidPos ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 1.2;
  const pLabel = `📍 Placer ${activeSlug?.name || 'Limace'}`;
  ctx.font = 'bold 11px Outfit, sans-serif';
  const pMetrics = ctx.measureText(pLabel);
  const pW = pMetrics.width + 16;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(clampedX - pW / 2, previewY - 44, pW, 20, 6);
  } else {
    ctx.rect(clampedX - pW / 2, previewY - 44, pW, 20);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isValidPos ? '#4ade80' : '#f87171';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pLabel, clampedX, previewY - 34);
  ctx.restore();
}

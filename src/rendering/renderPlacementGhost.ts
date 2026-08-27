import { GameState, Vector2D } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

let _lastGhostX = -99999;
let _lastGhostY = -99999;
let _lastGhostRevision = -1;
let _cachedPreviewY = 0;
let _cachedIsValid = false;

let _lastSlugLabel = '';
let _cachedLabelWidth = 0;

const DASH_4_4 = [4, 4];
const DASH_EMPTY: number[] = [];

// Static vector geometry (Zero reallocation overhead per frame)
const GHOST_BODY = new Path2D();
GHOST_BODY.arc(0, -8, 8, 0, Math.PI * 2);

const GHOST_EYES_WHITE = new Path2D();
GHOST_EYES_WHITE.arc(3, -10, 2.5, 0, Math.PI * 2);
GHOST_EYES_WHITE.arc(-3, -10, 2.5, 0, Math.PI * 2);

const GHOST_PUPILS_BLACK = new Path2D();
GHOST_PUPILS_BLACK.arc(3, -10, 1.2, 0, Math.PI * 2);
GHOST_PUPILS_BLACK.arc(-3, -10, 1.2, 0, Math.PI * 2);

function checkHasClearAir(
  terrain: DestructibleTerrain,
  width: number,
  waterLevel: number,
  x: number,
  y: number
): boolean {
  if (x < 15 || x > width - 15 || y < 20 || y >= waterLevel - 5) return false;
  for (let check = 0; check <= 18; check++) {
    const checkY = y - check;
    if (terrain.isSolid(x, checkY)) return false;
    if (terrain.isSolid(x - 4, checkY)) return false;
    if (terrain.isSolid(x + 4, checkY)) return false;
  }
  return true;
}

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
  const rawY = Math.max(25, Math.min(currentWaterLevel - 15, Math.round(mousePos.y)));

  let previewY = rawY;
  let isValidPos = false;

  if (_lastGhostX === clampedX && _lastGhostY === rawY && _lastGhostRevision === terrain.revision) {
    previewY = _cachedPreviewY;
    isValidPos = _cachedIsValid;
  } else {
    if (!checkHasClearAir(terrain, width, currentWaterLevel, clampedX, previewY)) {
      for (let testY = previewY; testY < currentWaterLevel - 15; testY += 2) {
        if (checkHasClearAir(terrain, width, currentWaterLevel, clampedX, testY)) {
          previewY = testY;
          break;
        }
      }
    }

    isValidPos = checkHasClearAir(terrain, width, currentWaterLevel, clampedX, previewY);
    _lastGhostX = clampedX;
    _lastGhostY = rawY;
    _lastGhostRevision = terrain.revision;
    _cachedPreviewY = previewY;
    _cachedIsValid = isValidPos;
  }

  ctx.save();
  ctx.translate(clampedX, previewY);

  // Pulsing Tactical Placement Ring
  const ringPulse = Math.sin(animTime * 6) * 2;
  ctx.strokeStyle = isValidPos ? '#4ade80' : '#f87171';
  ctx.lineWidth = 1.8;
  ctx.setLineDash(DASH_4_4);
  ctx.beginPath();
  ctx.arc(0, -8, 16 + ringPulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash(DASH_EMPTY);

  // Translucent Ghost Slug Body
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = team?.color || '#a855f7';
  ctx.fill(GHOST_BODY);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke(GHOST_BODY);

  // Eyes (Single Batch Path2D)
  ctx.fillStyle = '#ffffff';
  ctx.fill(GHOST_EYES_WHITE);
  ctx.fillStyle = '#000000';
  ctx.fill(GHOST_PUPILS_BLACK);

  ctx.restore();

  // Tactical Placement Tooltip Badge
  ctx.save();
  ctx.fillStyle = 'rgba(9, 9, 11, 0.90)';
  ctx.strokeStyle = isValidPos ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 1.2;
  const pLabel = `📍 Placer ${activeSlug?.name || 'Limace'}`;

  // Cached font measurement (Avoid OS DirectWrite measurement latency)
  if (pLabel !== _lastSlugLabel || _cachedLabelWidth === 0) {
    ctx.font = 'bold 11px Outfit, sans-serif';
    _cachedLabelWidth = ctx.measureText(pLabel).width + 16;
    _lastSlugLabel = pLabel;
  }
  const pW = _cachedLabelWidth;

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
  ctx.font = 'bold 11px Outfit, sans-serif';
  ctx.fillText(pLabel, clampedX, previewY - 34);
  ctx.restore();
}

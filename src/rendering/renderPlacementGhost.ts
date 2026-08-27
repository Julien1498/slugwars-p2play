import { GameState, Vector2D } from '../core/types';
import { DestructibleTerrain } from '../core/terrain';

let _lastGhostX = -99999;
let _lastGhostY = -99999;
let _lastGhostRevision = -1;
let _cachedPreviewY = 0;
let _cachedIsValid = false;

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

const SPRITE_SCALE = 2;
const SPRITE_W = 220;
const SPRITE_H = 70;
const ANCHOR_X = 110;
const ANCHOR_Y = 54;

let _cachedKey = '';
let _cachedValidCanvas: HTMLCanvasElement | null = null;
let _cachedInvalidCanvas: HTMLCanvasElement | null = null;

function updateGhostSprites(teamColor: string, slugName: string) {
  const key = `${teamColor}_${slugName}`;
  if (_cachedKey === key && _cachedValidCanvas && _cachedInvalidCanvas) {
    return;
  }
  _cachedKey = key;

  if (!_cachedValidCanvas) {
    _cachedValidCanvas = document.createElement('canvas');
    _cachedValidCanvas.width = SPRITE_W * SPRITE_SCALE;
    _cachedValidCanvas.height = SPRITE_H * SPRITE_SCALE;
  }
  if (!_cachedInvalidCanvas) {
    _cachedInvalidCanvas = document.createElement('canvas');
    _cachedInvalidCanvas.width = SPRITE_W * SPRITE_SCALE;
    _cachedInvalidCanvas.height = SPRITE_H * SPRITE_SCALE;
  }

  const pLabel = `📍 Placer ${slugName}`;

  for (const isValid of [true, false]) {
    const canvas = isValid ? _cachedValidCanvas : _cachedInvalidCanvas;
    const sCtx = canvas.getContext('2d');
    if (!sCtx) continue;

    sCtx.clearRect(0, 0, canvas.width, canvas.height);

    sCtx.save();
    sCtx.scale(SPRITE_SCALE, SPRITE_SCALE);
    sCtx.translate(ANCHOR_X, ANCHOR_Y);

    // Translucent Ghost Slug Body
    sCtx.globalAlpha = 0.85;
    sCtx.fillStyle = teamColor;
    sCtx.fill(GHOST_BODY);
    sCtx.strokeStyle = '#ffffff';
    sCtx.lineWidth = 1.5;
    sCtx.stroke(GHOST_BODY);

    // Eyes
    sCtx.fillStyle = '#ffffff';
    sCtx.fill(GHOST_EYES_WHITE);
    sCtx.fillStyle = '#000000';
    sCtx.fill(GHOST_PUPILS_BLACK);
    sCtx.globalAlpha = 1.0;

    // Tactical Placement Tooltip Badge
    sCtx.font = 'bold 11px Outfit, sans-serif';
    const textW = sCtx.measureText(pLabel).width;
    const pW = textW + 16;

    sCtx.fillStyle = 'rgba(9, 9, 11, 0.90)';
    sCtx.strokeStyle = isValid ? '#22c55e' : '#ef4444';
    sCtx.lineWidth = 1.2;

    sCtx.beginPath();
    if (sCtx.roundRect) {
      sCtx.roundRect(-pW / 2, -44, pW, 20, 6);
    } else {
      sCtx.rect(-pW / 2, -44, pW, 20);
    }
    sCtx.fill();
    sCtx.stroke();

    sCtx.fillStyle = isValid ? '#4ade80' : '#f87171';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText(pLabel, 0, -34);

    sCtx.restore();
  }
}

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

  // Pulsing Tactical Placement Ring
  const ringPulse = Math.sin(animTime * 6) * 2;
  ctx.strokeStyle = isValidPos ? '#4ade80' : '#f87171';
  ctx.lineWidth = 1.8;
  ctx.setLineDash(DASH_4_4);
  ctx.beginPath();
  ctx.arc(clampedX, previewY - 8, 16 + ringPulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash(DASH_EMPTY);

  // Draw cached ghost & tooltip sprite in a single GPU-accelerated blit (Zero font parsing or path overhead per frame)
  const teamColor = team?.color || '#a855f7';
  const slugName = activeSlug?.name || 'Limace';
  updateGhostSprites(teamColor, slugName);

  const sprite = isValidPos ? _cachedValidCanvas : _cachedInvalidCanvas;
  if (sprite) {
    ctx.drawImage(
      sprite,
      0,
      0,
      sprite.width,
      sprite.height,
      clampedX - ANCHOR_X,
      previewY - ANCHOR_Y,
      SPRITE_W,
      SPRITE_H
    );
  }
}

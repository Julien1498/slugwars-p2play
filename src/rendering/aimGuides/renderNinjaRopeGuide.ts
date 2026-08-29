import { DestructibleTerrain } from '../../core/terrain';

export function renderNinjaRopeGuide(
  ctx: CanvasRenderingContext2D,
  terrain: DestructibleTerrain,
  originX: number,
  originY: number,
  rad: number,
  dir: number
) {
  const maxDist = 250;
  let hitX = originX + Math.cos(rad) * maxDist * dir;
  let hitY = originY - Math.sin(rad) * maxDist;
  let hasSolid = false;

  for (let d = 10; d <= maxDist; d += 4) {
    const tx = originX + Math.cos(rad) * d * dir;
    const ty = originY - Math.sin(rad) * d;
    if (tx < 0 || tx >= terrain.data.width || ty < 0) break;
    if (terrain.isSolid(Math.floor(tx), Math.floor(ty))) {
      hitX = tx;
      hitY = ty;
      hasSolid = true;
      break;
    }
  }

  ctx.save();
  ctx.strokeStyle = hasSolid ? '#38bdf8' : '#71717a';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(hitX, hitY);
  ctx.stroke();
  ctx.setLineDash([]);

  if (hasSolid) {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.arc(hitX, hitY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

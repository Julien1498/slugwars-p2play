import { SolidProp } from '../../core/types';
import { createPath, addCircle, getCrystalGrad } from './propGradients';

// Crystal Paths
const CRYSTAL_BASE = createPath((p) => {
  p.moveTo(-13, 0);
  p.lineTo(-14, -6);
  p.lineTo(-7, -9);
  p.lineTo(6, -9);
  p.lineTo(14, -6);
  p.lineTo(13, 0);
  p.closePath();
});

const CRYSTAL_SHARDS_DATA = [
  { x: 0, y: -8, h: 22, w: 7, angle: 0 },
  { x: -6, y: -7, h: 17, w: 5.5, angle: -0.25 },
  { x: 6, y: -7, h: 18, w: 5.5, angle: 0.22 },
  { x: -10, y: -5, h: 12, w: 4.5, angle: -0.45 },
  { x: 10, y: -5, h: 13, w: 4.5, angle: 0.42 },
];

const CRYSTAL_ALL_SHARDS = createPath((p) => {
  for (const s of CRYSTAL_SHARDS_DATA) {
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    const tPt = (lx: number, ly: number) => [
      lx * cos - ly * sin + s.x,
      lx * sin + ly * cos + s.y,
    ];
    const [p0x, p0y] = tPt(-s.w / 2, 0);
    const [p1x, p1y] = tPt(-s.w / 2, -s.h * 0.7);
    const [p2x, p2y] = tPt(0, -s.h);
    const [p3x, p3y] = tPt(s.w / 2, -s.h * 0.7);
    const [p4x, p4y] = tPt(s.w / 2, 0);
    p.moveTo(p0x, p0y);
    p.lineTo(p1x, p1y);
    p.lineTo(p2x, p2y);
    p.lineTo(p3x, p3y);
    p.lineTo(p4x, p4y);
    p.closePath();
  }
});

const CRYSTAL_ALL_CRESTS = createPath((p) => {
  for (const s of CRYSTAL_SHARDS_DATA) {
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    const tPt = (lx: number, ly: number) => [
      lx * cos - ly * sin + s.x,
      lx * sin + ly * cos + s.y,
    ];
    const [p0x, p0y] = tPt(0, 0);
    const [p1x, p1y] = tPt(0, -s.h);
    p.moveTo(p0x, p0y);
    p.lineTo(p1x, p1y);
  }
});

const CRYSTAL_GLINTS = createPath((p) => {
  addCircle(p, 0, -22, 1.8);
  addCircle(p, -6, -16, 1.2);
});

export function drawCrystalProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  // Luminous Glowing Crystal Geode Cluster
  const isAmethyst = sprop.variant === 0 || sprop.variant === undefined;
  const isCyan = sprop.variant === 1;
  const crystalType: 'amethyst' | 'cyan' | 'emerald' = isAmethyst ? 'amethyst' : isCyan ? 'cyan' : 'emerald';

  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.fill(CRYSTAL_BASE);
  ctx.stroke(CRYSTAL_BASE);

  ctx.fillStyle = getCrystalGrad(ctx, 22, crystalType);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.8;
  ctx.fill(CRYSTAL_ALL_SHARDS);
  ctx.stroke(CRYSTAL_ALL_SHARDS);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.stroke(CRYSTAL_ALL_CRESTS);

  ctx.fillStyle = '#ffffff';
  ctx.fill(CRYSTAL_GLINTS);
}

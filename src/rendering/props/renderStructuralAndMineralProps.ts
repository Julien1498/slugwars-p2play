import { SolidProp } from '../../core/types';
import {
  createPath,
  addCircle,
  getBunkerGrad,
  getTotemGrad,
  getCrystalGrad,
  getDrumGrad,
  getLampGlowGrad,
} from './propGradients';

// 1. Bunker Paths
const BUNKER_WALLS = createPath((p) => {
  p.moveTo(-18, 0);
  p.lineTo(-14, -20);
  p.lineTo(14, -20);
  p.lineTo(18, 0);
  p.closePath();
});

const BUNKER_ROOF = createPath((p) => {
  p.moveTo(-16, -20);
  p.lineTo(-11, -26);
  p.lineTo(11, -26);
  p.lineTo(16, -20);
  p.closePath();
});

const BUNKER_SLIT = createPath((p) => {
  p.rect(-10, -14, 20, 4);
});

const BUNKER_ANTENNA = createPath((p) => {
  p.moveTo(0, -26);
  p.lineTo(0, -36);
});

const BUNKER_BEACON = createPath((p) => {
  addCircle(p, 0, -36, 2);
});

const BUNKER_WARNING_STRIPES = createPath((p) => {
  p.rect(-12, -4, 4, 4);
  p.rect(-4, -4, 4, 4);
  p.rect(4, -4, 4, 4);
  p.rect(12, -4, 4, 4);
});

// 2. Totem Paths
const TOTEM_STONE_BODY = createPath((p) => {
  p.moveTo(-10, 0);
  p.lineTo(-10, -36);
  p.lineTo(10, -36);
  p.lineTo(10, 0);
  p.closePath();
});

const TOTEM_FACE_CARVINGS = createPath((p) => {
  // Top mouth & brow
  p.moveTo(-6, -28);
  p.lineTo(6, -28);
  p.moveTo(-7, -22);
  p.lineTo(7, -22);
  // Bottom mouth & brow
  p.moveTo(-6, -14);
  p.lineTo(6, -14);
  p.moveTo(-7, -8);
  p.lineTo(7, -8);
});

const TOTEM_EYES_GLOW = createPath((p) => {
  addCircle(p, -4, -25, 2);
  addCircle(p, 4, -25, 2);
  addCircle(p, -4, -11, 2);
  addCircle(p, 4, -11, 2);
});

const TOTEM_WINGS = createPath((p) => {
  p.moveTo(-10, -32);
  p.lineTo(-18, -28);
  p.lineTo(-10, -24);
  p.moveTo(10, -32);
  p.lineTo(18, -28);
  p.lineTo(10, -24);
});

const TOTEM_MOSS = createPath((p) => {
  p.rect(-10, -36, 8, 3);
  p.rect(4, -2, 6, 2);
});

// 3. Oil Drum Paths
const DRUM_BODY = createPath((p) => {
  p.rect(-9, -24, 18, 24);
});

const DRUM_RIMS = createPath((p) => {
  p.moveTo(-9, -19);
  p.lineTo(9, -19);
  p.moveTo(-9, -12);
  p.lineTo(9, -12);
  p.moveTo(-9, -5);
  p.lineTo(9, -5);
});

const DRUM_HAZARD_BAND = createPath((p) => {
  p.rect(-9, -16, 18, 5);
});

const DRUM_FLAME = createPath((p) => {
  p.moveTo(-2.5, -12);
  p.quadraticCurveTo(-4, -14, 0, -16);
  p.quadraticCurveTo(4, -14, 2.5, -12);
  p.closePath();
});

const DRUM_CAP = createPath((p) => {
  p.rect(-5, -26, 4, 2.5);
});

// 4. Crystal Paths
const CRYSTAL_SHARDS = createPath((p) => {
  // Center main crystal
  p.moveTo(0, -35);
  p.lineTo(6, -18);
  p.lineTo(5, 0);
  p.lineTo(-5, 0);
  p.lineTo(-6, -18);
  p.closePath();
  // Left side shard
  p.moveTo(-4, -16);
  p.lineTo(-11, -24);
  p.lineTo(-13, -12);
  p.lineTo(-5, 0);
  p.closePath();
  // Right side shard
  p.moveTo(4, -14);
  p.lineTo(11, -22);
  p.lineTo(12, -10);
  p.lineTo(5, 0);
  p.closePath();
});

const CRYSTAL_CORE = createPath((p) => {
  p.moveTo(0, -35);
  p.lineTo(2, -18);
  p.lineTo(0, 0);
  p.lineTo(-2, -18);
  p.closePath();
});

const CRYSTAL_SPARKLES = createPath((p) => {
  addCircle(p, 0, -35, 2.5);
  addCircle(p, -11, -24, 2);
  addCircle(p, 11, -22, 2);
});

// 5. Lamppost Paths
const LAMP_IRON_STRUCTURE = createPath((p) => {
  p.moveTo(-5, 0);
  p.lineTo(-2, -6);
  p.lineTo(2, -6);
  p.lineTo(5, 0);
  p.closePath();
  p.rect(-1.5, -34, 3, 28);
  p.moveTo(-7, -35);
  p.lineTo(0, -40);
  p.lineTo(7, -35);
  p.closePath();
});

const LAMP_BRACKET = createPath((p) => {
  p.moveTo(0, -34);
  p.quadraticCurveTo(6, -35, 6, -38);
  p.lineTo(0, -38);
});

const LAMP_GLOW_SPHERE = createPath((p) => {
  addCircle(p, 0, -32, 16);
});

const LAMP_GLASS = createPath((p) => {
  p.moveTo(-5, -28);
  p.lineTo(-6, -35);
  p.lineTo(6, -35);
  p.lineTo(5, -28);
  p.closePath();
});

export function drawBunkerProp(ctx: CanvasRenderingContext2D, animTime: number) {
  ctx.fillStyle = getBunkerGrad(ctx);
  ctx.fill(BUNKER_WALLS);
  ctx.fill(BUNKER_ROOF);

  ctx.fillStyle = '#0f172a';
  ctx.fill(BUNKER_SLIT);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.stroke(BUNKER_ANTENNA);

  const isBlinking = Math.sin(animTime * 0.008) > 0;
  ctx.fillStyle = isBlinking ? '#ef4444' : '#7f1d1d';
  ctx.fill(BUNKER_BEACON);

  ctx.fillStyle = '#facc15';
  ctx.fill(BUNKER_WARNING_STRIPES);
}

export function drawTotemProp(ctx: CanvasRenderingContext2D, animTime: number) {
  ctx.fillStyle = getTotemGrad(ctx);
  ctx.fill(TOTEM_STONE_BODY);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.stroke(TOTEM_FACE_CARVINGS);
  ctx.stroke(TOTEM_WINGS);

  const eyePulse = 0.5 + Math.sin(animTime * 0.005) * 0.5;
  ctx.fillStyle = `rgba(56, 189, 248, ${eyePulse})`;
  ctx.fill(TOTEM_EYES_GLOW);

  ctx.fillStyle = '#22c55e';
  ctx.fill(TOTEM_MOSS);
}

export function drawOilDrumProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  const isRust = sprop.variant === 1;
  ctx.fillStyle = getDrumGrad(ctx, isRust);
  ctx.fill(DRUM_BODY);

  ctx.strokeStyle = isRust ? '#78350f' : '#7f1d1d';
  ctx.lineWidth = 1.2;
  ctx.stroke(DRUM_RIMS);

  ctx.fillStyle = '#facc15';
  ctx.fill(DRUM_HAZARD_BAND);

  ctx.fillStyle = '#000000';
  ctx.fill(DRUM_FLAME);

  ctx.fillStyle = '#64748b';
  ctx.fill(DRUM_CAP);
}

export function drawCrystalProp(ctx: CanvasRenderingContext2D, sprop: SolidProp, animTime: number) {
  const crystalType: 'amethyst' | 'cyan' | 'emerald' =
    sprop.variant === 1 ? 'cyan' : sprop.variant === 2 ? 'emerald' : 'amethyst';

  ctx.fillStyle = getCrystalGrad(ctx, 35, crystalType);
  ctx.fill(CRYSTAL_SHARDS);

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.5;
  ctx.fill(CRYSTAL_CORE);

  const shimmer = 0.4 + Math.sin(animTime * 0.006) * 0.6;
  ctx.globalAlpha = shimmer;
  ctx.fill(CRYSTAL_SPARKLES);
  ctx.globalAlpha = 1.0;
}

export function drawLamppostProp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = getLampGlowGrad(ctx);
  ctx.fill(LAMP_GLOW_SPHERE);

  ctx.fillStyle = '#334155';
  ctx.fill(LAMP_IRON_STRUCTURE);

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;
  ctx.stroke(LAMP_BRACKET);

  ctx.fillStyle = '#fef08a';
  ctx.fill(LAMP_GLASS);
}

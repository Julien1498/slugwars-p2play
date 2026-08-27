import { SolidProp } from '../../core/types';
import {
  createPath,
  addCircle,
  addEllipse,
  getTreeTrunkGrad,
  getMushroomStemGrad,
  getMushroomCapGrad,
  getCactusGrad,
} from './propGradients';

// 3. Mushroom
const MUSHROOM_GRASS = createPath((p) => {
  addEllipse(p, -6, -1, 4, 2, -0.4);
  addEllipse(p, 6, -1, 4, 2, 0.4);
});

const MUSHROOM_STEM = createPath((p) => {
  p.moveTo(-4, -16);
  p.quadraticCurveTo(-6, -6, -7, 0);
  p.lineTo(7, 0);
  p.quadraticCurveTo(6, -6, 4, -16);
  p.closePath();
});

const MUSHROOM_VEIL = createPath((p) => {
  addEllipse(p, 0, -14, 5.5, 2, 0);
});

const MUSHROOM_SHADOW = createPath((p) => {
  addEllipse(p, 0, -16, 12, 4, 0);
});

const MUSHROOM_CAP = createPath((p) => {
  p.moveTo(-14, -16);
  p.quadraticCurveTo(-15, -28, 0, -28);
  p.quadraticCurveTo(15, -28, 14, -16);
  p.quadraticCurveTo(0, -13, -14, -16);
  p.closePath();
});

const MUSHROOM_DOTS = createPath((p) => {
  addCircle(p, 0, -21, 2.8);
  addCircle(p, -7, -20, 2.2);
  addCircle(p, 7, -19, 2.4);
  addCircle(p, -2, -25, 1.8);
});

// 4. Flower
const FLOWER_STEM = createPath((p) => {
  p.rect(-1.5, -14, 3, 14);
});

const FLOWER_PETALS = createPath((p) => {
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
    const cx = Math.cos(a) * 7;
    const cy = -16 + Math.sin(a) * 7;
    addCircle(p, cx, cy, 4.5);
  }
});

const FLOWER_CENTER = createPath((p) => {
  addCircle(p, 0, -16, 5);
});

// 5. Tree
const TREE_TRUNK = createPath((p) => {
  p.moveTo(-7, 0);
  p.lineTo(-4, -20);
  p.lineTo(-8, -32);
  p.lineTo(-5, -33);
  p.lineTo(-2, -22);
  p.lineTo(2, -22);
  p.lineTo(6, -31);
  p.lineTo(8, -30);
  p.lineTo(4, -20);
  p.lineTo(7, 0);
  p.closePath();
});

const TREE_BARK = createPath((p) => {
  p.moveTo(-2, -5);
  p.lineTo(-1, -18);
  p.moveTo(2, -8);
  p.lineTo(3, -16);
});

const PINE_TIER_0 = createPath((p) => {
  p.moveTo(0, -16 - 16);
  p.lineTo(18, -16);
  p.lineTo(-18, -16);
  p.closePath();
});

const PINE_TIER_1 = createPath((p) => {
  p.moveTo(0, -26 - 14);
  p.lineTo(15, -26);
  p.lineTo(-15, -26);
  p.closePath();
});

const PINE_TIER_2 = createPath((p) => {
  p.moveTo(0, -35 - 12);
  p.lineTo(12, -35);
  p.lineTo(-12, -35);
  p.closePath();
});

const PINE_TIER_3 = createPath((p) => {
  p.moveTo(0, -43 - 10);
  p.lineTo(8, -43);
  p.lineTo(-8, -43);
  p.closePath();
});

const PINE_CONES = createPath((p) => {
  addCircle(p, -8, -20, 2.5);
  addCircle(p, 7, -28, 2.2);
});

const OAK_DARK_CLUSTERS = createPath((p) => {
  addCircle(p, -11, -28, 14);
  addCircle(p, 11, -28, 14);
});

const OAK_MID_CLUSTERS = createPath((p) => {
  addCircle(p, -7, -38, 13);
  addCircle(p, 7, -38, 13);
});

const OAK_LIGHT_TOP = createPath((p) => {
  addCircle(p, 0, -44, 11);
});

const OAK_APPLES = createPath((p) => {
  addCircle(p, -8, -32, 2.2);
  addCircle(p, 6, -36, 2.0);
  addCircle(p, -2, -42, 2.3);
});

// 8. Cactus
const CACTUS_FULL_BODY = createPath((p) => {
  if (p.roundRect) {
    p.roundRect(-5.5, -36, 11, 36, [5, 5, 0, 0]);
  } else {
    p.rect(-5.5, -36, 11, 36);
  }
  // Left arm
  p.moveTo(-5.5, -18);
  p.lineTo(-11, -18);
  p.lineTo(-11, -29);
  p.arc(-8.5, -29, 2.5, Math.PI, 0);
  p.lineTo(-6, -14);
  p.lineTo(-5.5, -14);
  p.closePath();
  // Right arm
  p.moveTo(5.5, -22);
  p.lineTo(11, -22);
  p.lineTo(11, -33);
  p.arc(8.5, -33, 2.5, 0, Math.PI);
  p.lineTo(6, -18);
  p.lineTo(5.5, -18);
  p.closePath();
});

const CACTUS_RIBS = createPath((p) => {
  p.moveTo(-2, -34);
  p.lineTo(-2, -1);
  p.moveTo(2, -34);
  p.lineTo(2, -1);
});

const CACTUS_NEEDLES = createPath((p) => {
  const needlesY = [-30, -24, -18, -12, -6];
  for (const ny of needlesY) {
    p.rect(-7, ny, 2, 1);
    p.rect(5.5, ny, 2, 1);
  }
});

const CACTUS_FLOWERS = createPath((p) => {
  addCircle(p, 0, -36, 3.5);
  addCircle(p, -2.5, -38, 2);
  addCircle(p, 2.5, -38, 2);
});

export function drawMushroomProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  const isPurple = sprop.variant === 1;
  const isGold = sprop.variant === 2;

  // Grass Tufts at Base
  ctx.fillStyle = '#22c55e';
  ctx.fill(MUSHROOM_GRASS);

  // Organic Curved Stem
  ctx.fillStyle = getMushroomStemGrad(ctx);
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.2;
  ctx.fill(MUSHROOM_STEM);
  ctx.stroke(MUSHROOM_STEM);

  // Ring Veil under cap
  ctx.fillStyle = '#ffffff';
  ctx.fill(MUSHROOM_VEIL);

  // Dark Shadow under Cap Gills
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill(MUSHROOM_SHADOW);

  // Plump 3D Umbrella Dome Cap
  ctx.fillStyle = getMushroomCapGrad(ctx, sprop.variant);
  ctx.fill(MUSHROOM_CAP);

  // Polka Dots
  ctx.fillStyle = isPurple ? '#f472b6' : isGold ? '#fef3c7' : '#ffffff';
  ctx.fill(MUSHROOM_DOTS);
}

export function drawFlowerProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  // Colorful Flower Stem
  ctx.fillStyle = '#15803d';
  ctx.fill(FLOWER_STEM);

  // Petals (Single Combined Batch)
  ctx.fillStyle = sprop.variant === 1 ? '#ec4899' : sprop.variant === 2 ? '#3b82f6' : '#c084fc';
  ctx.fill(FLOWER_PETALS);

  // Center
  ctx.fillStyle = '#facc15';
  ctx.fill(FLOWER_CENTER);
}

export function drawTreeProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  const isPine = sprop.variant === 1;

  // Wood Trunk & Flared Roots
  ctx.fillStyle = getTreeTrunkGrad(ctx);
  ctx.fill(TREE_TRUNK);

  // Wood Bark Texture Lines
  ctx.strokeStyle = '#27160a';
  ctx.lineWidth = 1;
  ctx.stroke(TREE_BARK);

  if (isPine) {
    ctx.fillStyle = '#064e3b'; ctx.fill(PINE_TIER_0);
    ctx.fillStyle = '#047857'; ctx.fill(PINE_TIER_1);
    ctx.fillStyle = '#10b981'; ctx.fill(PINE_TIER_2);
    ctx.fillStyle = '#34d399'; ctx.fill(PINE_TIER_3);
    ctx.fillStyle = '#78350f'; ctx.fill(PINE_CONES);
  } else {
    ctx.fillStyle = '#14532d'; ctx.fill(OAK_DARK_CLUSTERS);
    ctx.fillStyle = '#15803d'; ctx.fill(OAK_MID_CLUSTERS);
    ctx.fillStyle = '#22c55e'; ctx.fill(OAK_LIGHT_TOP);
    ctx.fillStyle = '#ef4444'; ctx.fill(OAK_APPLES);
  }
}

export function drawCactusProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  // Wild West Saguaro Desert Cactus (Micro-batched body)
  ctx.fillStyle = getCactusGrad(ctx);
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.4;
  ctx.fill(CACTUS_FULL_BODY);
  ctx.stroke(CACTUS_FULL_BODY);

  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 0.8;
  ctx.stroke(CACTUS_RIBS);

  ctx.fillStyle = '#fef08a';
  ctx.fill(CACTUS_NEEDLES);

  ctx.fillStyle = sprop.variant === 1 ? '#f43f5e' : '#facc15';
  ctx.fill(CACTUS_FLOWERS);
}

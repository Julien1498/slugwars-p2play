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

// 1. Tree Paths
const TREE_TRUNK = createPath((p) => {
  p.moveTo(-6, 0);
  p.lineTo(-9, -2);
  p.lineTo(-4, -14);
  p.lineTo(-3, -36);
  p.lineTo(3, -36);
  p.lineTo(4, -14);
  p.lineTo(9, -2);
  p.lineTo(6, 0);
  p.closePath();
  p.moveTo(-2, -26);
  p.lineTo(-9, -33);
  p.lineTo(-7, -35);
  p.lineTo(-1, -29);
  p.closePath();
  p.moveTo(2, -24);
  p.lineTo(10, -32);
  p.lineTo(8, -34);
  p.lineTo(1, -27);
  p.closePath();
});

const TREE_FOLIAGE_BACK = createPath((p) => {
  addEllipse(p, 0, -42, 28, 22);
  addEllipse(p, -14, -38, 16, 16);
  addEllipse(p, 14, -38, 16, 16);
});

const TREE_FOLIAGE_MID = createPath((p) => {
  addEllipse(p, 0, -46, 24, 19);
  addEllipse(p, -11, -43, 14, 14);
  addEllipse(p, 11, -43, 14, 14);
});

const TREE_FOLIAGE_FRONT = createPath((p) => {
  addEllipse(p, -5, -48, 14, 11, -0.2);
  addEllipse(p, 7, -46, 12, 10, 0.2);
});

const TREE_APPLES = createPath((p) => {
  addCircle(p, -12, -45, 2.5);
  addCircle(p, 11, -42, 2.5);
  addCircle(p, -3, -52, 2.2);
  addCircle(p, 6, -50, 2.2);
});

// 2. Mushroom Paths
const MUSHROOM_GRASS = createPath((p) => {
  p.moveTo(-10, 0);
  p.lineTo(-12, -7);
  p.lineTo(-8, -1);
  p.lineTo(-5, -9);
  p.lineTo(-3, 0);
  p.lineTo(4, -8);
  p.lineTo(7, -2);
  p.lineTo(11, -7);
  p.lineTo(9, 0);
  p.closePath();
});

const MUSHROOM_STEM = createPath((p) => {
  p.moveTo(-6, 0);
  p.quadraticCurveTo(-7, -8, -4, -16);
  p.lineTo(4, -16);
  p.quadraticCurveTo(7, -8, 6, 0);
  p.closePath();
});

const MUSHROOM_VEIL = createPath((p) => {
  p.moveTo(-6, -11);
  p.quadraticCurveTo(0, -9, 6, -11);
  p.quadraticCurveTo(0, -13, -6, -11);
  p.closePath();
});

const MUSHROOM_SHADOW = createPath((p) => {
  addEllipse(p, 0, -15, 17, 4.5);
});

const MUSHROOM_CAP = createPath((p) => {
  p.moveTo(-18, -15);
  p.quadraticCurveTo(-19, -24, -11, -29);
  p.quadraticCurveTo(0, -32, 11, -29);
  p.quadraticCurveTo(19, -24, 18, -15);
  p.quadraticCurveTo(0, -12, -18, -15);
  p.closePath();
});

const MUSHROOM_SPOTS = createPath((p) => {
  addEllipse(p, 0, -26, 4.5, 3.2);
  addEllipse(p, -9, -22, 3.5, 3.8, -0.3);
  addEllipse(p, 9, -22, 3.5, 3.8, 0.3);
  addCircle(p, -14, -17, 2);
  addCircle(p, 14, -17, 2);
  addCircle(p, 0, -17, 2.2);
});

// 3. Flower Paths
const FLOWER_STEM = createPath((p) => {
  p.moveTo(-1, 0);
  p.quadraticCurveTo(-3, -12, 0, -22);
  p.lineTo(1.5, -22);
  p.quadraticCurveTo(-1.5, -12, 1, 0);
  p.closePath();
});

const FLOWER_LEAF_L = createPath((p) => {
  p.moveTo(-1, -8);
  p.quadraticCurveTo(-10, -12, -8, -6);
  p.quadraticCurveTo(-4, -5, -1, -8);
  p.closePath();
});

const FLOWER_LEAF_R = createPath((p) => {
  p.moveTo(1, -12);
  p.quadraticCurveTo(10, -16, 8, -10);
  p.quadraticCurveTo(4, -9, 1, -12);
  p.closePath();
});

const FLOWER_PETALS = createPath((p) => {
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    addEllipse(p, Math.cos(a) * 8, -22 + Math.sin(a) * 8, 5, 3.5, a);
  }
});

const FLOWER_CENTER = createPath((p) => {
  addCircle(p, 0, -22, 4.5);
});

// 4. Cactus Paths
const CACTUS_MAIN = createPath((p) => {
  p.moveTo(-7, 0);
  p.lineTo(-7, -36);
  p.arc(0, -36, 7, Math.PI, 0);
  p.lineTo(7, 0);
  p.closePath();
});

const CACTUS_ARM_L = createPath((p) => {
  p.moveTo(-7, -16);
  p.lineTo(-14, -16);
  p.lineTo(-14, -28);
  p.arc(-11, -28, 3, Math.PI, 0);
  p.lineTo(-8, -20);
  p.lineTo(-7, -20);
  p.closePath();
});

const CACTUS_ARM_R = createPath((p) => {
  p.moveTo(7, -22);
  p.lineTo(15, -22);
  p.lineTo(15, -32);
  p.arc(12, -32, 3, 0, Math.PI, true);
  p.lineTo(9, -25);
  p.lineTo(7, -25);
  p.closePath();
});

const CACTUS_RIBS = createPath((p) => {
  p.moveTo(-2.5, -34);
  p.lineTo(-2.5, 0);
  p.moveTo(2.5, -34);
  p.lineTo(2.5, 0);
});

const CACTUS_FLOWER = createPath((p) => {
  addCircle(p, 0, -44, 3.5);
  addCircle(p, -2.5, -45, 2.5);
  addCircle(p, 2.5, -45, 2.5);
});

export function drawTreeProp(ctx: CanvasRenderingContext2D, animTime: number) {
  ctx.fillStyle = getTreeTrunkGrad(ctx);
  ctx.fill(TREE_TRUNK);

  const sway = Math.sin(animTime * 0.002) * 2;
  ctx.save();
  ctx.translate(sway, 0);

  ctx.fillStyle = '#14532d';
  ctx.fill(TREE_FOLIAGE_BACK);

  ctx.fillStyle = '#16a34a';
  ctx.fill(TREE_FOLIAGE_MID);

  ctx.fillStyle = '#22c55e';
  ctx.fill(TREE_FOLIAGE_FRONT);

  ctx.fillStyle = '#ef4444';
  ctx.fill(TREE_APPLES);

  ctx.restore();
}

export function drawMushroomProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  ctx.fillStyle = '#22c55e';
  ctx.fill(MUSHROOM_GRASS);

  ctx.fillStyle = getMushroomStemGrad(ctx);
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 1.2;
  ctx.fill(MUSHROOM_STEM);
  ctx.stroke(MUSHROOM_STEM);

  ctx.fillStyle = '#ffffff';
  ctx.fill(MUSHROOM_VEIL);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill(MUSHROOM_SHADOW);

  ctx.fillStyle = getMushroomCapGrad(ctx, sprop.variant);
  ctx.fill(MUSHROOM_CAP);

  ctx.fillStyle = '#ffffff';
  ctx.fill(MUSHROOM_SPOTS);
}

export function drawFlowerProp(ctx: CanvasRenderingContext2D, animTime: number) {
  const sway = Math.sin(animTime * 0.003) * 1.5;
  ctx.save();
  ctx.translate(sway, 0);

  ctx.fillStyle = '#16a34a';
  ctx.fill(FLOWER_STEM);
  ctx.fill(FLOWER_LEAF_L);
  ctx.fill(FLOWER_LEAF_R);

  ctx.fillStyle = '#ec4899';
  ctx.fill(FLOWER_PETALS);

  ctx.fillStyle = '#facc15';
  ctx.fill(FLOWER_CENTER);

  ctx.restore();
}

export function drawCactusProp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = getCactusGrad(ctx);
  ctx.fill(CACTUS_MAIN);
  ctx.fill(CACTUS_ARM_L);
  ctx.fill(CACTUS_ARM_R);

  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1;
  ctx.stroke(CACTUS_RIBS);

  ctx.fillStyle = '#f43f5e';
  ctx.fill(CACTUS_FLOWER);
}

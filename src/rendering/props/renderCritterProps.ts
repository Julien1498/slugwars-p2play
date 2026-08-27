import { createPath, addEllipse, addCircle } from './propGradients';

// 1. Hedgehog Paths
const HEDGEHOG_DARK_SPIKES = createPath((p) => {
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.9 + (i * Math.PI * 0.8) / 8;
    const r1 = 15;
    const r2 = 21;
    p.moveTo(Math.cos(a - 0.15) * r1, -12 + Math.sin(a - 0.15) * r1);
    p.lineTo(Math.cos(a) * r2, -12 + Math.sin(a) * r2);
    p.lineTo(Math.cos(a + 0.15) * r1, -12 + Math.sin(a + 0.15) * r1);
  }
});

const HEDGEHOG_FG_SPIKES = createPath((p) => {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 6;
    const r1 = 12;
    const r2 = 18;
    p.moveTo(Math.cos(a - 0.18) * r1, -12 + Math.sin(a - 0.18) * r1);
    p.lineTo(Math.cos(a) * r2, -12 + Math.sin(a) * r2);
    p.lineTo(Math.cos(a + 0.18) * r1, -12 + Math.sin(a + 0.18) * r1);
  }
});

const HEDGEHOG_BODY = createPath((p) => {
  addEllipse(p, -2, -11, 15, 12);
});

const HEDGEHOG_FACE = createPath((p) => {
  p.moveTo(6, -16);
  p.quadraticCurveTo(13, -12, 18, -9);
  p.quadraticCurveTo(14, -4, 6, -4);
  p.closePath();
});

const HEDGEHOG_BLUSH = createPath((p) => {
  addEllipse(p, 10, -7, 3, 2);
});

const HEDGEHOG_NOSE_EYE = createPath((p) => {
  addCircle(p, 18, -9, 1.8);
  addCircle(p, 11, -11, 1.8);
});

const HEDGEHOG_SPARKLE = createPath((p) => {
  addCircle(p, 11.5, -11.5, 0.7);
});

const HEDGEHOG_EAR = createPath((p) => {
  addEllipse(p, 4, -15, 2.5, 3.5, 0.3);
});

const HEDGEHOG_PAWS = createPath((p) => {
  addEllipse(p, -6, -2, 3, 2);
  addEllipse(p, 4, -2, 3, 2);
});

// 2. Chick Paths
const CHICK_BODY = createPath((p) => {
  addEllipse(p, 0, -8, 8, 8);
  addCircle(p, 4, -14, 5.5);
});

const CHICK_WING = createPath((p) => {
  addEllipse(p, -2, -8, 4, 3, -0.3);
});

const CHICK_BEAK = createPath((p) => {
  p.moveTo(8, -15);
  p.lineTo(12, -13.5);
  p.lineTo(8, -12);
  p.closePath();
});

const CHICK_EYE = createPath((p) => {
  addCircle(p, 6, -15, 1.2);
});

const CHICK_SPARKLE = createPath((p) => {
  addCircle(p, 6.4, -15.4, 0.5);
});

export function drawHedgehogProp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#451a03';
  ctx.fill(HEDGEHOG_DARK_SPIKES);

  ctx.fillStyle = '#b45309';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 0.8;
  ctx.fill(HEDGEHOG_FG_SPIKES);
  ctx.stroke(HEDGEHOG_FG_SPIKES);

  ctx.fillStyle = '#78350f';
  ctx.fill(HEDGEHOG_BODY);

  ctx.fillStyle = '#fef08a';
  ctx.fill(HEDGEHOG_FACE);

  ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
  ctx.fill(HEDGEHOG_BLUSH);

  ctx.fillStyle = '#09090b';
  ctx.fill(HEDGEHOG_NOSE_EYE);

  ctx.fillStyle = '#ffffff';
  ctx.fill(HEDGEHOG_SPARKLE);

  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.fill(HEDGEHOG_EAR);
  ctx.stroke(HEDGEHOG_EAR);

  ctx.fillStyle = '#542608';
  ctx.fill(HEDGEHOG_PAWS);
}

export function drawChickProp(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#eab308';
  ctx.fill(CHICK_BODY);

  ctx.fillStyle = '#ca8a04';
  ctx.fill(CHICK_WING);

  ctx.fillStyle = '#f97316';
  ctx.fill(CHICK_BEAK);

  ctx.fillStyle = '#000000';
  ctx.fill(CHICK_EYE);
  ctx.fillStyle = '#ffffff';
  ctx.fill(CHICK_SPARKLE);
}

import { createPath, addEllipse, addCircle } from './propGradients';

// 1. Hedgehog
const HEDGEHOG_DARK_SPIKES = createPath((p) => {
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.9 + (i * Math.PI * 0.8) / 8;
    const sx = Math.cos(a) * 14;
    const sy = -10 + Math.sin(a) * 14;
    p.moveTo(sx * 0.4, sy * 0.4 - 5);
    p.lineTo(sx * 1.3, sy * 1.3);
    p.lineTo(sx * 0.4 + 2, sy * 0.4 - 5);
    p.closePath();
  }
});

const HEDGEHOG_FG_SPIKES = createPath((p) => {
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI * 0.85 + (i * Math.PI * 0.7) / 6;
    const sx = Math.cos(a) * 13;
    const sy = -9 + Math.sin(a) * 13;
    p.moveTo(sx * 0.4, sy * 0.4 - 5);
    p.lineTo(sx * 1.2, sy * 1.2);
    p.lineTo(sx * 0.4 + 2, sy * 0.4 - 5);
    p.closePath();
  }
});

const HEDGEHOG_BODY = createPath((p) => {
  addEllipse(p, -2, -9, 12, 9, 0);
});

const HEDGEHOG_FACE = createPath((p) => {
  addEllipse(p, 4, -8, 8, 6.5, 0.2);
  p.moveTo(8, -10);
  p.lineTo(13, -7);
  p.lineTo(8, -4);
  p.closePath();
});

const HEDGEHOG_BLUSH = createPath((p) => {
  addEllipse(p, 4, -5, 2.5, 1.5, 0);
});

const HEDGEHOG_NOSE_EYE = createPath((p) => {
  addCircle(p, 13, -7, 1.8);
  addCircle(p, 7, -10, 2.2);
});

const HEDGEHOG_SPARKLE = createPath((p) => {
  addCircle(p, 7.6, -10.6, 0.8);
});

const HEDGEHOG_EAR = createPath((p) => {
  addCircle(p, -2, -14, 2.5);
});

const HEDGEHOG_PAWS = createPath((p) => {
  addEllipse(p, -6, -1, 3.5, 2, 0);
  addEllipse(p, 4, -1, 3.5, 2, 0);
});

// 2. Chick
const CHICK_BODY = createPath((p) => {
  addEllipse(p, 0, -12, 14, 12, 0);
});

const CHICK_WING = createPath((p) => {
  addEllipse(p, -4, -10, 6, 4, -0.3);
});

const CHICK_BEAK = createPath((p) => {
  p.moveTo(10, -14);
  p.lineTo(17, -11);
  p.lineTo(10, -8);
  p.closePath();
});

const CHICK_EYE = createPath((p) => {
  addCircle(p, 7, -15, 2.2);
});

const CHICK_SPARKLE = createPath((p) => {
  p.rect(7.5, -16, 1, 1);
});

export function drawHedgehogProp(ctx: CanvasRenderingContext2D) {
  // 1. Dark Undercoat Spikes
  ctx.fillStyle = '#451a03';
  ctx.fill(HEDGEHOG_DARK_SPIKES);

  // 2. Golden/Brown Foreground Spikes
  ctx.fillStyle = '#b45309';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 0.8;
  ctx.fill(HEDGEHOG_FG_SPIKES);
  ctx.stroke(HEDGEHOG_FG_SPIKES);

  // 3. Plump Brown Body
  ctx.fillStyle = '#78350f';
  ctx.fill(HEDGEHOG_BODY);

  // 4. Soft Peach Face & Snout
  ctx.fillStyle = '#fef08a';
  ctx.fill(HEDGEHOG_FACE);

  // 5. Pink Cheek Blush
  ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
  ctx.fill(HEDGEHOG_BLUSH);

  // 6. Black Button Nose & Eye
  ctx.fillStyle = '#09090b';
  ctx.fill(HEDGEHOG_NOSE_EYE);

  // 7. Glossy Eye White Sparkle
  ctx.fillStyle = '#ffffff';
  ctx.fill(HEDGEHOG_SPARKLE);

  // 8. Cute Ear
  ctx.fillStyle = '#fde047';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.fill(HEDGEHOG_EAR);
  ctx.stroke(HEDGEHOG_EAR);

  // 9. Cute Dark Paws on Ground
  ctx.fillStyle = '#542608';
  ctx.fill(HEDGEHOG_PAWS);
}

export function drawChickProp(ctx: CanvasRenderingContext2D) {
  // Bright Yellow Chick Body
  ctx.fillStyle = '#eab308';
  ctx.fill(CHICK_BODY);

  // Wing
  ctx.fillStyle = '#ca8a04';
  ctx.fill(CHICK_WING);

  // Beak
  ctx.fillStyle = '#f97316';
  ctx.fill(CHICK_BEAK);

  // Eye
  ctx.fillStyle = '#000000';
  ctx.fill(CHICK_EYE);
  ctx.fillStyle = '#ffffff';
  ctx.fill(CHICK_SPARKLE);
}

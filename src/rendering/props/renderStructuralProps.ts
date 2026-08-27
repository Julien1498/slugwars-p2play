import { SolidProp } from '../../core/types';
import {
  createPath,
  addCircle,
  addEllipse,
  getBunkerGrad,
  getTotemGrad,
  getDrumGrad,
  getLampGlowGrad,
} from './propGradients';

// 6. Bunker
const BUNKER_BODY = createPath((p) => {
  p.moveTo(-18, 0);
  p.lineTo(-15, -22);
  p.lineTo(15, -22);
  p.lineTo(18, 0);
  p.closePath();
});

const BUNKER_SANDBAGS = createPath((p) => {
  addEllipse(p, -14, -3, 5, 3, 0.1);
  addEllipse(p, -13, -7, 4.5, 2.5, -0.1);
  addEllipse(p, 14, -3, 5, 3, -0.1);
  addEllipse(p, 13, -7, 4.5, 2.5, 0.1);
});

const BUNKER_VISOR = createPath((p) => {
  p.rect(-10, -16, 20, 5);
});

const BUNKER_RADAR = createPath((p) => {
  addCircle(p, 0, -13.5, 1.8);
});

const BUNKER_STRIPES = createPath((p) => {
  p.rect(-8, -10, 4, 3);
  p.rect(4, -10, 4, 3);
});

const BUNKER_HATCH = createPath((p) => {
  p.rect(-6, -24, 12, 2.5);
});

const BUNKER_ANTENNA_LINE = createPath((p) => {
  p.moveTo(8, -22);
  p.lineTo(8, -34);
});

const BUNKER_ANTENNA_TIP = createPath((p) => {
  addCircle(p, 8, -34, 1.8);
});

// 7. Totem
const TOTEM_BODY = createPath((p) => {
  p.moveTo(-11, 0);
  p.lineTo(-12, -26);
  p.lineTo(-8, -34);
  p.lineTo(8, -34);
  p.lineTo(12, -26);
  p.lineTo(11, 0);
  p.closePath();
});

const TOTEM_BROW = createPath((p) => {
  p.rect(-10, -28, 20, 4);
});

const TOTEM_EYES = createPath((p) => {
  addCircle(p, -5, -22, 2.2);
  addCircle(p, 5, -22, 2.2);
});

const TOTEM_BLACK_DETAILS = createPath((p) => {
  addCircle(p, -5, -22, 1);
  addCircle(p, 5, -22, 1);
  p.rect(-6, -9, 12, 3);
});

const TOTEM_NOSE = createPath((p) => {
  p.moveTo(-3, -24);
  p.lineTo(3, -24);
  p.lineTo(4, -13);
  p.lineTo(-4, -13);
  p.closePath();
});

const TOTEM_MOSS = createPath((p) => {
  addEllipse(p, -6, -33, 4, 2, 0.2);
  addEllipse(p, 7, -31, 3.5, 2, -0.3);
});

const TOTEM_FISSURE = createPath((p) => {
  p.moveTo(-7, -18);
  p.lineTo(-9, -12);
  p.lineTo(-7, -6);
});

// 10. Oil Drum
const DRUM_BODY = createPath((p) => {
  if (p.roundRect) {
    p.roundRect(-9, -24, 18, 24, 2);
  } else {
    p.rect(-9, -24, 18, 24);
  }
});

const DRUM_RINGS = createPath((p) => {
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

// 11. Lamppost
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

export function drawBunkerProp(ctx: CanvasRenderingContext2D) {
  // Fortified Concrete Structure
  ctx.fillStyle = getBunkerGrad(ctx);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fill(BUNKER_BODY);
  ctx.stroke(BUNKER_BODY);

  // Sandbag Bulwarks
  ctx.fillStyle = '#b45309';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.fill(BUNKER_SANDBAGS);
  ctx.stroke(BUNKER_SANDBAGS);

  // Firing Slit Visor Window
  ctx.fillStyle = '#09090b';
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1;
  ctx.fill(BUNKER_VISOR);
  ctx.stroke(BUNKER_VISOR);

  // Scanning Radar Light inside visor
  ctx.fillStyle = '#22c55e';
  ctx.fill(BUNKER_RADAR);

  // Yellow/Black Hazard Stripes
  ctx.fillStyle = '#eab308';
  ctx.fill(BUNKER_STRIPES);

  // Steel Top Hatch & Antenna
  ctx.fillStyle = '#334155';
  ctx.fill(BUNKER_HATCH);

  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.2;
  ctx.stroke(BUNKER_ANTENNA_LINE);

  ctx.fillStyle = '#ef4444';
  ctx.fill(BUNKER_ANTENNA_TIP);
}

export function drawTotemProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  // Ancient Mystical Carved Stone Moai
  ctx.fillStyle = getTotemGrad(ctx);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.fill(TOTEM_BODY);
  ctx.stroke(TOTEM_BODY);

  ctx.fillStyle = '#334155';
  ctx.fill(TOTEM_BROW);

  const eyeGlow = sprop.variant === 1 ? '#06b6d4' : '#facc15';
  ctx.fillStyle = eyeGlow;
  ctx.fill(TOTEM_EYES);

  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.fill(TOTEM_NOSE);
  ctx.stroke(TOTEM_NOSE);

  ctx.fillStyle = '#09090b';
  ctx.fill(TOTEM_BLACK_DETAILS);

  ctx.fillStyle = '#15803d';
  ctx.fill(TOTEM_MOSS);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 0.8;
  ctx.stroke(TOTEM_FISSURE);
}

export function drawOilDrumProp(ctx: CanvasRenderingContext2D, sprop: SolidProp) {
  // Industrial Rusted Oil / Fuel Drum
  const isRust = sprop.variant === 1;
  ctx.fillStyle = getDrumGrad(ctx, isRust);
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.4;
  ctx.fill(DRUM_BODY);
  ctx.stroke(DRUM_BODY);

  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.stroke(DRUM_RINGS);

  ctx.fillStyle = '#facc15';
  ctx.fill(DRUM_HAZARD_BAND);

  ctx.fillStyle = '#09090b';
  ctx.fill(DRUM_FLAME);

  ctx.fillStyle = '#64748b';
  ctx.fill(DRUM_CAP);
}

export function drawLamppostProp(ctx: CanvasRenderingContext2D) {
  // Victorian Wrought-Iron Street Lamp
  ctx.fillStyle = '#18181b';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1.2;
  ctx.fill(LAMP_IRON_STRUCTURE);
  ctx.stroke(LAMP_IRON_STRUCTURE);

  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 1.5;
  ctx.stroke(LAMP_BRACKET);

  ctx.fillStyle = getLampGlowGrad(ctx);
  ctx.fill(LAMP_GLOW_SPHERE);

  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#09090b';
  ctx.lineWidth = 1;
  ctx.fill(LAMP_GLASS);
  ctx.stroke(LAMP_GLASS);
}

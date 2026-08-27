import { SolidProp, CraterRecord, ExplosionEvent, PlacedGirder } from '../core/types';

export function getPixelHash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

let _cachedMushroomStemGrad: CanvasGradient | null = null;
let _cachedMushroomCapPurple: CanvasGradient | null = null;
let _cachedMushroomCapGold: CanvasGradient | null = null;
let _cachedMushroomCapRed: CanvasGradient | null = null;
let _cachedTrunkGrad: CanvasGradient | null = null;
let _cachedBunkerGrad: CanvasGradient | null = null;
let _cachedTotemGrad: CanvasGradient | null = null;
let _cachedCactusGrad: CanvasGradient | null = null;
const _cachedCrystalGrads: Record<string, CanvasGradient> = {};
let _cachedDrumRust: CanvasGradient | null = null;
let _cachedDrumFuel: CanvasGradient | null = null;
let _cachedLampGlow: CanvasGradient | null = null;

function getMushroomStemGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedMushroomStemGrad) {
    const g = ctx.createLinearGradient(0, -16, 0, 0);
    g.addColorStop(0, '#fef9c3');
    g.addColorStop(1, '#fde047');
    _cachedMushroomStemGrad = g;
  }
  return _cachedMushroomStemGrad;
}

function getMushroomCapGrad(ctx: CanvasRenderingContext2D, variant: number | undefined): CanvasGradient {
  if (variant === 1) {
    if (!_cachedMushroomCapPurple) {
      const g = ctx.createLinearGradient(0, -28, 0, -14);
      g.addColorStop(0, '#c084fc');
      g.addColorStop(0.5, '#9333ea');
      g.addColorStop(1, '#581c87');
      _cachedMushroomCapPurple = g;
    }
    return _cachedMushroomCapPurple;
  }
  if (variant === 2) {
    if (!_cachedMushroomCapGold) {
      const g = ctx.createLinearGradient(0, -28, 0, -14);
      g.addColorStop(0, '#fde047');
      g.addColorStop(0.5, '#d97706');
      g.addColorStop(1, '#78350f');
      _cachedMushroomCapGold = g;
    }
    return _cachedMushroomCapGold;
  }
  if (!_cachedMushroomCapRed) {
    const g = ctx.createLinearGradient(0, -28, 0, -14);
    g.addColorStop(0, '#f87171');
    g.addColorStop(0.5, '#dc2626');
    g.addColorStop(1, '#7f1d1d');
    _cachedMushroomCapRed = g;
  }
  return _cachedMushroomCapRed;
}

function getTreeTrunkGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedTrunkGrad) {
    const g = ctx.createLinearGradient(-6, -45, 6, 0);
    g.addColorStop(0, '#78350f');
    g.addColorStop(0.5, '#451a03');
    g.addColorStop(1, '#27160a');
    _cachedTrunkGrad = g;
  }
  return _cachedTrunkGrad;
}

function getBunkerGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedBunkerGrad) {
    const g = ctx.createLinearGradient(-18, -26, 18, 0);
    g.addColorStop(0, '#64748b');
    g.addColorStop(0.6, '#475569');
    g.addColorStop(1, '#334155');
    _cachedBunkerGrad = g;
  }
  return _cachedBunkerGrad;
}

function getTotemGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedTotemGrad) {
    const g = ctx.createLinearGradient(-12, -36, 12, 0);
    g.addColorStop(0, '#64748b');
    g.addColorStop(0.5, '#475569');
    g.addColorStop(1, '#334155');
    _cachedTotemGrad = g;
  }
  return _cachedTotemGrad;
}

function getCactusGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedCactusGrad) {
    const g = ctx.createLinearGradient(-10, -36, 10, 0);
    g.addColorStop(0, '#22c55e');
    g.addColorStop(0.5, '#16a34a');
    g.addColorStop(1, '#15803d');
    _cachedCactusGrad = g;
  }
  return _cachedCactusGrad;
}

function getCrystalGrad(ctx: CanvasRenderingContext2D, h: number, type: 'amethyst' | 'cyan' | 'emerald'): CanvasGradient {
  const key = `${h}_${type}`;
  if (!_cachedCrystalGrads[key]) {
    const g = ctx.createLinearGradient(0, -h, 0, 0);
    if (type === 'amethyst') {
      g.addColorStop(0, '#f5d0fe');
      g.addColorStop(0.4, '#c084fc');
      g.addColorStop(1, '#6b21a8');
    } else if (type === 'cyan') {
      g.addColorStop(0, '#e0f2fe');
      g.addColorStop(0.4, '#38bdf8');
      g.addColorStop(1, '#0284c7');
    } else {
      g.addColorStop(0, '#d1fae5');
      g.addColorStop(0.4, '#34d399');
      g.addColorStop(1, '#059669');
    }
    _cachedCrystalGrads[key] = g;
  }
  return _cachedCrystalGrads[key];
}

function getDrumGrad(ctx: CanvasRenderingContext2D, isRust: boolean): CanvasGradient {
  if (isRust) {
    if (!_cachedDrumRust) {
      const g = ctx.createLinearGradient(-9, -24, 9, 0);
      g.addColorStop(0, '#b45309');
      g.addColorStop(0.5, '#78350f');
      g.addColorStop(1, '#451a03');
      _cachedDrumRust = g;
    }
    return _cachedDrumRust;
  }
  if (!_cachedDrumFuel) {
    const g = ctx.createLinearGradient(-9, -24, 9, 0);
    g.addColorStop(0, '#ef4444');
    g.addColorStop(0.5, '#b91c1c');
    g.addColorStop(1, '#7f1d1d');
    _cachedDrumFuel = g;
  }
  return _cachedDrumFuel;
}

function getLampGlowGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedLampGlow) {
    const g = ctx.createRadialGradient(0, -32, 2, 0, -32, 16);
    g.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    g.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    _cachedLampGlow = g;
  }
  return _cachedLampGlow;
}

function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

function addCircle(p: Path2D, cx: number, cy: number, r: number) {
  p.moveTo(cx + r, cy);
  p.arc(cx, cy, r, 0, Math.PI * 2);
}

function addEllipse(p: Path2D, cx: number, cy: number, rx: number, ry: number, rot: number = 0) {
  const startX = cx + rx * Math.cos(rot);
  const startY = cy + rx * Math.sin(rot);
  p.moveTo(startX, startY);
  p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}

// --- PRE-COMPILED PATH2D VECTOR GEOMETRIES (Zero Garbage Collection, Instant GPU Execution) ---

// 1. Hedgehog
const HEDGEHOG_DARK_SPIKES = createPath((p) => {
  const spikeAngles = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];
  for (const a of spikeAngles) {
    const sx = Math.cos(a - 0.7) * 14;
    const sy = Math.sin(a - 0.7) * 11 - 10;
    p.moveTo(sx * 0.5, sy * 0.5 - 6);
    p.lineTo(sx * 1.35, sy * 1.35);
    p.lineTo(sx * 0.5 + 3, sy * 0.5 - 6);
    p.closePath();
  }
});

const HEDGEHOG_FG_SPIKES = createPath((p) => {
  const spikeAngles = [-0.8, -0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6, 0.8, 1.0];
  for (const a of spikeAngles) {
    const sx = Math.cos(a - 0.75) * 12;
    const sy = Math.sin(a - 0.75) * 9 - 10;
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

// 9. Crystal
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
  // Base
  p.moveTo(-5, 0);
  p.lineTo(-2, -6);
  p.lineTo(2, -6);
  p.lineTo(5, 0);
  p.closePath();
  // Pole
  p.rect(-1.5, -34, 3, 28);
  // Roof
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

export function drawSolidPropVector(ctx: CanvasRenderingContext2D, sprop: SolidProp, _animTime: number = 0) {
  ctx.save();
  ctx.translate(sprop.x, sprop.y);
  if (sprop.angleRad) {
    ctx.rotate(sprop.angleRad);
  }

  if (sprop.type === 'hedgehog') {
    // 1. Dark Undercoat Spikes (Single Batch Call)
    ctx.fillStyle = '#451a03';
    ctx.fill(HEDGEHOG_DARK_SPIKES);

    // 2. Golden/Brown Foreground Spikes (Single Batch Call)
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
  } else if (sprop.type === 'chick') {
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
  } else if (sprop.type === 'mushroom') {
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
  } else if (sprop.type === 'flower') {
    // Colorful Flower Stem
    ctx.fillStyle = '#15803d';
    ctx.fill(FLOWER_STEM);

    // Petals (Single Combined Batch)
    ctx.fillStyle = sprop.variant === 1 ? '#ec4899' : sprop.variant === 2 ? '#3b82f6' : '#c084fc';
    ctx.fill(FLOWER_PETALS);

    // Center
    ctx.fillStyle = '#facc15';
    ctx.fill(FLOWER_CENTER);
  } else if (sprop.type === 'tree') {
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
  } else if (sprop.type === 'bunker') {
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
  } else if (sprop.type === 'totem') {
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
  } else if (sprop.type === 'cactus') {
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
  } else if (sprop.type === 'crystal') {
    // Luminous Glowing Crystal Geode Cluster (Pre-computed micro-batched geometry)
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
  } else if (sprop.type === 'oil_drum') {
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
  } else if (sprop.type === 'lamppost') {
    // Victorian Wrought-Iron Street Lamp (Micro-batched iron structure)
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

  ctx.restore();
}

const _overlappingCratersBuffer: { x: number; y: number; radius: number }[] = [];

export function renderHDDestructibleProp(
  ctx: CanvasRenderingContext2D,
  sprop: SolidProp,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  animTime: number,
  grid: Uint8Array,
  width: number,
  terrainRevision?: number
) {
  // Check foundation stability: only re-evaluate pixel scan when terrain has actually been modified
  if (terrainRevision !== undefined && (sprop as any)._lastFoundationRev === terrainRevision) {
    if (!(sprop as any)._isFoundationSolid) {
      sprop.destroyed = true;
      return;
    }
  } else {
    const halfW = Math.max(4, Math.floor(sprop.width / 2));
    let solidFoundationCount = 0;
    for (let ox = -halfW; ox <= halfW; ox += Math.max(1, Math.floor(halfW / 2))) {
      const gx = Math.floor(sprop.x + ox);
      const gy = Math.floor(sprop.y + 1);
      const idx = gy * width + gx;
      if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
        solidFoundationCount++;
      }
    }
    (sprop as any)._lastFoundationRev = terrainRevision;
    (sprop as any)._isFoundationSolid = solidFoundationCount > 0;

    if (solidFoundationCount === 0) {
      sprop.destroyed = true;
      return;
    }
  }

  const propRadius = Math.max(sprop.width, sprop.height) * 0.85;
  const propCenterY = sprop.y - sprop.height / 2;

  _overlappingCratersBuffer.length = 0;

  if (craters) {
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      const dist = Math.hypot(c.x - sprop.x, c.y - propCenterY);
      if (dist <= c.radius + propRadius) {
        _overlappingCratersBuffer.push(c);
      }
    }
  }
  if (explosions) {
    for (let i = 0; i < explosions.length; i++) {
      const ex = explosions[i];
      const dist = Math.hypot(ex.x - sprop.x, ex.y - propCenterY);
      if (dist <= ex.radius + propRadius) {
        _overlappingCratersBuffer.push(ex);
      }
    }
  }

  if (_overlappingCratersBuffer.length === 0) {
    drawSolidPropVector(ctx, sprop, animTime);
    return;
  }

  ctx.save();
  for (let i = 0; i < _overlappingCratersBuffer.length; i++) {
    const c = _overlappingCratersBuffer[i];
    const notCircle = new Path2D();
    notCircle.rect(sprop.x - 200, sprop.y - 200, 400, 400);
    notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.clip(notCircle, 'evenodd');
  }

  drawSolidPropVector(ctx, sprop, animTime);
  ctx.restore();
}

const _girderCratersBuffer: { x: number; y: number; radius: number }[] = [];

export function renderHDDestructibleGirder(
  ctx: CanvasRenderingContext2D,
  g: PlacedGirder,
  craters: CraterRecord[] | undefined,
  explosions: ExplosionEvent[] | undefined,
  grid: Uint8Array,
  width: number,
  terrainRevision?: number
) {
  if (g.destroyed) return;

  const rad = (g.angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const halfL = g.length / 2;
  const halfT = g.thickness / 2;

  // Foundation stability check
  if (terrainRevision !== undefined && (g as any)._lastFoundationRev === terrainRevision) {
    if (!(g as any)._isFoundationSolid) {
      g.destroyed = true;
      return;
    }
  } else {
    let solidCount = 0;
    const totalSamples = 13;
    for (let s = 0; s < totalSamples; s++) {
      const t = -halfL + (s / (totalSamples - 1)) * g.length;
      const px = Math.round(g.x + t * cos);
      const py = Math.round(g.y + t * sin);
      const idx = py * width + px;
      if (idx >= 0 && idx < grid.length && grid[idx] > 0) {
        solidCount++;
      }
    }
    (g as any)._lastFoundationRev = terrainRevision;
    (g as any)._isFoundationSolid = solidCount > 0;

    if (solidCount === 0) {
      g.destroyed = true;
      return;
    }
  }

  const girderRadius = Math.max(g.length, g.thickness) * 0.65;

  _girderCratersBuffer.length = 0;
  if (craters) {
    const minIndex = g.initialCraterCount !== undefined ? g.initialCraterCount : 0;
    for (let i = 0; i < craters.length; i++) {
      const c = craters[i];
      // Ignore craters that existed before this girder was placed
      if (g.initialCraterCount !== undefined) {
        if (i < minIndex) continue;
      } else if (g.createdAt && c.createdAt && c.createdAt < g.createdAt) {
        continue;
      }
      const dist = Math.hypot(c.x - g.x, c.y - g.y);
      if (dist <= c.radius + girderRadius) {
        _girderCratersBuffer.push(c);
      }
    }
  }

  if (explosions) {
    for (let i = 0; i < explosions.length; i++) {
      const ex = explosions[i];
      const dist = Math.hypot(ex.x - g.x, ex.y - g.y);
      if (dist <= ex.radius + girderRadius) {
        _girderCratersBuffer.push(ex);
      }
    }
  }

  ctx.save();

  if (_girderCratersBuffer.length > 0) {
    for (let i = 0; i < _girderCratersBuffer.length; i++) {
      const c = _girderCratersBuffer[i];
      const notCircle = new Path2D();
      notCircle.rect(g.x - 200, g.y - 200, 400, 400);
      notCircle.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      ctx.clip(notCircle, 'evenodd');
    }
  }

  ctx.translate(g.x, g.y);
  ctx.rotate(rad);

  ctx.fillStyle = '#475569';
  ctx.fillRect(-halfL, -halfT, g.length, g.thickness);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-halfL, -halfT, g.length, g.thickness);

  ctx.fillStyle = '#facc15';
  for (let i = -halfL + 6; i < halfL - 6; i += 16) {
    ctx.fillRect(i, -halfT + 2, 6, g.thickness - 4);
  }

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(-halfL + 4, 0, 1.5, 0, Math.PI * 2);
  ctx.arc(halfL - 4, 0, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

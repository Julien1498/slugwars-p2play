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

export function getMushroomStemGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedMushroomStemGrad) {
    const g = ctx.createLinearGradient(0, -16, 0, 0);
    g.addColorStop(0, '#fef9c3');
    g.addColorStop(1, '#fde047');
    _cachedMushroomStemGrad = g;
  }
  return _cachedMushroomStemGrad;
}

export function getMushroomCapGrad(ctx: CanvasRenderingContext2D, variant: number | undefined): CanvasGradient {
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

export function getTreeTrunkGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedTrunkGrad) {
    const g = ctx.createLinearGradient(-6, -45, 6, 0);
    g.addColorStop(0, '#78350f');
    g.addColorStop(0.5, '#451a03');
    g.addColorStop(1, '#27160a');
    _cachedTrunkGrad = g;
  }
  return _cachedTrunkGrad;
}

export function getBunkerGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedBunkerGrad) {
    const g = ctx.createLinearGradient(-18, -26, 18, 0);
    g.addColorStop(0, '#64748b');
    g.addColorStop(0.6, '#475569');
    g.addColorStop(1, '#334155');
    _cachedBunkerGrad = g;
  }
  return _cachedBunkerGrad;
}

export function getTotemGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedTotemGrad) {
    const g = ctx.createLinearGradient(-12, -36, 12, 0);
    g.addColorStop(0, '#64748b');
    g.addColorStop(0.5, '#475569');
    g.addColorStop(1, '#334155');
    _cachedTotemGrad = g;
  }
  return _cachedTotemGrad;
}

export function getCactusGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedCactusGrad) {
    const g = ctx.createLinearGradient(-10, -36, 10, 0);
    g.addColorStop(0, '#22c55e');
    g.addColorStop(0.5, '#16a34a');
    g.addColorStop(1, '#15803d');
    _cachedCactusGrad = g;
  }
  return _cachedCactusGrad;
}

export function getCrystalGrad(ctx: CanvasRenderingContext2D, h: number, type: 'amethyst' | 'cyan' | 'emerald'): CanvasGradient {
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

export function getDrumGrad(ctx: CanvasRenderingContext2D, isRust: boolean): CanvasGradient {
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

export function getLampGlowGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedLampGlow) {
    const g = ctx.createRadialGradient(0, -32, 2, 0, -32, 16);
    g.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    g.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
    g.addColorStop(1, 'rgba(245, 158, 11, 0)');
    _cachedLampGlow = g;
  }
  return _cachedLampGlow;
}

export function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

export function addCircle(p: Path2D, cx: number, cy: number, r: number) {
  p.moveTo(cx + r, cy);
  p.arc(cx, cy, r, 0, Math.PI * 2);
}

export function addEllipse(p: Path2D, cx: number, cy: number, rx: number, ry: number, rot: number = 0) {
  const startX = cx + rx * Math.cos(rot);
  const startY = cy + rx * Math.sin(rot);
  p.moveTo(startX, startY);
  p.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
}

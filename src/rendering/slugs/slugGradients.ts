// Helper to safely instantiate Path2D in both browser and headless Node/Vitest environments
export function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

export const SLUG_BODY_PATH = createPath((p) => {
  p.moveTo(-11, 4);
  p.quadraticCurveTo(-13, -1, -6, -7);
  p.quadraticCurveTo(0, -13, 8, -7);
  p.quadraticCurveTo(14, 0, 11, 6);
  p.quadraticCurveTo(0, 8, -11, 4);
  p.closePath();
});

export const SLUG_BELLY_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(0, 3, 7.5, 3, -0.1, 0, Math.PI * 2);
  }
});

export const SLUG_SHADOW_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(0, 6, 12, 3.5, 0, 0, Math.PI * 2);
  }
});

export const SLUG_ARROW_PATH = createPath((p) => {
  p.moveTo(0, 8);
  p.lineTo(-6, 0);
  p.lineTo(-2, 0);
  p.lineTo(-2, -8);
  p.lineTo(2, -8);
  p.lineTo(2, 0);
  p.lineTo(6, 0);
  p.closePath();
});

export const SLUG_STALKS_PATH = createPath((p) => {
  p.moveTo(1, -6);
  p.lineTo(2, -10);
  p.moveTo(6, -5);
  p.lineTo(8, -9);
});

export const SLUG_BLINK_PATH = createPath((p) => {
  p.moveTo(-1, -10);
  p.lineTo(5, -10);
  p.moveTo(6, -9);
  p.lineTo(11, -9);
});

export const SLUG_LEFT_EYE_NORMAL_PATH = createPath((p) => {
  p.arc(2, -10, 4.2, 0, Math.PI * 2);
});

export const SLUG_RIGHT_EYE_NORMAL_PATH = createPath((p) => {
  p.arc(8, -9, 3.8, 0, Math.PI * 2);
});

export const SLUG_LEFT_EYE_PANIC_PATH = createPath((p) => {
  p.arc(2, -10, 5.2, 0, Math.PI * 2);
});

export const SLUG_RIGHT_EYE_PANIC_PATH = createPath((p) => {
  p.arc(8, -9, 4.8, 0, Math.PI * 2);
});

export const SLUG_PANIC_MOUTH_PATH = createPath((p) => {
  if (p.ellipse) {
    p.ellipse(6, 0, 3.5, 5, 0.1, 0, Math.PI * 2);
  }
});

const _cachedTeamBodyGrads: Record<string, CanvasGradient> = {};
export function getTeamBodyGrad(ctx: CanvasRenderingContext2D, teamColor: string): CanvasGradient {
  if (!_cachedTeamBodyGrads[teamColor]) {
    const g = ctx.createRadialGradient(-3, -3, 2, 0, 2, 14);
    g.addColorStop(0, '#fef08a');
    g.addColorStop(0.35, teamColor);
    g.addColorStop(1, '#180828');
    _cachedTeamBodyGrads[teamColor] = g;
  }
  return _cachedTeamBodyGrads[teamColor];
}

let _cachedMilitaryCapGrad: CanvasGradient | null = null;
export function getMilitaryCapGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedMilitaryCapGrad) {
    const g = ctx.createLinearGradient(0, -19, 8, -13);
    g.addColorStop(0, '#4d7c0f');
    g.addColorStop(0.55, '#365314');
    g.addColorStop(1, '#1a2e05');
    _cachedMilitaryCapGrad = g;
  }
  return _cachedMilitaryCapGrad;
}

let _cachedGrenadeGrad: CanvasGradient | null = null;
export function getGrenadeGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedGrenadeGrad) {
    const g = ctx.createRadialGradient(7, -1, 1, 8, 0, 5);
    g.addColorStop(0, '#65a30d');
    g.addColorStop(0.6, '#3f6212');
    g.addColorStop(1, '#1a2e05');
    _cachedGrenadeGrad = g;
  }
  return _cachedGrenadeGrad;
}

let _cachedGhostGrad: CanvasGradient | null = null;
export function getGhostGrad(ctx: CanvasRenderingContext2D): CanvasGradient {
  if (!_cachedGhostGrad) {
    const g = ctx.createRadialGradient(-2, -6, 2, 0, 0, 12);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.7, '#e0f2fe');
    g.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
    _cachedGhostGrad = g;
  }
  return _cachedGhostGrad;
}

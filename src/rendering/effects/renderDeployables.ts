import { SupplyCrate, Landmine } from '../../core/types';

function createPath(fn: (p: Path2D) => void): Path2D {
  if (typeof Path2D === 'undefined') return {} as Path2D;
  const p = new Path2D();
  fn(p);
  return p;
}

const PARACHUTE_CANOPY_PATH = createPath((p) => {
  p.arc(0, -24, 18, Math.PI, 0);
});

const PARACHUTE_STRIPE_PATH = createPath((p) => {
  p.arc(0, -24, 8, Math.PI, 0);
});

const PARACHUTE_CORDS_PATH = createPath((p) => {
  p.moveTo(-16, -24);
  p.lineTo(0, -9);
  p.moveTo(16, -24);
  p.lineTo(0, -9);
  p.moveTo(-6, -24);
  p.lineTo(0, -9);
  p.moveTo(6, -24);
  p.lineTo(0, -9);
});

const CRATE_SHADOW_PATH = createPath((p) => {
  p.ellipse(0, 9, 11, 3.5, 0, 0, Math.PI * 2);
});

const CRATE_BOX_PATH = createPath((p) => {
  p.rect(-9, -9, 18, 18);
});

const CRATE_CORNERS_PATH = createPath((p) => {
  p.rect(-9, -9, 4, 4);
  p.rect(5, -9, 4, 4);
  p.rect(-9, 5, 4, 4);
  p.rect(5, 5, 4, 4);
});

const HEALTH_CROSS_PATH = createPath((p) => {
  p.rect(-2, -6, 4, 12);
  p.rect(-6, -2, 12, 4);
});

const WEAPON_SWORDS_PATH = createPath((p) => {
  p.moveTo(-5, -5);
  p.lineTo(5, 5);
  p.moveTo(-3, -1);
  p.lineTo(-1, -3);
  p.moveTo(5, -5);
  p.lineTo(-5, 5);
  p.moveTo(3, -1);
  p.lineTo(1, -3);
});

const UTILITY_WRENCH_PATH = createPath((p) => {
  p.moveTo(-4, -4);
  p.lineTo(3, 3);
  p.moveTo(-5, -2);
  p.lineTo(-2, -5);
  p.moveTo(2, 5);
  p.lineTo(5, 2);
});

interface CrateTheme {
  fill: string;
  stroke: string;
  label: string;
  labelFill: string;
}

const CRATE_THEMES: Record<string, CrateTheme> = {
  health: {
    fill: '#eab308',
    stroke: '#713f12',
    label: '+50 HP',
    labelFill: '#fef08a',
  },
  weapon: {
    fill: '#ea580c',
    stroke: '#431407',
    label: 'ARMES',
    labelFill: '#fed7aa',
  },
  utility: {
    fill: '#0284c7',
    stroke: '#082f49',
    label: 'OUTILS',
    labelFill: '#bae6fd',
  },
};

export function renderSupplyCrates(
  ctx: CanvasRenderingContext2D,
  crates: SupplyCrate[] | undefined,
  animTime: number = 0,
  viewLeft?: number,
  viewRight?: number
) {
  if (!crates || crates.length === 0) return;
  for (const crate of crates) {
    if (viewLeft !== undefined && viewRight !== undefined && (crate.x < viewLeft - 50 || crate.x > viewRight + 50)) {
      continue;
    }
    ctx.save();
    ctx.translate(crate.x, crate.y);

    if (!crate.isLanded) {
      // Gentle parachute sway in the wind
      const swayAngle = Math.sin(animTime * 3.5 + (crate.id.charCodeAt(0) % 7)) * 0.12;
      ctx.rotate(swayAngle);

      // Parachute Canopy (Pure Vector)
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.4;
      if (typeof Path2D !== 'undefined') {
        ctx.fill(PARACHUTE_CANOPY_PATH);
        ctx.stroke(PARACHUTE_CANOPY_PATH);

        // White Center Stripe
        ctx.fillStyle = '#f8fafc';
        ctx.fill(PARACHUTE_STRIPE_PATH);

        // Parachute Suspension Cords
        ctx.strokeStyle = 'rgba(241, 245, 249, 0.75)';
        ctx.lineWidth = 1.1;
        ctx.stroke(PARACHUTE_CORDS_PATH);
      } else {
        ctx.beginPath();
        ctx.arc(0, -24, 18, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
      }
    } else {
      // Ground Drop Shadow (Pure Vector)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      if (typeof Path2D !== 'undefined') {
        ctx.fill(CRATE_SHADOW_PATH);
      } else {
        ctx.beginPath();
        ctx.ellipse(0, 9, 11, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Supply Crate Body styling by crateType (Pure Vector)
    const crateType = crate.crateType || 'health';
    const theme = CRATE_THEMES[crateType] || CRATE_THEMES.health;

    ctx.fillStyle = theme.fill;
    ctx.strokeStyle = theme.stroke;
    ctx.lineWidth = 1.4;

    if (typeof Path2D !== 'undefined') {
      ctx.fill(CRATE_BOX_PATH);
      ctx.stroke(CRATE_BOX_PATH);

      // Metal Corner Brackets
      ctx.fillStyle = '#64748b';
      ctx.fill(CRATE_CORNERS_PATH);
    } else {
      ctx.fillRect(-9, -9, 18, 18);
      ctx.strokeRect(-9, -9, 18, 18);
    }

    // Vector Emblems (Zero Emoji / Font Engine Lookups)
    if (crateType === 'health') {
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 0.8;
      if (typeof Path2D !== 'undefined') {
        ctx.fill(HEALTH_CROSS_PATH);
        ctx.stroke(HEALTH_CROSS_PATH);
      } else {
        ctx.fillRect(-2, -6, 4, 12);
        ctx.strokeRect(-2, -6, 4, 12);
        ctx.fillRect(-6, -2, 12, 4);
        ctx.strokeRect(-6, -2, 12, 4);
      }
    } else if (crateType === 'weapon') {
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      if (typeof Path2D !== 'undefined') {
        ctx.stroke(WEAPON_SWORDS_PATH);
      }
    } else {
      ctx.strokeStyle = '#e0f2fe';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      if (typeof Path2D !== 'undefined') {
        ctx.stroke(UTILITY_WRENCH_PATH);
      }
    }

    // Badge Label (Monospace)
    const label = crateType === 'health' ? `+${crate.healAmount || 50} HP` : theme.label;
    ctx.fillStyle = theme.labelFill;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.font = 'extrabold 8px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText(label, 0, 16);
    ctx.fillText(label, 0, 16);

    ctx.restore();
  }
}

export function renderMines(
  ctx: CanvasRenderingContext2D,
  mines: Landmine[] | undefined,
  viewLeft?: number,
  viewRight?: number
) {
  if (!mines) return;
  for (const mine of mines) {
    if (viewLeft !== undefined && viewRight !== undefined && (mine.x < viewLeft - 40 || mine.x > viewRight + 40)) continue;
    ctx.fillStyle = '#4b5563';
    ctx.beginPath();
    ctx.ellipse(mine.x, mine.y, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.stroke();

    const blink = mine.isTriggered
      ? Math.floor(Date.now() / 100) % 2 === 0
      : Math.floor(Date.now() / 600) % 2 === 0;

    ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(mine.x, mine.y - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    if (mine.isTriggered && mine.fuseTimerMs !== undefined) {
      const sec = (mine.fuseTimerMs / 1000).toFixed(1);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'extrabold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ ${sec}s`, mine.x, mine.y - 12);
    }
  }
}

export function renderMagnets(
  ctx: CanvasRenderingContext2D,
  magnets: import('../../core/types').PlacedMagnet[] | undefined,
  animTime: number = 0,
  viewLeft?: number,
  viewRight?: number
) {
  if (!magnets || magnets.length === 0) return;
  for (const mag of magnets) {
    if (viewLeft !== undefined && viewRight !== undefined && (mag.x < viewLeft - 50 || mag.x > viewRight + 50)) continue;
    ctx.save();
    ctx.translate(mag.x, mag.y);

    // Pulsing magnetic force waves
    const isAttract = mag.polarity === 'ATTRACT';
    const waveRadius = (animTime * 60) % 90;
    const waveAlpha = Math.max(0, 1 - waveRadius / 90) * 0.4;
    ctx.strokeStyle = isAttract ? `rgba(59, 130, 246, ${waveAlpha})` : `rgba(239, 68, 68, ${waveAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, waveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Horseshoe Magnet Body
    ctx.lineWidth = 4;
    ctx.strokeStyle = isAttract ? '#3b82f6' : '#dc2626';
    ctx.beginPath();
    ctx.arc(0, 0, 8, Math.PI, 0, false);
    ctx.stroke();

    // Magnet tips (North/South poles)
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(5, -2, 4, 6);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-9, -2, 4, 6);

    // Turns badge
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${mag.turnsRemaining}t`, 0, -12);

    ctx.restore();
  }
}

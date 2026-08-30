import { SupplyCrate, Landmine } from '../../core/types';

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

      // Parachute Canopy
      const canopyGrad = ctx.createLinearGradient(0, -40, 0, -22);
      canopyGrad.addColorStop(0, '#f87171');
      canopyGrad.addColorStop(0.5, '#dc2626');
      canopyGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = canopyGrad;
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1.4;

      ctx.beginPath();
      ctx.arc(0, -24, 18, Math.PI, 0);
      ctx.fill();
      ctx.stroke();

      // White Center Stripe
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(0, -24, 8, Math.PI, 0);
      ctx.fill();

      // Parachute Suspension Cords
      ctx.strokeStyle = 'rgba(241, 245, 249, 0.75)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-16, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(16, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(-6, -24);
      ctx.lineTo(0, -9);
      ctx.moveTo(6, -24);
      ctx.lineTo(0, -9);
      ctx.stroke();
    } else {
      // Ground Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, 9, 11, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Supply Crate Body styling by crateType
    const crateType = crate.crateType || 'health';
    const crateGrad = ctx.createLinearGradient(-9, -9, 9, 9);

    if (crateType === 'health') {
      crateGrad.addColorStop(0, '#fef08a');
      crateGrad.addColorStop(0.5, '#eab308');
      crateGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = crateGrad;
      ctx.strokeStyle = '#713f12';
    } else if (crateType === 'weapon') {
      crateGrad.addColorStop(0, '#f97316');
      crateGrad.addColorStop(0.5, '#ea580c');
      crateGrad.addColorStop(1, '#7c2d12');
      ctx.fillStyle = crateGrad;
      ctx.strokeStyle = '#431407';
    } else {
      crateGrad.addColorStop(0, '#38bdf8');
      crateGrad.addColorStop(0.5, '#0284c7');
      crateGrad.addColorStop(1, '#0c4a6e');
      ctx.fillStyle = crateGrad;
      ctx.strokeStyle = '#082f49';
    }

    ctx.lineWidth = 1.4;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.strokeRect(-9, -9, 18, 18);

    // Metal Corner Brackets
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-9, -9, 4, 4);
    ctx.fillRect(5, -9, 4, 4);
    ctx.fillRect(-9, 5, 4, 4);
    ctx.fillRect(5, 5, 4, 4);

    if (crateType === 'health') {
      // Red Cross Medical Emblem
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 0.8;
      ctx.fillRect(-2, -6, 4, 12);
      ctx.strokeRect(-2, -6, 4, 12);
      ctx.fillRect(-6, -2, 12, 4);
      ctx.strokeRect(-6, -2, 12, 4);

      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'extrabold 8.5px monospace';
      ctx.textAlign = 'center';
      ctx.strokeText(`+${crate.healAmount || 50} HP`, 0, 16);
      ctx.fillText(`+${crate.healAmount || 50} HP`, 0, 16);
    } else if (crateType === 'weapon') {
      // Weapon Cross Guns / Bullet Emblem
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⚔️', 0, 0);

      ctx.fillStyle = '#fed7aa';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'extrabold 8px monospace';
      ctx.strokeText('ARMES', 0, 16);
      ctx.fillText('ARMES', 0, 16);
    } else {
      // Utility Tool Emblem
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧰', 0, 0);

      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'extrabold 8px monospace';
      ctx.strokeText('OUTILS', 0, 16);
      ctx.fillText('OUTILS', 0, 16);
    }

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

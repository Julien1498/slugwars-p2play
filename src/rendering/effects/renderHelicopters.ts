import { HelicopterVehicle, GameState } from '../../core/types';

export function renderHelicopters(
  ctx: CanvasRenderingContext2D,
  helicopters: HelicopterVehicle[] | undefined,
  gameState: GameState,
  animTime: number,
  isMyTurn: boolean,
  viewLeft?: number,
  viewRight?: number
) {
  if (!helicopters) return;
  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);

  for (const heli of helicopters) {
    if (viewLeft !== undefined && viewRight !== undefined && (heli.x < viewLeft - 100 || heli.x > viewRight + 100)) continue;
    ctx.save();
    ctx.translate(heli.x, heli.y);
    if (heli.facing === 'left') ctx.scale(-1, 1);

    // Dynamic flight tilt
    const tilt = Math.max(-0.25, Math.min(0.25, heli.vx * (heli.facing === 'left' ? -0.06 : 0.06)));
    ctx.rotate(tilt);

    // Skids
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-18, 14);
    ctx.lineTo(18, 14);
    ctx.moveTo(-10, 8);
    ctx.lineTo(-12, 14);
    ctx.moveTo(10, 8);
    ctx.lineTo(12, 14);
    ctx.stroke();

    // Fuselage
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glass
    ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(8, -2, 11, 7, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Pilot
    if (heli.pilotSlugId) {
      const pilot = gameState.slugs.find((s) => s.id === heli.pilotSlugId);
      const team = pilot ? gameState.teams.find((t) => t.id === pilot.teamId) : null;
      const teamColor = team ? team.color : '#a855f7';

      ctx.save();
      ctx.translate(7, -3);
      ctx.fillStyle = teamColor;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, -1, 5, Math.PI, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-2, -1, 5, 2.5);
      ctx.restore();
    }

    // Tail
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-35, -3, 20, 5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-37, -9, 4, 12);

    const isPiloted = Boolean(heli.pilotSlugId);
    const isAirborne = isPiloted || (Math.abs(heli.vx) > 0.1 || Math.abs(heli.vy) > 0.1);

    // Tail Rotor
    const tailRotorSpeed = isPiloted ? 45 : isAirborne ? 20 : 6;
    const tSpin = Math.sin(animTime * tailRotorSpeed);
    ctx.strokeStyle = isPiloted ? '#cbd5e1' : '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-35, -3 - tSpin * 8);
    ctx.lineTo(-35, -3 + tSpin * 8);
    ctx.stroke();

    // Main Rotor
    ctx.fillStyle = '#475569';
    ctx.fillRect(-2, -16, 4, 6);

    // High-speed rotor blur disc when flying
    if (isPiloted) {
      ctx.save();
      ctx.fillStyle = 'rgba(203, 213, 225, 0.22)';
      ctx.beginPath();
      ctx.ellipse(0, -16, 45, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const mainRotorSpeed = isPiloted ? 35 : isAirborne ? 16 : 4;
    const currentRotorAngle = animTime * mainRotorSpeed;
    const bladeWidth = Math.cos(currentRotorAngle) * 45;
    ctx.strokeStyle = isPiloted ? '#e2e8f0' : '#64748b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-bladeWidth, -16);
    ctx.lineTo(bladeWidth, -16);
    ctx.stroke();

    // Rotor Hub
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Blinking LED Nav Lights
    // Red LED on Tail
    const redBlink = Math.floor(Date.now() / 400) % 2 === 0;
    ctx.fillStyle = redBlink ? '#ef4444' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(-35, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Green LED on Main Rotor Tip
    const greenBlink = Math.floor(Date.now() / 200) % 2 === 0;
    ctx.fillStyle = greenBlink ? '#22c55e' : '#14532d';
    ctx.beginPath();
    ctx.arc(bladeWidth, -16, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Searchlight Spotlight Cone (Golden Beam from Nose)
    ctx.save();
    const lightOriginX = 14;
    const lightOriginY = 4;

    const lightGrad = ctx.createLinearGradient(lightOriginX, lightOriginY, lightOriginX + 60, lightOriginY + 120);
    lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    lightGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.15)');
    lightGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');

    ctx.fillStyle = lightGrad;
    ctx.beginPath();
    ctx.moveTo(lightOriginX, lightOriginY);
    ctx.lineTo(lightOriginX - 35, lightOriginY + 130);
    ctx.lineTo(lightOriginX + 75, lightOriginY + 130);
    ctx.closePath();
    ctx.fill();

    // Floating Light Dust Motes in Cone
    ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
    for (let m = 0; m < 5; m++) {
      const mx = lightOriginX + Math.sin(Date.now() * 0.002 + m) * 20;
      const my = lightOriginY + 20 + ((Date.now() * 0.03 + m * 25) % 100);
      ctx.beginPath();
      ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Side Rocket Pod
    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, 4, 14, 5);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, 5, 2, 3);

    ctx.restore();

    // HP Bar
    const hpPct = Math.max(0, heli.hp / heli.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(heli.x - 20, heli.y - 28, 40, 5);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.2 ? '#eab308' : '#ef4444';
    ctx.fillRect(heli.x - 20, heli.y - 28, 40 * hpPct, 5);

    if (isMyTurn && activeSlug && !activeSlug.inVehicleId) {
      const dist = Math.hypot(activeSlug.x - heli.x, activeSlug.y - heli.y);
      if (dist < 65) {
        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚁 [ENTRER / E] pour Piloter', heli.x, heli.y - 36);
      }
    }
  }
}

/**
 * Vector rendering for held utility weapons on active slugs.
 * Clean, lightweight, zero DOM allocation.
 */

export function drawHeldMagnet(ctx: CanvasRenderingContext2D, animTime: number): void {
  // Classic horseshoe magnet with red/blue poles and silver tips
  ctx.save();
  ctx.translate(6, 0);

  // Red horseshoe arch
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.arc(0, 0, 4.8, Math.PI * 0.5, Math.PI * 1.5, false);
  ctx.stroke();

  // Upper prong (Red + Silver tip)
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(0, -4.8);
  ctx.lineTo(4, -4.8);
  ctx.stroke();
  ctx.strokeStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(4, -4.8);
  ctx.lineTo(7, -4.8);
  ctx.stroke();

  // Lower prong (Blue + Silver tip)
  ctx.strokeStyle = '#3b82f6';
  ctx.beginPath();
  ctx.moveTo(0, 4.8);
  ctx.lineTo(4, 4.8);
  ctx.stroke();
  ctx.strokeStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(4, 4.8);
  ctx.lineTo(7, 4.8);
  ctx.stroke();

  // Pulsing magnetic field sparkle
  const glow = 0.5 + 0.5 * Math.sin(animTime * 12);
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.4 * glow})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(6, 0, 3.5, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();

  ctx.restore();
}

export function drawHeldPneumaticDrill(ctx: CanvasRenderingContext2D, animTime: number): void {
  ctx.save();
  // Slight mechanical idle vibration
  const vib = Math.sin(animTime * 25) * 0.4;
  ctx.translate(6, vib);

  // Top handles
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-2, -7, 8, 2.2);
  ctx.fillRect(1, -7, 2, 4);

  // Heavy pneumatic body (Yellow industrial casing)
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.fillRect(0, -3, 5, 8);
  ctx.strokeRect(0, -3, 5, 8);

  // Steel cylinder
  ctx.fillStyle = '#64748b';
  ctx.fillRect(1, 5, 3, 3);

  // Pointed reciprocating drill bit
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(1, 8);
  ctx.lineTo(4, 8);
  ctx.lineTo(2.5, 13);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawHeldParachute(ctx: CanvasRenderingContext2D): void {
  // Military olive deployment backpack with straps & golden ripcord ring
  ctx.save();
  ctx.translate(4, -1);

  // Canvas pack
  ctx.fillStyle = '#3f6212';
  ctx.strokeStyle = '#14532d';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(-2, -4, 9, 8, 2);
  ctx.fill();
  ctx.stroke();

  // Center webbing strap
  ctx.fillStyle = '#18181b';
  ctx.fillRect(1, -4, 3, 8);

  // Gold ripcord ring
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(6, 1, 1.8, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

export function drawHeldJetpack(ctx: CanvasRenderingContext2D, animTime: number): void {
  // Twin high-tech steel thruster tanks with glowing thruster nozzles
  ctx.save();
  ctx.translate(4, -1);

  // Main booster tank 1
  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.fillRect(-1, -5, 4, 8);
  ctx.strokeRect(-1, -5, 4, 8);

  // Main booster tank 2
  ctx.fillStyle = '#64748b';
  ctx.fillRect(4, -4, 4, 8);
  ctx.strokeRect(4, -4, 4, 8);

  // Connector bracket
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(2, -2, 3, 3);

  // Exhaust nozzles
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 3, 2.5, 2);
  ctx.fillRect(5, 4, 2.5, 2);

  // Tiny idle pilot glow
  const flameGlow = 0.5 + 0.5 * Math.sin(animTime * 15);
  ctx.fillStyle = `rgba(249, 115, 22, ${flameGlow})`;
  ctx.beginPath();
  ctx.arc(1.2, 6, 1.2, 0, Math.PI * 2);
  ctx.arc(6.2, 7, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawHeldAirdrop(ctx: CanvasRenderingContext2D, animTime: number): void {
  // Military emergency radio flare beacon
  ctx.save();
  ctx.translate(5, 0);

  // Radio transmitter box
  ctx.fillStyle = '#1e3a5f';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1;
  ctx.fillRect(-2, -3, 7, 6);
  ctx.strokeRect(-2, -3, 7, 6);

  // Antenna
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(1.5, -3);
  ctx.lineTo(1.5, -9);
  ctx.stroke();

  // Blinking beacon light on top of antenna
  const blink = Math.sin(animTime * 8) > 0;
  ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
  ctx.beginPath();
  ctx.arc(1.5, -9.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

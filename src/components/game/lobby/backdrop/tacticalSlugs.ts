import { drawSafeEllipse, drawRoundRect } from './lobbyGeometry';

export const drawTacticalSlug = (
  c: CanvasRenderingContext2D,
  scale: number,
  gear: 'NIGHT_VISION' | 'RADIO_COMM',
  facingRight: boolean = true,
  t: number = 0
) => {
  c.save();
  c.scale(facingRight ? scale : -scale, scale);

  c.fillStyle = 'rgba(0, 0, 0, 0.45)';
  drawSafeEllipse(c, 0, 16, 22, 6);
  c.fill();

  const bodyGrad = c.createRadialGradient(-3, -3, 3, 0, 5, 24);
  bodyGrad.addColorStop(0, '#fbcfe8');
  bodyGrad.addColorStop(0.45, '#ec4899');
  bodyGrad.addColorStop(1, '#831843');

  c.fillStyle = bodyGrad;
  c.strokeStyle = '#18181b';
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(-20, 14);
  c.quadraticCurveTo(-24, 2, -12, -8);
  c.quadraticCurveTo(-2, -20, 14, -12);
  c.quadraticCurveTo(24, 2, 20, 14);
  c.quadraticCurveTo(0, 19, -20, 14);
  c.closePath();
  c.fill();
  c.stroke();

  c.strokeStyle = '#ec4899';
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(2, -8);
  c.lineTo(3, -15);
  c.moveTo(11, -6);
  c.lineTo(13, -13);
  c.stroke();

  c.fillStyle = '#ffffff';
  c.strokeStyle = '#18181b';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(3, -15, 7, 0, Math.PI * 2);
  c.arc(13, -13, 6, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  const pupilShift = Math.sin(t * 1.8) * 1.8;
  c.fillStyle = '#09090b';
  c.beginPath();
  c.arc(4 + pupilShift, -15, 2.8, 0, Math.PI * 2);
  c.arc(14 + pupilShift, -13, 2.4, 0, Math.PI * 2);
  c.fill();

  if (gear === 'NIGHT_VISION') {
    c.fillStyle = '#1e293b';
    c.strokeStyle = '#18181b';
    c.lineWidth = 2;
    drawRoundRect(c, -3, -19, 11, 9, 3);
    c.fill();
    c.stroke();
    drawRoundRect(c, 8, -17, 10, 8, 3);
    c.fill();
    c.stroke();

    c.fillStyle = '#10b981';
    c.beginPath();
    c.arc(2.5, -14.5, 3, 0, Math.PI * 2);
    c.arc(13, -13, 2.6, 0, Math.PI * 2);
    c.fill();
  } else if (gear === 'RADIO_COMM') {
    // Left/Rear Tactical Earcup
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#18181b';
    c.lineWidth = 1.4;
    drawSafeEllipse(c, -3, -15, 3.5, 6.5, 0.1);
    c.fill();
    c.stroke();
    c.fillStyle = '#38bdf8';
    drawSafeEllipse(c, -3, -15, 1.8, 3.8, 0.1);
    c.fill();

    // Tactical Headband Arch
    c.strokeStyle = '#0f172a';
    c.lineWidth = 3.8;
    c.beginPath();
    c.moveTo(-3, -17);
    c.quadraticCurveTo(7, -26, 18, -15);
    c.stroke();

    c.strokeStyle = '#38bdf8';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-2, -18);
    c.quadraticCurveTo(7, -25, 17, -16);
    c.stroke();

    // Right/Front Tactical Earcup
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#18181b';
    c.lineWidth = 1.4;
    drawSafeEllipse(c, 18, -13, 3.5, 6.5, 0.1);
    c.fill();
    c.stroke();
    c.fillStyle = '#38bdf8';
    drawSafeEllipse(c, 18, -13, 1.8, 3.8, 0.1);
    c.fill();

    // Flexible Boom Microphone
    c.strokeStyle = '#64748b';
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(18, -10);
    c.quadraticCurveTo(20, -3, 13, 0);
    c.stroke();

    // Foam Mic Windscreen
    c.fillStyle = '#09090b';
    c.strokeStyle = '#18181b';
    c.lineWidth = 1.0;
    c.beginPath();
    c.arc(13, 0, 2.0, 0, Math.PI * 2);
    c.fill();
    c.stroke();

    // Tactical Antenna with Flashing Radio LED
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-3, -18);
    c.lineTo(-14, -36);
    c.stroke();

    c.fillStyle = Math.sin(t * 7) > 0 ? '#ef4444' : '#7f1d1d';
    c.beginPath();
    c.arc(-14, -36, 2.8, 0, Math.PI * 2);
    c.fill();
  }

  c.restore();
};

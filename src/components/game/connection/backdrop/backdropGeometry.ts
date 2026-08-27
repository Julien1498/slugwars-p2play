export const drawRoundRect = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number = 4
) => {
  const radius = Math.min(Math.max(0, r), Math.abs(w) / 2, Math.abs(h) / 2);
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + w - radius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + radius);
  c.lineTo(x + w, y + h - radius);
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  c.lineTo(x + radius, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
};

export const drawSafeEllipse = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot: number = 0,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2
) => {
  const safeRx = Math.max(0.1, Math.abs(rx));
  const safeRy = Math.max(0.1, Math.abs(ry));
  c.beginPath();
  c.ellipse(x, y, safeRx, safeRy, rot, startAngle, endAngle);
};

export const drawRockyLedge = (
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  c.save();
  c.translate(x, y);

  // Rock Body
  c.fillStyle = '#27272a';
  c.strokeStyle = '#18181b';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.quadraticCurveTo(-w / 2 - 10, h * 0.5, -w * 0.2, h);
  c.quadraticCurveTo(0, h + 15, w * 0.2, h);
  c.quadraticCurveTo(w / 2 + 10, h * 0.5, w / 2, 0);
  c.closePath();
  c.fill();
  c.stroke();

  // Top Lush Grass Layer
  c.fillStyle = '#15803d';
  drawRoundRect(c, -w / 2 - 4, -4, w + 8, 12, 6);
  c.fill();
  c.fillStyle = '#22c55e';
  drawRoundRect(c, -w / 2 - 2, -4, w + 4, 6, 3);
  c.fill();

  // Grass fringe details
  c.strokeStyle = '#4ade80';
  c.lineWidth = 2.5;
  c.beginPath();
  for (let gx = -w / 2 + 8; gx <= w / 2 - 8; gx += 12) {
    c.moveTo(gx, 4);
    c.lineTo(gx + 2, 9);
  }
  c.stroke();

  c.restore();
};

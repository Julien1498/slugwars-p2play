export function drawHeldSheep(ctx: CanvasRenderingContext2D): void {
  // Fluffy little sheep in slug's hands
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.arc(6, -1, 4.5, 0, Math.PI * 2);
  ctx.arc(9, -2, 4, 0, Math.PI * 2);
  ctx.arc(6, 2, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Pink head
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(11, -1, 2.8, 2.2, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(11.5, -1.8, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHeldOldLady(ctx: CanvasRenderingContext2D): void {
  // Brown leather handbag with clasp in slug's hands
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.0;
  ctx.fillRect(4, -3, 8, 7);
  ctx.strokeRect(4, -3, 8, 7);

  // Gold clasp
  ctx.fillStyle = '#eab308';
  ctx.fillRect(7, -3.5, 2, 1.5);

  // Handle strap
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(8, -4, 3, Math.PI, 0);
  ctx.stroke();
}

export function drawHeldArmageddon(ctx: CanvasRenderingContext2D): void {
  // Dark leather forbidden grimoire with flaming rune
  ctx.fillStyle = '#1e1b4b';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.2;
  ctx.fillRect(4, -4, 9, 8);
  ctx.strokeRect(4, -4, 9, 8);

  // Flaming Meteor Sigil
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.arc(8.5, 0, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawHeldHandgun(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#334155';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.fillRect(3, -2, 10, 3.5);
  ctx.strokeRect(3, -2, 10, 3.5);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(1, 0, 4, 6);
}

export function drawHeldUzi(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.2;
  ctx.fillRect(2, -3, 14, 5);
  ctx.strokeRect(2, -3, 14, 5);
  ctx.fillStyle = '#475569';
  ctx.fillRect(14, -1.5, 3, 2);
  ctx.fillRect(6, 2, 4, 7);
}

export function drawHeldClusterBomb(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = '#ca8a04';
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(8, 0, 5.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(4, -1, 8, 2);
}
